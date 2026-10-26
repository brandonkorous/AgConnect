import { after, before, test } from 'node:test';
import assert from 'node:assert/strict';
import type { PrismaClient } from '@prisma/client';
import { pools } from '../pools.js';
import { dbClients, runWithRlsContext } from '../rls.js';
import { adminClient, seedFixture } from './fixtures.js';
import { ROW, TENANT, USER } from './fixture-ids.js';

// Writes are held to the same tenant lines as reads, as agconn_app (pnpm test:db).
const SYSTEM_TENANT = '00000000-0000-0000-0000-000000000000';
const db = () => dbClients.shared;
let admin: PrismaClient;

before(async () => {
  admin = adminClient();
  await seedFixture(admin);
});
after(async () => {
  await admin.$disconnect();
  await pools.shared.$disconnect();
});

test('an employer cannot post a job into another tenant', async () => {
  const ctx = { role: 'authenticated' as const, userId: USER.employerA, tenantId: TENANT.A, employerId: ROW.profileA };
  const write = runWithRlsContext(ctx, () =>
    db().$executeRaw`UPDATE job_postings SET tenant_id = ${TENANT.B}::uuid WHERE id = ${ROW.jobA}::uuid`);
  await assert.rejects(write, /row-level security/);
});

test('service in tenant A cannot log an email for tenant B', async () => {
  const write = runWithRlsContext({ role: 'service', tenantId: TENANT.A }, () =>
    db().$executeRaw`INSERT INTO email_log (id, tenant_id, template, locale, to_email, from_email, subject)
      VALUES (gen_random_uuid(), ${TENANT.B}::uuid, 'fixture', 'en', 'a@example.com', 'b@example.com', 'x')`);
  await assert.rejects(write, /row-level security/);
});

test('system writes a tenantless audit event with no app.tenant_id', async () => {
  const count = await runWithRlsContext({ role: 'system' }, () =>
    db().$executeRaw`INSERT INTO audit_events (tenant_id, actor_type, actor_id, action, event_hmac)
      VALUES (${SYSTEM_TENANT}::uuid, 'system', 'rls_fixture_audit_a', 'rls.fixture', ${Buffer.alloc(32)})`);
  assert.equal(count, 1);
});

test('an authenticated user with no tenant reads nothing tenant-scoped and does not error', async () => {
  const rows = await runWithRlsContext({ role: 'authenticated', userId: USER.noTenant }, () =>
    db().employerProfile.findMany({ where: { id: { in: [ROW.profileA, ROW.profileB] } } }));
  assert.equal(rows.length, 0);
});
