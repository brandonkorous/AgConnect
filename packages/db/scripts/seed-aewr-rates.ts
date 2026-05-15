// Seed federal H-2A Adverse Effect Wage Rate (AEWR) rows.
//
// Source: USDOL Employment & Training Administration (ETA) annual AEWR
// publication. Year-effective rates are published in the Federal Register
// each December. Re-run after every annual update or to backfill new states.
//
// Usage: pnpm --filter @agconn/db aewr:seed
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { config as loadEnv } from 'dotenv';

const here = dirname(fileURLToPath(import.meta.url));
loadEnv({ path: resolve(here, '..', '..', '..', '.env') });

const { prisma } = await import('../src/index.js');

interface AewrSeed {
    stateCode: string;
    effectiveFrom: string;
    effectiveTo: string | null;
    hourlyCents: number;
    source: string;
}

// 2026 California AEWR is the only row at MVP launch — AGCONN's current
// market is the Central Valley. Add other state rows as employer demand
// expands. The DOL publishes rates per state annually in the Federal
// Register; the rate listed here was effective at the start of 2026.
const ROWS: AewrSeed[] = [
    {
        stateCode: 'CA',
        effectiveFrom: '2026-01-01',
        effectiveTo: null,
        hourlyCents: 1997,
        source: 'USDOL ETA · 2026 AEWR · 90 FR 102356',
    },
];

async function upsert() {
    await prisma.$transaction(async (tx) => {
        await tx.$executeRawUnsafe(`SET LOCAL app.role = 'admin'`);
        for (const r of ROWS) {
            await tx.aewrRate.upsert({
                where: {
                    stateCode_effectiveFrom: {
                        stateCode: r.stateCode,
                        effectiveFrom: new Date(r.effectiveFrom),
                    },
                },
                create: {
                    stateCode: r.stateCode,
                    effectiveFrom: new Date(r.effectiveFrom),
                    effectiveTo: r.effectiveTo ? new Date(r.effectiveTo) : null,
                    hourlyCents: r.hourlyCents,
                    source: r.source,
                },
                update: {
                    effectiveTo: r.effectiveTo ? new Date(r.effectiveTo) : null,
                    hourlyCents: r.hourlyCents,
                    source: r.source,
                },
            });
        }
    });
    console.log(`aewr_rates: upserted ${ROWS.length}`);
}

await upsert();
await prisma.$disconnect();
