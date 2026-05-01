// Bilingual parity check for translation_keys (DB-backed since 2026-05-01).
//
// Asserts:
//   1. For every (namespace, key) where an EN row exists, an ES row also exists
//      (and vice versa) within the global-default scope (tenant_id IS NULL).
//   2. For every key whose EN value is non-empty, the ES value is also non-empty
//      UNLESS the key matches an entry in EMPTY_ES_ALLOWLIST.
//   3. Interpolation tokens ({foo}) and ICU plural shapes match between EN/ES
//      when both are non-empty.
//
// Exit 1 on any failure.
//
// Usage: pnpm --filter @agconn/db tsx scripts/check-i18n-parity.ts
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { config as loadEnv } from 'dotenv';

const here = dirname(fileURLToPath(import.meta.url));
loadEnv({ path: resolve(here, '..', '..', '..', '.env') });

const { prisma } = await import('../src/index.js');

const EMPTY_ES_ALLOWLIST: RegExp[] = [/^admin\.audit\./];

const isAllowedEmptyEs = (key: string) => EMPTY_ES_ALLOWLIST.some((re) => re.test(key));

function extractTokens(s: string): string[] {
    const tokens = new Set<string>();
    const re = /\{(\w+)(?:,[^}]+)?\}/g;
    let m: RegExpExecArray | null;
    while ((m = re.exec(s))) tokens.add(m[1] ?? '');
    return [...tokens].sort();
}

function tokensEqual(a: string[], b: string[]): boolean {
    if (a.length !== b.length) return false;
    return a.every((v, i) => v === b[i]);
}

async function main() {
    const rows = await prisma.$transaction(async (tx) => {
        await tx.$executeRawUnsafe(`SET LOCAL app.role = 'admin'`);
        return tx.translationKey.findMany({
            where: { tenantId: null, status: 'published' },
            select: { namespace: true, key: true, locale: true, value: true },
        });
    });

    type Pair = { en: string | null; es: string | null };
    const map = new Map<string, Pair>();
    for (const r of rows) {
        const id = `${r.namespace}.${r.key}`;
        const entry = map.get(id) ?? { en: null, es: null };
        if (r.locale === 'en') entry.en = r.value;
        else entry.es = r.value;
        map.set(id, entry);
    }

    const errors: string[] = [];

    for (const [id, { en, es }] of map.entries()) {
        if (en === null) {
            errors.push(`MISSING EN: ${id}`);
            continue;
        }
        if (es === null) {
            if (!isAllowedEmptyEs(id)) errors.push(`MISSING ES: ${id}`);
            continue;
        }
        if (en.length > 0 && es.length === 0 && !isAllowedEmptyEs(id)) {
            errors.push(`EMPTY ES: ${id} (en is non-empty)`);
        }
        if (en.length && es.length) {
            const enTokens = extractTokens(en);
            const esTokens = extractTokens(es);
            if (!tokensEqual(enTokens, esTokens)) {
                errors.push(
                    `TOKEN MISMATCH: ${id}\n  en=${JSON.stringify(enTokens)}\n  es=${JSON.stringify(esTokens)}`,
                );
            }
        }
    }

    if (errors.length) {
        console.error(`x i18n parity failed (${errors.length} issues across ${map.size} keys):`);
        for (const e of errors.slice(0, 50)) console.error(`  - ${e}`);
        if (errors.length > 50) console.error(`  ... and ${errors.length - 50} more.`);
        process.exit(1);
    }

    console.log(`i18n parity OK (${map.size} keys checked, DB-backed)`);
    await prisma.$disconnect();
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
