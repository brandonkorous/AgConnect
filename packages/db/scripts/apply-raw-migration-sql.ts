// One-off recovery: applies all migration .sql files against the current DB.
// Use after a `prisma db push --force-reset` to re-apply functions, RLS
// policies, partitions, triggers, and other non-table SQL that `db push`
// silently skips.
//
// Strategy: read each migration's migration.sql in order. For each statement:
//   - try to execute it
//   - if the error is "already exists" / "duplicate", swallow and continue
//   - any other error is logged and we keep going (best-effort recovery)
//
// Idempotent on re-run.
//
// Usage: pnpm --filter @agconn/db tsx scripts/apply-raw-migration-sql.ts

import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readdirSync, readFileSync } from 'node:fs';
import { config as loadEnv } from 'dotenv';

const here = dirname(fileURLToPath(import.meta.url));
loadEnv({ path: resolve(here, '..', '..', '..', '.env') });

const { prisma } = await import('../src/index.js');

const migrationsDir = resolve(here, '..', 'prisma', 'migrations');
const dirs = readdirSync(migrationsDir, { withFileTypes: true })
  .filter((d) => d.isDirectory() && /^\d{14}_/.test(d.name))
  .map((d) => d.name)
  .sort();

const SWALLOW_PATTERNS = [
  /already exists/i,
  /duplicate/i,
  /multiple primary keys/i,
  /relation .* already exists/i,
  /constraint .* already exists/i,
  /role .* already exists/i,
  /policy .* already exists/i,
  /column .* already exists/i,
];

function shouldSwallow(msg: string) {
  return SWALLOW_PATTERNS.some((re) => re.test(msg));
}

// Naive but workable: split on semicolon-newline. Inside dollar-quoted blocks
// ($$ ... $$) we don't split. This handles the function definitions in our
// migrations without pulling in a real SQL parser.
function splitStatements(sql: string): string[] {
  const out: string[] = [];
  let buf = '';
  let inDollar = false;
  for (const line of sql.split(/\r?\n/)) {
    if (line.includes('$$')) inDollar = !inDollar || (line.match(/\$\$/g)!.length % 2 === 0 ? inDollar : !inDollar);
    buf += line + '\n';
    if (!inDollar && /;\s*$/.test(line) && !line.trim().startsWith('--')) {
      const stmt = buf.trim();
      if (stmt) out.push(stmt);
      buf = '';
    }
  }
  if (buf.trim()) out.push(buf.trim());
  return out;
}

async function applyOne(dir: string) {
  const path = resolve(migrationsDir, dir, 'migration.sql');
  let sql: string;
  try {
    sql = readFileSync(path, 'utf8');
  } catch {
    return { dir, applied: 0, swallowed: 0, errors: 0, missing: true };
  }
  const stmts = splitStatements(sql);
  let applied = 0;
  let swallowed = 0;
  const errs: string[] = [];
  for (const stmt of stmts) {
    try {
      await prisma.$executeRawUnsafe(stmt);
      applied++;
    } catch (e) {
      const msg = (e as Error).message ?? String(e);
      if (shouldSwallow(msg)) {
        swallowed++;
      } else {
        errs.push(msg.split('\n')[0].slice(0, 200));
      }
    }
  }
  return { dir, applied, swallowed, errors: errs.length, errs };
}

async function main() {
  console.log(`Applying ${dirs.length} migrations…\n`);
  for (const dir of dirs) {
    const r = await applyOne(dir);
    const tag =
      'errors' in r && r.errors > 0 ? '⚠' : 'missing' in r ? '·' : '✓';
    console.log(`${tag} ${dir}  (applied=${r.applied} swallowed=${r.swallowed} errors=${r.errors ?? 0})`);
    if ('errs' in r && r.errs && r.errs.length > 0) {
      for (const e of r.errs) console.log(`    └─ ${e}`);
    }
  }
  await prisma.$disconnect();
  console.log('\nDone.');
}

main().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
