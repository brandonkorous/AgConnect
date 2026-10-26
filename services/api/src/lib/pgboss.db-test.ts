import { test } from 'node:test';
import assert from 'node:assert/strict';
import { PgBoss } from 'pg-boss';
import { pgBossOptions } from '@agconn/db';

// pg-boss installs into and runs from the pgboss schema as agconn_app (pnpm test:db).
test('pg-boss starts, sends and fetches as the app role', async () => {
  const boss = new PgBoss(pgBossOptions(process.env.DATABASE_URL!));
  boss.on('error', (e: unknown) => console.error('[pgboss test]', e));
  await boss.start();
  try {
    await boss.createQueue('rls-fixture');
    const id = await boss.send('rls-fixture', { ok: true });
    assert.ok(id);
    const [job] = await boss.fetch('rls-fixture');
    assert.equal(job?.id, id);
  } finally {
    await boss.stop({ graceful: false });
  }
});
