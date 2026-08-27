#!/usr/bin/env node
// Loads AGCONN's runtime secrets into an Azure Key Vault, so the deploy
// pipeline has something to read.
//
// WHY THIS EXISTS. `.github/workflows/deploy.yml` builds the `agconn-env`
// Secret by reading ~26 required names out of Key Vault. Terraform creates the
// vault EMPTY and always will: with Postgres and object storage on Supabase,
// there is nothing for Azure to mint, so every value here is human-supplied.
// The alternative to this script is 26 hand-typed `az keyvault secret set`
// invocations, which is where transcription errors come from.
//
// WHEN TO RUN IT. Once, after `terraform apply` creates kv-agconn-prod-cus and
// before the first real deploy. Again whenever a credential rotates.
//
// WHAT IT TOUCHES. Only the named vault. It never writes to `.env`, never
// prints a secret value, and never deletes a secret — a vault secret is
// VERSIONED, so re-running is additive and safe. Running it twice is fine and
// is the normal way to fix one wrong value.
//
// WHAT IT CANNOT DO. Recover anything that exists only as a GitHub Actions
// secret. Those are write-only; GitHub has no read API. Values absent from
// `.env` and not generated below have to come from the vendor's own dashboard.
//
//   node scripts/load-keyvault.mjs                      # dry run, the default
//   node scripts/load-keyvault.mjs --apply              # actually write
//   node scripts/load-keyvault.mjs --apply --overwrite  # replace existing too
//
// Requires `az login` as a principal holding `Key Vault Secrets Officer` on the
// vault. Subscription Owner does NOT imply it — Key Vault's data plane is its
// own RBAC surface, and without the role this fails with a 403 that says
// nothing about a missing role.

import { readFileSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { randomBytes } from 'node:crypto';

const VAULT = process.env.AGCONN_KEY_VAULT ?? 'kv-agconn-prod-cus';
const ENV_FILE = process.env.AGCONN_ENV_FILE ?? '.env';
const APPLY = process.argv.includes('--apply');
const OVERWRITE = process.argv.includes('--overwrite');

// Mirrors the `required` array in .github/workflows/deploy.yml. A name here and
// not there is a secret nothing reads; a name there and not here fails the
// deploy at the "Read secrets from Key Vault" step.
const REQUIRED = [
  'DATABASE_URL', 'DIRECT_URL',
  'AUDIT_HMAC_KEY', 'AUDIT_HMAC_KEY_VERSION',
  'ADMIN_BEARER_TOKEN', 'PARTICIPANT_PEPPER',
  'CLERK_SECRET_KEY', 'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY',
  'CLERK_WEBHOOK_SECRET', 'CLERK_ENCRYPTION_KEY',
  'ADMIN_CLERK_SECRET_KEY', 'NEXT_PUBLIC_ADMIN_CLERK_PUBLISHABLE_KEY',
  'NEXT_PUBLIC_ADMIN_URL',
  'RESEND_API_KEY', 'RESEND_WEBHOOK_SECRET',
  'WAITLIST_TOKEN_SECRET',
  'SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY',
  'TWILIO_ACCOUNT_SID', 'TWILIO_AUTH_TOKEN',
  'TWILIO_MESSAGING_SERVICE_SID', 'TWILIO_INBOUND_PHONE',
  'STRIPE_SECRET_KEY', 'STRIPE_WEBHOOK_SECRET',
  'INTERNAL_REVALIDATE_SECRET', 'WEB_INTERNAL_BASE_URL',
];

const OPTIONAL = [
  'SENTRY_DSN', 'NEXT_PUBLIC_SENTRY_DSN', 'SENTRY_AUTH_TOKEN',
  'SENTRY_ORG', 'SENTRY_PROJECT', 'SENTRY_PROJECT_ADMIN',
  'NEXT_PUBLIC_SENTRY_DSN_ADMIN',
  'NEXT_PUBLIC_POSTHOG_KEY', 'POSTHOG_API_KEY',
  'NEXT_PUBLIC_MAPBOX_TOKEN',
  'STRIPE_PRICE_PRO_MONTHLY', 'STRIPE_PRICE_PRO_YEARLY',
  'STRIPE_PRICE_ENT_MONTHLY', 'STRIPE_PRICE_ENT_YEARLY',
  'STRIPE_PRICE_PRO_FOUNDER_MONTHLY', 'STRIPE_PRICE_PRO_FOUNDER_YEARLY',
  'STRIPE_PRICE_ENT_FOUNDER_MONTHLY', 'STRIPE_PRICE_ENT_FOUNDER_YEARLY',
  'ANTHROPIC_API_KEY', 'OPENAI_API_KEY', 'LLM_FALLBACKS',
];

// Values that are production facts or freshly generated key material, rather
// than anything a vendor issues. `.env` holds localhost variants of the two
// URLs, so taking them from there would quietly deploy a broken revalidate hook.
const DERIVED = {
  WEB_INTERNAL_BASE_URL: () => 'http://web',
  NEXT_PUBLIC_ADMIN_URL: () => 'https://admin.agconn.com',
  // Both documented in .env.example with these exact generation commands.
  // ALPHANUMERIC-SAFE encodings on purpose: base64 and hex both survive a
  // dotenv line, a shell variable and a k8s Secret without the three having to
  // agree about escaping. A trailing CR in key material silently reconstructs a
  // DIFFERENT key rather than failing.
  INTERNAL_REVALIDATE_SECRET: () => randomBytes(48).toString('base64'),
  CLERK_ENCRYPTION_KEY: () => randomBytes(32).toString('hex'),
};

// Credentials whose prefix says which mode they belong to. Loading a test-mode
// key into a production vault produces a site that boots, passes every health
// check, and authenticates nobody real — the failure this script most wants to
// prevent, because nothing downstream reports it as an error.
const MODE_HINTS = [
  { match: /^(CLERK_SECRET_KEY|ADMIN_CLERK_SECRET_KEY)$/, test: /^sk_test_/ },
  { match: /_CLERK_PUBLISHABLE_KEY$/, test: /^pk_test_/ },
  { match: /^STRIPE_SECRET_KEY$/, test: /^sk_test_/ },
];

function parseEnvFile(path) {
  if (!existsSync(path)) return {};
  const out = {};
  for (const raw of readFileSync(path, 'utf8').split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;
    const eq = line.indexOf('=');
    if (eq < 1) continue;
    let value = line.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    out[line.slice(0, eq).trim()] = value;
  }
  return out;
}

function vaultName(envName) {
  // Case PRESERVING, matching the `${name//_/-}` mapping the workflow uses and
  // the convention jotacular and kanNINJA follow. sparx's own pipeline lowercases
  // instead; mixing the two produces a secret that reads as present in the portal
  // and is never found at deploy time.
  return envName.replaceAll('_', '-');
}

function existingSecretNames() {
  try {
    const out = execFileSync(
      'az',
      ['keyvault', 'secret', 'list', '--vault-name', VAULT, '--query', '[].name', '-o', 'tsv'],
      { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] },
    );
    return new Set(out.split(/\r?\n/).map((s) => s.trim()).filter(Boolean));
  } catch (err) {
    console.error(`\ncannot list secrets in ${VAULT}.`);
    console.error('check `az login`, the vault name, and that you hold Key Vault Secrets Officer.');
    console.error(String(err.stderr ?? err.message).trim().split('\n').slice(0, 3).join('\n'));
    process.exit(1);
  }
}

