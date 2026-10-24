import { test } from 'node:test';
import assert from 'node:assert/strict';
import type { PrismaClient } from '@prisma/client';
import { asService, makeRlsClient } from './rls.js';

// A fake client that records the app.role each query ran under.
function fakeClient(seen: string[]): PrismaClient {
  let role = '';
  const tx = {
    $queryRaw: async (_s: TemplateStringsArray, r: string) => {
      role = r;
    },
    enrollment: { findMany: async () => (seen.push(role), [{ id: 'e1' }]) },
  };
  const $transaction = async (cb: (t: typeof tx) => unknown) => ((role = ''), cb(tx));
  return { $transaction, enrollment: tx.enrollment } as never;
}

test('asService runs dbClients queries as the service role', async () => {
  const seen: string[] = [];
  const db = makeRlsClient(fakeClient(seen));
  const rows = await asService(async () => db.enrollment.findMany())();
  assert.deepEqual(seen, ['service']);
  assert.equal(rows.length, 1);
});

test('without asService no role is set', async () => {
  const seen: string[] = [];
  await makeRlsClient(fakeClient(seen)).enrollment.findMany();
  assert.deepEqual(seen, ['']);
});

test('asService passes arguments and return values through', async () => {
  const add = asService(async (a: number, b: number) => a + b);
  assert.equal(await add(2, 3), 5);
});
