#!/usr/bin/env node
// Convention check: every API route file that performs a Prisma mutation
// (.create / .update / .upsert / .delete / .createMany / .updateMany /
// .deleteMany) must reference the audit logger at least once in the same
// file. The pairing is enforced at file granularity — a route that doesn't
// audit a write fails the build.
//
// This is the audit-required rule called out in the Phase 0 DoD. A regex
// scanner is used over a full ESLint plugin because it covers the cases we
// have (one or two writes per route file) and runs in <50ms on the whole
// monorepo. Promote to an AST-based plugin when the heuristic gets noisy.

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, relative, resolve } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(here, '..');
const API_SRC = resolve(ROOT, 'services/api/src');

// Files exempt from the rule — middleware that defines the audit helpers,
// webhooks that audit conditionally, and the entry point.
const EXEMPT_PATHS = [
  'middleware/audit.ts',
  'middleware/authContext.ts',
  'middleware/adminContext.ts',
  'middleware/tenantContext.ts',
  'middleware/rateLimit.ts',
  'instrument.ts',
  'index.ts',
];

const MUTATION_RE = /\b(?:db|tx|prisma)\.[a-zA-Z][a-zA-Z0-9_]*\.(?:create|createMany|update|updateMany|upsert|delete|deleteMany)\s*\(/;
const AUDIT_REFERENCE_RE = /\b(?:audit\.log|emitSystemAudit|buildAuditRow|writeAuditRow)\s*\(/;
// Per-file opt-out marker. The comment MUST include a reason after the colon
// so the next reader can audit the audit exemption. Example:
//   // audit-required:exempt — audited at the route layer (admin.audit.redacted)
const EXEMPT_COMMENT_RE = /\/\/\s*audit-required:exempt\b\s*[—:-]\s*\S+/;

function walk(dir) {
  const out = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      out.push(...walk(full));
    } else if (full.endsWith('.ts')) {
      out.push(full);
    }
  }
  return out;
}

const errors = [];

for (const file of walk(API_SRC)) {
  const rel = relative(API_SRC, file).replaceAll('\\', '/');
  if (EXEMPT_PATHS.includes(rel)) continue;

  const text = readFileSync(file, 'utf8');
  if (!MUTATION_RE.test(text)) continue;
  if (AUDIT_REFERENCE_RE.test(text)) continue;
  if (EXEMPT_COMMENT_RE.test(text)) continue;

  errors.push(`services/api/src/${rel}: contains a Prisma mutation but no audit.log() / emitSystemAudit() / buildAuditRow() call in the file`);
}

if (errors.length > 0) {
  console.error('check-audit-required: mutations without audit pairing');
  for (const e of errors) console.error('  - ' + e);
  console.error('\nEither add c.var.audit.log({ action, ... }) for the mutation, or extend EXEMPT_PATHS in scripts/check-audit-required.mjs (and document why).');
  process.exit(1);
}

console.log('check-audit-required: ok');
