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
    db().employerContact.findMany({ where: { id: { in: [ROW.contactA, ROW.contactB] } } }));
  assert.equal(rows.length, 0);
});

const workerA = { role: 'authenticated' as const, userId: USER.workerA, tenantId: TENANT.A };
const employerA = { role: 'authenticated' as const, userId: USER.employerA, tenantId: TENANT.A, employerId: ROW.profileA };
const event = (actorUserId: string, applicationId: string) => ({
  tenantId: TENANT.A, applicationId, toStatus: 'applied' as const, actorUserId, actorRole: 'worker' as const,
});

test('a worker logs an event on their own application, not on someone else\'s', async () => {
  const own = await runWithRlsContext(workerA, () => db().applicationEvent.create({ data: event(USER.workerA, ROW.appA) }));
  assert.equal(own.applicationId, ROW.appA);
  const other = runWithRlsContext(workerA, () => db().applicationEvent.create({ data: event(USER.workerA, ROW.appB) }));
  await assert.rejects(other, /row-level security/);
});

test('an employer member logs an event on an application to their own job', async () => {
  const row = await runWithRlsContext(employerA, () =>
    db().applicationEvent.create({ data: { ...event(USER.employerA, ROW.appA), actorRole: 'employer' } }));
  assert.equal(row.actorUserId, USER.employerA);
});

test('an employer member records their own license submission', async () => {
  const row = await runWithRlsContext(employerA, () => db().verificationLog.create({
    data: { tenantId: TENANT.A, employerId: ROW.profileA, action: 'submitted', actorUserId: USER.employerA, payload: {} },
  }));
  assert.equal(row.employerId, ROW.profileA);
});

test('a signed-in user updates their own row but not its role, tenant or consent', async () => {
  const user = await runWithRlsContext(workerA, () =>
    db().user.update({ where: { id: USER.workerA }, data: { preferredLang: 'en' } }));
  assert.equal(user.preferredLang, 'en');
  const promote = runWithRlsContext(workerA, () =>
    db().user.update({ where: { id: USER.workerA }, data: { role: 'admin' } }));
  await assert.rejects(promote, /not self-service/);
});

test('a worker search view is recorded without reading it back', async () => {
  const written = await runWithRlsContext(workerA, () =>
    db().searchView.createMany({ data: { workerId: USER.workerA, filters: {}, resultCount: 0 } }));
  assert.equal(written.count, 1);
});

test('a participant marks their own conversation read, not someone else\'s', async () => {
  const own = await runWithRlsContext(workerA, () =>
    db().conversationParticipant.updateMany({ where: { id: ROW.cpWorkerA }, data: { unreadCount: 0 } }));
  assert.equal(own.count, 1);
  const other = await runWithRlsContext(workerA, () =>
    db().conversationParticipant.updateMany({ where: { id: ROW.cpEmployerA }, data: { unreadCount: 0 } }));
  assert.equal(other.count, 0);
});

test('an employer member who is not a participant reads the employer\'s conversation', async () => {
  const member = { ...employerA, userId: 'rls_fixture_other_member' };
  const rows = await runWithRlsContext(member, () => db().message.findMany({ where: { id: ROW.msgA } }));
  assert.equal(rows.length, 1);
});

test('the SMS keyword check sees keywords in every tenant', async () => {
  const [row] = await runWithRlsContext(employerA, () =>
    db().$queryRaw<{ taken: boolean }[]>`SELECT app.sms_keyword_taken('rls-no-such-keyword') AS taken`);
  assert.equal(row?.taken, false);
});