function setSecret(name, value) {
  // The value goes through spawn's ARGUMENT ARRAY, never a shell string: no
  // quoting rules to get wrong, no shell history, no trailing-newline ambiguity
  // that `--file` would introduce. It is briefly visible in the child process's
  // argv, which is the accepted tradeoff on an operator's own machine.
  execFileSync(
    'az',
    ['keyvault', 'secret', 'set', '--vault-name', VAULT, '--name', name, '--value', value, '-o', 'none'],
    { stdio: ['ignore', 'ignore', 'pipe'] },
  );
}

const env = parseEnvFile(ENV_FILE);
const existing = existingSecretNames();

const plan = [];
const missing = [];
const warnings = [];

for (const name of [...REQUIRED, ...OPTIONAL]) {
  const required = REQUIRED.includes(name);
  const value = DERIVED[name] ? DERIVED[name]() : env[name];

  if (!value) {
    if (required) missing.push(name);
    continue;
  }

  for (const hint of MODE_HINTS) {
    if (hint.match.test(name) && hint.test.test(value)) {
      warnings.push(`${name} looks like a TEST-mode credential`);
    }
  }

  const kv = vaultName(name);
  const already = existing.has(kv);
  if (already && !OVERWRITE) {
    plan.push({ kv, name, action: 'skip', note: 'already set; --overwrite to replace' });
  } else {
    plan.push({
      kv,
      name,
      value,
      action: already ? 'replace' : 'create',
      note: DERIVED[name] ? 'generated' : `from ${ENV_FILE}`,
    });
  }
}

console.log(`vault:  ${VAULT}`);
console.log(`source: ${ENV_FILE}${existsSync(ENV_FILE) ? '' : '  (NOT FOUND)'}`);
console.log(`mode:   ${APPLY ? 'APPLY' : 'dry run — pass --apply to write'}\n`);

for (const p of plan) {
  console.log(`  ${p.action.padEnd(8)} ${p.kv.padEnd(42)} ${p.note}`);
}

if (warnings.length) {
  console.log('\nWARNINGS');
  for (const w of warnings) console.log(`  ${w}`);
  console.log('  A test-mode key in a production vault boots cleanly and serves nobody real.');
}

if (missing.length) {
  console.log(`\nMISSING — ${missing.length} required value(s) not in ${ENV_FILE}:`);
  for (const m of missing) console.log(`  ${m}  ->  az keyvault secret set --vault-name ${VAULT} --name ${vaultName(m)} --value '...'`);
  console.log('\nThese cannot be recovered from GitHub Actions secrets — that store is write-only.');
  console.log('Get them from the vendor dashboard (Clerk, Resend, Twilio, Stripe).');
}

if (!APPLY) {
  console.log('\nNothing written. Re-run with --apply once the plan above looks right.');
  process.exit(missing.length ? 1 : 0);
}

let written = 0;
for (const p of plan) {
  if (p.action === 'skip') continue;
  try {
    setSecret(p.kv, p.value);
    written += 1;
    console.log(`  wrote ${p.kv}`);
  } catch (err) {
    console.error(`  FAILED ${p.kv}: ${String(err.stderr ?? err.message).trim().split('\n')[0]}`);
    process.exitCode = 1;
  }
}

console.log(`\n${written} secret(s) written to ${VAULT}.`);
if (missing.length) {
  console.log(`${missing.length} required value(s) still missing — the deploy will fail until they are set.`);
  process.exitCode = 1;
}
