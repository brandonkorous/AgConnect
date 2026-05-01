// Seed translation_keys from packages/db/seed-data/translations/*.ts.
//
// Each per-namespace TS file exports a TranslationBundle map of
// "<key>" -> { en, es }. This script imports them all, flattens, and upserts
// into the translation_keys table as global defaults (tenant_id = NULL,
// status = 'published'). Idempotent — re-run any time.
//
// Usage: pnpm --filter @agconn/db i18n:seed
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { config as loadEnv } from 'dotenv';

const here = dirname(fileURLToPath(import.meta.url));
loadEnv({ path: resolve(here, '..', '..', '..', '.env') });

const { prisma, Lang, TranslationStatus } = await import('../src/index.js');
const bundles = (await import('../seed-data/translations/index.js')) as Record<string, unknown>;

interface Pair {
    en: string;
    es: string;
}

interface FlatRow {
    namespace: string;
    key: string;
    locale: 'en' | 'es';
    value: string;
}

function camelToSnake(s: string): string {
    return s.replace(/[A-Z]/g, (m) => `_${m.toLowerCase()}`);
}

function flatten(): FlatRow[] {
    const out: FlatRow[] = [];
    for (const [exportName, bundle] of Object.entries(bundles)) {
        if (exportName === 'NAMESPACES') continue;
        if (!bundle || typeof bundle !== 'object') continue;
        // Convert exported camelCase name back to namespace (e.g. publicJobs -> public_jobs).
        const namespace = camelToSnake(exportName);
        for (const [key, value] of Object.entries(bundle as Record<string, unknown>)) {
            const pair = value as Partial<Pair>;
            if (typeof pair?.en === 'string') {
                out.push({ namespace, key, locale: 'en', value: pair.en });
            }
            if (typeof pair?.es === 'string') {
                out.push({ namespace, key, locale: 'es', value: pair.es });
            }
        }
    }
    return out;
}

async function main() {
    const allRows = flatten();
    console.log(`Total rows to seed: ${allRows.length}`);

    let inserted = 0;
    let updated = 0;
    let unchanged = 0;
    const now = new Date();

    await prisma.$transaction(
        async (tx) => {
            await tx.$executeRawUnsafe(`SET LOCAL app.role = 'admin'`);

            const existing = await tx.translationKey.findMany({
                where: { tenantId: null },
                select: { id: true, namespace: true, key: true, locale: true, value: true },
            });
            const lookup = new Map<string, { id: string; value: string }>();
            for (const r of existing) {
                lookup.set(`${r.namespace}|${r.key}|${r.locale}`, { id: r.id, value: r.value });
            }

            for (let i = 0; i < allRows.length; i++) {
                const row = allRows[i];
                if (!row) continue;
                const cacheKey = `${row.namespace}|${row.key}|${row.locale}`;
                const found = lookup.get(cacheKey);

                if (found) {
                    if (found.value === row.value) {
                        unchanged++;
                    } else {
                        await tx.translationKey.update({
                            where: { id: found.id },
                            data: {
                                value: row.value,
                                status: TranslationStatus.published,
                                publishedAt: now,
                            },
                        });
                        updated++;
                    }
                } else {
                    await tx.translationKey.create({
                        data: {
                            tenantId: null,
                            namespace: row.namespace,
                            key: row.key,
                            locale: row.locale as (typeof Lang)[keyof typeof Lang],
                            value: row.value,
                            status: TranslationStatus.published,
                            publishedAt: now,
                        },
                    });
                    inserted++;
                }

                if ((i + 1) % 500 === 0) {
                    console.log(`  processed ${i + 1} / ${allRows.length}`);
                }
            }
        },
        { timeout: 300_000, maxWait: 10_000 },
    );

    console.log(`Done. Inserted: ${inserted}, updated: ${updated}, unchanged: ${unchanged}.`);
    await prisma.$disconnect();
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
