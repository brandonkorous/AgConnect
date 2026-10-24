import { test } from 'node:test';
import assert from 'node:assert/strict';
import { getFounderSlots } from './founder-slots.js';

test('founder slots hit the database at most once per 30 s', async () => {
  let calls = 0;
  const count = async () => (calls++, { remaining: 12, total: 50, active: true });
  const t0 = 1_000_000;
  await getFounderSlots(t0, count);
  await getFounderSlots(t0 + 29_000, count);
  assert.equal(calls, 1);
  const later = await getFounderSlots(t0 + 31_000, count);
  assert.equal(calls, 2);
  assert.equal(later.remaining, 12);
});

test('a failed count is not cached', async () => {
  let calls = 0;
  const fail = async () => {
    calls++;
    throw new Error('db down');
  };
  const t0 = 5_000_000;
  await assert.rejects(getFounderSlots(t0, fail));
  await assert.rejects(getFounderSlots(t0 + 1, fail));
  assert.equal(calls, 2);
});
