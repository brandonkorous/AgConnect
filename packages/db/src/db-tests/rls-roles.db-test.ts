import { after, before, test } from 'node:test';
import assert from 'node:assert/strict';
import type { PrismaClient } from '@prisma/client';
import { pools } from '../pools.js';
import { dbClients, runWithRlsContext } from '../rls.js';
import { adminClient, seedFixture } from './fixtures.js';
import { SCENARIOS, TABLES, type Scenario } from './matrix.js';

// Each app.role reads exactly its own fixture rows, as agconn_app (pnpm test:db).
let admin: PrismaClient;
before(async () => {
  admin = adminClient();
  await seedFixture(admin);
});
after(async () => {
  await admin.$disconnect();
  await pools.shared.$disconnect();
});

async function visible(scenario: Scenario, table: string): Promise<string[]> {
  const spec = TABLES[table]!;
  const byKey = new Map(Object.entries(spec.rows).map(([label, key]) => [key, label]));
  const sql = `SELECT "${spec.key}"::text AS k FROM "${table}" WHERE "${spec.key}"::text = ANY($1::text[])`;
  const read = (db: PrismaClient) => db.$queryRawUnsafe<{ k: string }[]>(sql, [...byKey.keys()]);
  const rows = scenario.ctx
    ? await runWithRlsContext(scenario.ctx, () => read(dbClients.shared))
    : await read(pools.shared);
  return rows.map((r) => byKey.get(r.k)!).sort();
}

for (const scenario of SCENARIOS) {
  test(`RLS: ${scenario.name}`, async (t) => {
    for (const table of Object.keys(TABLES)) {
      await t.test(table, async () => {
        const expected = [...(scenario.sees[table] ?? [])].sort();
        assert.deepEqual(await visible(scenario, table), expected);
      });
    }
  });
}
