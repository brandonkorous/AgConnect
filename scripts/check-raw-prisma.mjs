#!/usr/bin/env node
// Convention check: only packages/db (its client, migrations, seeds and ops scripts) may use the raw `prisma` client.
// Everything else goes through dbClients / serviceDb / adminDb, which apply an app.role so RLS decides access.
// When to run: part of `pnpm check:conventions`. Read-only; safe to run repeatedly.

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const SCAN = ['apps', 'services', 'packages', 'scripts'];
const ALLOWED = ['packages/db/'];
const SKIP_DIRS = new Set(['node_modules', 'dist', '.next', '.turbo', 'coverage']);
const EXT = /\.(ts|tsx|mts|js|mjs)$/;

// `prisma` named in an import or destructure from @agconn/db or packages/db/src.
const IMPORT = /(?:import\s*(?:type\s*)?\{([^}]*)\}\s*from|const\s*\{([^}]*)\}\s*=\s*await\s+import\()\s*['"](@agconn\/db|[./]+(?:packages\/db\/)?src\/index(?:\.js|\.ts)?)['"]/g;

function* files(dir) {
  for (const name of readdirSync(dir)) {
    if (SKIP_DIRS.has(name)) continue;
    const path = join(dir, name);
    if (statSync(path).isDirectory()) yield* files(path);
    else if (EXT.test(name)) yield path;
  }
}

function offenders(path) {
  const found = [];
  for (const m of readFileSync(path, 'utf8').matchAll(IMPORT)) {
    const names = (m[1] ?? m[2] ?? '').split(',').map((n) => n.trim().split(/\s+as\s+|\s*:\s*/)[0]);
    if (names.includes('prisma')) found.push(m[0].replace(/\s+/g, ' ').slice(0, 120));
  }
  return found;
}

const problems = [];
for (const top of SCAN) {
  for (const path of files(join(ROOT, top))) {
    const rel = relative(ROOT, path).replaceAll('\\', '/');
    if (ALLOWED.some((prefix) => rel.startsWith(prefix))) continue;
    for (const hit of offenders(path)) problems.push(`${rel}: ${hit}`);
  }
}

if (problems.length > 0) {
  console.error('Raw `prisma` imported outside packages/db; use dbClients, serviceDb or adminDb instead:');
  for (const p of problems) console.error(`  ${p}`);
  process.exit(1);
}
console.log('check-raw-prisma: ok');
