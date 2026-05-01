#!/usr/bin/env node
// Convention check: every tenant-scoped table must have RLS enabled in some
// migration file. Bypassing RLS is the single highest-impact security mistake
// we can make, so this guard fails the build if a table is added without an
// `ALTER TABLE ... ENABLE ROW LEVEL SECURITY`.
//
// Run with: `node scripts/check-rls.mjs`. CI calls it as part of
// `pnpm typecheck`. Exit code != 0 fails the build.

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const SCHEMA = resolve(here, '..', 'packages/db/prisma/schema.prisma');
const MIG_DIR = resolve(here, '..', 'packages/db/prisma/migrations');

// Tables NOT requiring RLS. Most are global lookup tables (no tenant_id);
// some are managed by Prisma migration tooling itself.
const EXEMPT_TABLES = new Set([
  'tenants',
  'email_suppression',
  'sms_opt_out',
  '_prisma_migrations',
]);

// Discover @@map("...") values from schema.prisma — that's our authoritative
// table list, since model names != table names.
const schema = readFileSync(SCHEMA, 'utf8');
const modelTableRe = /@@map\("([a-zA-Z0-9_]+)"\)/g;
const tables = new Set();
let m;
while ((m = modelTableRe.exec(schema)) !== null) tables.add(m[1]);

// Concatenate every migration's SQL.
function collectMigrations(dir) {
  const out = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      out.push(...collectMigrations(full));
    } else if (entry === 'migration.sql') {
      out.push(readFileSync(full, 'utf8'));
    }
  }
  return out;
}

const allSql = collectMigrations(MIG_DIR).join('\n');

const errors = [];
for (const table of tables) {
  if (EXEMPT_TABLES.has(table)) continue;
  const re = new RegExp(`ALTER\\s+TABLE\\s+"?${table}"?\\s+ENABLE\\s+ROW\\s+LEVEL\\s+SECURITY`, 'i');
  if (!re.test(allSql)) {
    errors.push(`table "${table}": missing ENABLE ROW LEVEL SECURITY in any migration`);
  }
}

if (errors.length > 0) {
  console.error('check-rls: missing RLS on tenant-scoped tables');
  for (const e of errors) console.error('  - ' + e);
  console.error('\nAdd ALTER TABLE "<name>" ENABLE ROW LEVEL SECURITY (and policies) in your migration. Add to EXEMPT_TABLES only for genuinely global lookups.');
  process.exit(1);
}

console.log('check-rls: ok');
