import { test } from 'node:test';
import assert from 'node:assert/strict';
import { dbClients, runWithRlsContext } from '@agconn/db';
import { loadImpact } from './impact-query.js';

// Runs the real SQL against the migrated CI database (pnpm test:db).
test('impact SQL runs against Postgres', async () => {
  const body = await runWithRlsContext({ role: 'service' }, () =>
    loadImpact(dbClients.landing, new Date()),
  );
  assert.equal(typeof body.verifiedEmployers, 'number');
  assert.equal(typeof body.activePostings, 'number');
  await dbClients.landing.$disconnect();
});
