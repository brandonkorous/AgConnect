import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { clearImpactCache, getImpact, loadImpact } from './impact-query.js';

type Counts = { transactions: number; raw: number };

function fakeDb(counts: Counts, hired = 40, median: number | null = 18.5) {
  const count = async () => 30;
  const tx = {
    $queryRaw: async () => (counts.raw++, [{ hired, median }]),
    enrollment: { count },
    employerProfile: { count },
    user: { count },
    jobPosting: { count },
  };
  return { $transaction: async (cb: (t: typeof tx) => unknown) => (counts.transactions++, cb(tx)) } as never;
}

beforeEach(() => clearImpactCache());

test('impact runs in one transaction with the median from SQL', async () => {
  const counts = { transactions: 0, raw: 0 };
  const body = await loadImpact(fakeDb(counts), new Date('2026-10-24T00:00:00Z'));
  assert.equal(counts.transactions, 1);
  assert.equal(counts.raw, 1);
  assert.equal(body.medianWage, 18.5);
  assert.equal(body.workersPlaced, 40);
});

test('small hired counts stay suppressed', async () => {
  const body = await loadImpact(fakeDb({ transactions: 0, raw: 0 }, 7, 20), new Date());
  assert.equal(body.workersPlaced, null);
  assert.equal(body.medianWage, null);
});

test('the result is cached for an hour', async () => {
  const counts = { transactions: 0, raw: 0 };
  const t0 = new Date('2026-10-24T00:00:00Z');
  await getImpact(fakeDb(counts), t0);
  await getImpact(fakeDb(counts), new Date(t0.getTime() + 59 * 60 * 1000));
  assert.equal(counts.transactions, 1);
  await getImpact(fakeDb(counts), new Date(t0.getTime() + 61 * 60 * 1000));
  assert.equal(counts.transactions, 2);
});
