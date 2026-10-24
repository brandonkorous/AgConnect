import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { clearMessagesCache, getMessagesEntry } from './messages-store.js';

type Seen = { loads: number; roles: unknown[] };

function fakeDb(seen: Seen, fail = false) {
  const tx = {
    $queryRaw: async (_s: TemplateStringsArray, role: string, _u: string, tenant: string) => {
      seen.roles.push([role, tenant]);
    },
    translationKey: {
      findMany: async () => {
        if (fail) throw new Error('db down');
        return [
          { namespace: 'nav', key: 'home', value: 'Inicio', tenantId: null },
          { namespace: 'nav', key: 'jobs', value: 'Trabajos', tenantId: null },
        ];
      },
    },
  };
  return { $transaction: async (cb: (t: typeof tx) => unknown) => (seen.loads++, cb(tx)) } as never;
}

beforeEach(() => clearMessagesCache());

test('messages are read as the read-only service role, not admin', async () => {
  const seen: Seen = { loads: 0, roles: [] };
  const { messages } = await getMessagesEntry('es', null, fakeDb(seen), 0);
  assert.deepEqual(messages, { nav: { home: 'Inicio', jobs: 'Trabajos' } });
  assert.deepEqual(seen.roles, [['service', '00000000-0000-0000-0000-000000000000']]);
});

test('one load per locale within five minutes, with a stable ETag', async () => {
  const seen: Seen = { loads: 0, roles: [] };
  const a = await getMessagesEntry('es', null, fakeDb(seen), 0);
  const b = await getMessagesEntry('es', null, fakeDb(seen), 60_000);
  assert.equal(seen.loads, 1);
  assert.equal(a.etag, b.etag);
  await getMessagesEntry('en', null, fakeDb(seen), 60_000);
  await getMessagesEntry('es', null, fakeDb(seen), 6 * 60_000);
  assert.equal(seen.loads, 3);
});

test('publishing clears the cache', async () => {
  const seen: Seen = { loads: 0, roles: [] };
  await getMessagesEntry('es', null, fakeDb(seen), 0);
  clearMessagesCache();
  await getMessagesEntry('es', null, fakeDb(seen), 1);
  assert.equal(seen.loads, 2);
});

test('a failed load is not cached', async () => {
  const seen: Seen = { loads: 0, roles: [] };
  await assert.rejects(getMessagesEntry('es', null, fakeDb(seen, true), 0));
  await getMessagesEntry('es', null, fakeDb(seen), 1);
  assert.equal(seen.loads, 2);
});
