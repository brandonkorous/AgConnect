import { test } from 'node:test';
import assert from 'node:assert/strict';
import { pools } from '@agconn/db';
import { loadMessages } from './messages-store.js';

// Runs against the migrated, seeded CI database (pnpm test:db).
test('the service role reads the seeded message tree', async () => {
  const messages = await loadMessages(pools.i18n, 'es', null);
  assert.ok(Object.keys(messages).length > 0);
  await pools.i18n.$disconnect();
});
