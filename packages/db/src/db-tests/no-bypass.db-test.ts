import { after, test } from 'node:test';
import assert from 'node:assert/strict';
import { pools, type PoolName } from '../pools.js';

// Every runtime pool must connect as a role that row level security applies to (pnpm test:db).
const POOL_NAMES: PoolName[] = ['shared', 'me', 'worker', 'employer', 'crews', 'jobs', 'applications',
  'landing', 'training', 'wallet', 'admin', 'i18n', 'webhooks'];

after(async () => {
  await Promise.all(POOL_NAMES.map((name) => pools[name].$disconnect()));
});

for (const name of POOL_NAMES) {
  test(`pool ${name} cannot bypass row level security`, async () => {
    const [role] = await pools[name].$queryRaw<{ rolname: string; rolsuper: boolean; rolbypassrls: boolean }[]>`
      SELECT rolname, rolsuper, rolbypassrls FROM pg_roles WHERE rolname = current_user`;
    assert.ok(role, 'current_user has no pg_roles row');
    assert.equal(role.rolsuper, false, `${role.rolname} is a superuser`);
    assert.equal(role.rolbypassrls, false, `${role.rolname} has BYPASSRLS`);
  });
}
