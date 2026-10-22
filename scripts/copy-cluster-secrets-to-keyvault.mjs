#!/usr/bin/env node
// Copies AGCONN's runtime secrets from the live cluster into Key Vault, without
// any value passing through a terminal, a clipboard or a command line.
//
// WHY THIS EXISTS. GitHub Actions secrets cannot be read back, but every one the
// deploy uses was written into the `agconn-env` Secret in the `agconn`
// namespace, and the cluster CAN be read. So the cluster is the source. The two
// values that never reached agconn-env (FONTAWESOME_TOKEN, INDEXNOW_KEY) are
// parked in `agconn-kv-handoff` by .github/workflows/kv-handoff.yml first.
//
// HOW VALUES MOVE. `kubectl get secret -o json` is captured into this process,
// decoded in memory, and sent to the Key Vault REST API with a bearer token
// from `az account get-access-token`. No value is ever printed, written to
// disk, or passed as a child-process argument. Output is names and verdicts.
//
// WHEN TO RUN IT. Once, before deploy.yml switches to reading Key Vault. Safe to
// run again: a value already in the vault is compared in memory and left alone
// when it matches. A DIFFERENT value is only replaced with --overwrite.
//
//   node scripts/copy-cluster-secrets-to-keyvault.mjs            # dry run
//   node scripts/copy-cluster-secrets-to-keyvault.mjs --apply    # write
//   node scripts/copy-cluster-secrets-to-keyvault.mjs --apply --overwrite
//
// WHAT IT TOUCHES. Writes only to the vault. With --apply it also DELETES the
// agconn-kv-handoff Secret once every value from it is in the vault. agconn-env
// is only read.
//
// Requires: kubectl pointed at aks-sparx-prod-cus, and `az login` as a principal
// holding Key Vault Secrets Officer on the vault.

import { execFileSync, execSync } from 'node:child_process';

const VAULT = process.env.AGCONN_KEY_VAULT ?? 'kv-agconn-prod-cus';
const NAMESPACE = 'agconn';
const SOURCES = ['agconn-env', 'agconn-kv-handoff'];
const APPLY = process.argv.includes('--apply');
const OVERWRITE = process.argv.includes('--overwrite');

// SENTRY_RELEASE is the commit sha of the last deploy, set per run from
// github.sha. Storing it would freeze every later release at that commit.
const SKIP = new Set(['SENTRY_RELEASE']);

const VAULT_URL = `https://${VAULT}.vault.azure.net`;
const API = 'api-version=7.4';

function readClusterSecret(name) {
  try {
    const json = execFileSync(
      'kubectl',
      ['-n', NAMESPACE, 'get', 'secret', name, '-o', 'json'],
      { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] },
    );
    const data = JSON.parse(json).data ?? {};
    return Object.fromEntries(
      Object.entries(data).map(([k, v]) => [k, Buffer.from(v, 'base64').toString('utf8')]),
    );
  } catch (err) {
    if (String(err.stderr ?? '').includes('NotFound')) return null;
    throw err;
  }
}

function vaultToken() {
  // az is a .cmd shim on Windows, which execFile cannot launch without a shell.
  // Every argument here is a fixed literal, so the shell sees no secret.
  return execSync(
    'az account get-access-token --resource https://vault.azure.net --query accessToken -o tsv',
    { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] },
  ).trim();
}

// Key Vault names allow only letters, digits and hyphens. Case is preserved,
// matching the `${name//_/-}` lookup the deploy workflows on this cluster use.
const vaultName = (envName) => envName.replaceAll('_', '-');

async function kv(token, method, name, body) {
  const res = await fetch(`${VAULT_URL}/secrets/${name}?${API}`, {
    method,
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (res.status === 404) return null;
  if (!res.ok) {
    const detail = await res.json().catch(() => ({}));
    throw new Error(`${method} ${name}: ${res.status} ${detail?.error?.code ?? ''}`.trim());
  }
  return res.json();
}

const values = new Map();
const origin = new Map();
for (const source of SOURCES) {
  const data = readClusterSecret(source);
  if (!data) {
    console.log(`source ${source}: not found`);
    continue;
  }
  console.log(`source ${source}: ${Object.keys(data).length} keys`);
  for (const [k, v] of Object.entries(data)) {
    if (SKIP.has(k) || !v) continue;
    values.set(k, v);
    origin.set(k, source);
  }
}

if (values.size === 0) {
  console.error('nothing to copy. Is kubectl pointed at aks-sparx-prod-cus?');
  process.exit(1);
}

const token = vaultToken();
console.log(`vault:  ${VAULT}`);
console.log(`mode:   ${APPLY ? 'APPLY' : 'dry run, pass --apply to write'}\n`);

let failed = 0;
const counts = { create: 0, same: 0, replace: 0, differs: 0 };
for (const [name, value] of [...values].sort(([a], [b]) => a.localeCompare(b))) {
  const kvName = vaultName(name);
  try {
    const current = await kv(token, 'GET', kvName);
    let action;
    if (!current) action = 'create';
    else if (current.value === value) action = 'same';
    else action = OVERWRITE ? 'replace' : 'differs';
    counts[action] += 1;

    if (APPLY && (action === 'create' || action === 'replace')) {
      await kv(token, 'PUT', kvName, { value, tags: { source: origin.get(name) } });
    }
    const note = action === 'differs' ? '  (vault value differs, --overwrite to replace)' : '';
    console.log(`  ${action.padEnd(8)} ${kvName}${note}`);
  } catch (err) {
    failed += 1;
    console.error(`  FAILED   ${kvName}: ${err.message}`);
  }
}

console.log(
  `\n${counts.create} new, ${counts.replace} replaced, ${counts.same} already match, ` +
    `${counts.differs} differ, ${failed} failed.`,
);

if (!APPLY) {
  console.log('Nothing written. Re-run with --apply.');
} else if (failed === 0 && counts.differs === 0 && readClusterSecret('agconn-kv-handoff')) {
  execFileSync('kubectl', ['-n', NAMESPACE, 'delete', 'secret', 'agconn-kv-handoff'], {
    stdio: ['ignore', 'ignore', 'pipe'],
  });
  console.log('deleted agconn-kv-handoff.');
}
process.exitCode = failed ? 1 : 0;
