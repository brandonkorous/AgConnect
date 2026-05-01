// One-time dump: DB -> packages/db/seed-data/translations/<namespace>.ts
//
// Reads every translation_keys row with tenantId IS NULL and writes one TS
// file per top-level namespace. Each file exports a { [key]: { en, es } }
// map. seed-translations.ts then imports all files in that directory.
//
// Usage: pnpm --filter @agconn/db tsx scripts/dump-translations.ts
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { config as loadEnv } from 'dotenv';

const here = dirname(fileURLToPath(import.meta.url));
loadEnv({ path: resolve(here, '..', '..', '..', '.env') });

const { prisma } = await import('../src/index.js');

const OUT_DIR = resolve(here, '..', 'seed-data', 'translations');
mkdirSync(OUT_DIR, { recursive: true });

interface Row {
    namespace: string;
    key: string;
    locale: string;
    value: string;
}

const rows = (await prisma.$transaction(async (tx) => {
    await tx.$executeRawUnsafe(`SET LOCAL app.role = 'admin'`);
    return tx.translationKey.findMany({
        where: { tenantId: null, status: 'published' },
        select: { namespace: true, key: true, locale: true, value: true },
        orderBy: [{ namespace: 'asc' }, { key: 'asc' }, { locale: 'asc' }],
    });
})) as Row[];

const byNamespace = new Map<string, Map<string, { en?: string; es?: string }>>();
for (const r of rows) {
    if (!byNamespace.has(r.namespace)) byNamespace.set(r.namespace, new Map());
    const ns = byNamespace.get(r.namespace)!;
    if (!ns.has(r.key)) ns.set(r.key, {});
    const pair = ns.get(r.key)!;
    if (r.locale === 'en') pair.en = r.value;
    else if (r.locale === 'es') pair.es = r.value;
}

function stringifyEntry(value: string): string {
    // Use JSON.stringify for safe escaping, then unwrap quotes.
    return JSON.stringify(value);
}

let totalKeys = 0;
for (const [namespace, keys] of byNamespace.entries()) {
    const lines: string[] = [];
    lines.push(`// AUTO-GENERATED initial dump on 2026-05-01.`);
    lines.push(`// Source of truth for namespace "${namespace}".`);
    lines.push(`// Edit this file to update copy; run \`pnpm --filter @agconn/db i18n:seed\` to apply.`);
    lines.push(``);
    lines.push(`import type { TranslationBundle } from '../types';`);
    lines.push(``);
    lines.push(`export const ${camelCase(namespace)}: TranslationBundle = {`);

    const sortedKeys = [...keys.entries()].sort(([a], [b]) => a.localeCompare(b));
    for (const [key, pair] of sortedKeys) {
        lines.push(`    ${stringifyEntry(key)}: {`);
        lines.push(`        en: ${stringifyEntry(pair.en ?? '')},`);
        lines.push(`        es: ${stringifyEntry(pair.es ?? '')},`);
        lines.push(`    },`);
        totalKeys++;
    }

    lines.push(`};`);
    lines.push(``);

    const file = resolve(OUT_DIR, `${namespace}.ts`);
    writeFileSync(file, lines.join('\n'), 'utf-8');
    console.log(`wrote ${file} (${keys.size} keys)`);
}

function camelCase(s: string): string {
    return s.replace(/[-_]+(.)/g, (_, c) => c.toUpperCase());
}

const indexLines: string[] = [];
indexLines.push(`// AUTO-GENERATED. Re-run \`pnpm --filter @agconn/db tsx scripts/dump-translations.ts\` to refresh.`);
indexLines.push(`// Edit individual namespace files; the seed script picks them up automatically.`);
indexLines.push(``);
const namespaces = [...byNamespace.keys()].sort();
for (const ns of namespaces) {
    indexLines.push(`export { ${camelCase(ns)} } from './${ns}.js';`);
}
indexLines.push(``);
indexLines.push(`export const NAMESPACES = ${JSON.stringify(namespaces)} as const;`);
writeFileSync(resolve(OUT_DIR, 'index.ts'), indexLines.join('\n'), 'utf-8');

const typesContent = `// Shared types for namespace seed files.
export interface TranslationPair {
    en: string;
    es: string;
}

export type TranslationBundle = Record<string, TranslationPair>;
`;
writeFileSync(resolve(OUT_DIR, '..', 'types.ts'), typesContent, 'utf-8');

console.log(`\nDone. ${totalKeys} keys across ${byNamespace.size} namespaces.`);
await prisma.$disconnect();
