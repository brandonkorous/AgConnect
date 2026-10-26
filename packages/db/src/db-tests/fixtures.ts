import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient, type Prisma } from '@prisma/client';
import { AUDIT_ACTOR, ROW, TENANT, USER } from './fixture-ids.js';

type Tx = Prisma.TransactionClient;

// The owner connection (DATABASE_ADMIN_URL) that writes the fixture; tests read it back as agconn_app.
export function adminClient(): PrismaClient {
  const url = process.env.DATABASE_ADMIN_URL;
  if (!url) throw new Error('DATABASE_ADMIN_URL is not set — the RLS fixture is written as the owner');
  return new PrismaClient({ adapter: new PrismaPg({ connectionString: url, max: 2 }) });
}

export async function seedFixture(admin: PrismaClient): Promise<void> {
  await admin.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT set_config('app.role', 'admin', true)`;
    await clearFixture(tx);
    await seedTenancy(tx);
    await seedJobs(tx);
    await seedMessaging(tx);
    await seedShifts(tx);
    await seedLogs(tx);
  });
}

async function clearFixture(tx: Tx): Promise<void> {
  const tenants = [TENANT.A, TENANT.B];
  await tx.$executeRaw`DELETE FROM audit_events WHERE actor_id IN (${AUDIT_ACTOR.A}, ${AUDIT_ACTOR.B})`;
  await tx.$executeRaw`DELETE FROM search_views WHERE worker_id = ANY(${Object.values(USER)}::text[])`;
  await tx.$executeRaw`DELETE FROM worker_profiles WHERE id = ANY(${Object.values(USER)}::text[])`;
  for (const table of ['messages', 'conversation_participants', 'conversations', 'shift_assignments',
    'shifts', 'application_events', 'applications', 'job_postings', 'verification_log', 'sms_log', 'email_log']) {
    await tx.$executeRawUnsafe(`DELETE FROM "${table}" WHERE tenant_id = ANY($1::uuid[])`, tenants);
  }
  await tx.$executeRaw`UPDATE employer_profiles SET owner_contact_id = NULL WHERE tenant_id = ANY(${tenants}::uuid[])`;
  await tx.$executeRaw`DELETE FROM employer_contacts WHERE tenant_id = ANY(${tenants}::uuid[])`;
  await tx.$executeRaw`DELETE FROM employer_profiles WHERE tenant_id = ANY(${tenants}::uuid[])`;
  await tx.$executeRaw`DELETE FROM users WHERE id = ANY(${Object.values(USER)}::text[])`;
  await tx.$executeRaw`DELETE FROM tenants WHERE id = ANY(${tenants}::uuid[])`;
}

async function seedTenancy(tx: Tx): Promise<void> {
  await tx.tenant.createMany({
    data: [
      { id: TENANT.A, slug: 'rls-fixture-a', name: 'RLS fixture A' },
      { id: TENANT.B, slug: 'rls-fixture-b', name: 'RLS fixture B' },
    ],
  });
  await tx.user.createMany({
    data: [
      { id: USER.workerA, role: 'worker', tenantId: TENANT.A },
      { id: USER.employerA, role: 'employer', tenantId: TENANT.A },
      { id: USER.workerB, role: 'worker', tenantId: TENANT.B },
      { id: USER.employerB, role: 'employer', tenantId: TENANT.B },
      { id: USER.noTenant, role: 'worker', tenantId: null },
    ],
  });
  await tx.employerProfile.createMany({
    data: [
      { id: ROW.profileA, tenantId: TENANT.A, legalName: 'Fixture Farms A' },
      { id: ROW.profileB, tenantId: TENANT.B, legalName: 'Fixture Farms B' },
    ],
  });
  const owner = await tx.role.findFirstOrThrow({ where: { key: 'owner', tenantId: null } });
  const contact = (id: string, tenantId: string, employerId: string, userId: string) =>
    ({ id, tenantId, employerId, userId, name: userId, phone: '+15595550100', roleId: owner.id, acceptedAt: new Date() });
  await tx.employerContact.createMany({
    data: [
      contact(ROW.contactA, TENANT.A, ROW.profileA, USER.employerA),
      contact(ROW.contactB, TENANT.B, ROW.profileB, USER.employerB),
    ],
  });
}

async function seedJobs(tx: Tx): Promise<void> {
  const job = (id: string, tenantId: string, employerId: string, status: 'active' | 'draft' | 'closed') => ({
    id, tenantId, employerId, status, seoSlug: status === 'draft' ? null : `rls-fixture-${id}`,
    titleEn: 'Fixture job', titleEs: 'Trabajo de prueba',
    descriptionEn: 'Fixture job description', descriptionEs: 'Descripcion de prueba',
    county: 'Madera' as const, wageMin: 18, wageMax: 22, startDate: new Date('2026-01-05'),
  });
  await tx.jobPosting.createMany({
    data: [
      job(ROW.jobA, TENANT.A, ROW.profileA, 'active'),
      job(ROW.jobB, TENANT.B, ROW.profileB, 'active'),
      job(ROW.draftA, TENANT.A, ROW.profileA, 'draft'),
      job(ROW.closedA, TENANT.A, ROW.profileA, 'closed'),
    ],
  });
  await tx.application.createMany({
    data: [
      { id: ROW.appA, tenantId: TENANT.A, jobId: ROW.jobA, workerId: USER.workerA },
      { id: ROW.appB, tenantId: TENANT.B, jobId: ROW.jobB, workerId: USER.workerB },
      { id: ROW.appClosedA, tenantId: TENANT.A, jobId: ROW.closedA, workerId: USER.workerA },
    ],
  });
  // workerA is onboarded (searchable by employers); workerB is not.
  await tx.workerProfile.createMany({
    data: [
      { id: USER.workerA, firstName: 'Ana', lastName: 'Fixture', onboardedAt: new Date() },
      { id: USER.workerB, firstName: 'Beto', lastName: 'Fixture' },
    ],
  });
}

async function seedMessaging(tx: Tx): Promise<void> {
  await tx.conversation.createMany({
    data: [
      { id: ROW.convA, tenantId: TENANT.A, employerId: ROW.profileA, title: 'Fixture A' },
      { id: ROW.convB, tenantId: TENANT.B, employerId: ROW.profileB, title: 'Fixture B' },
    ],
  });
  await tx.conversationParticipant.createMany({
    data: [
      { id: ROW.cpWorkerA, tenantId: TENANT.A, conversationId: ROW.convA, userId: USER.workerA },
      { id: ROW.cpEmployerA, tenantId: TENANT.A, conversationId: ROW.convA, userId: USER.employerA },
      { id: ROW.cpWorkerB, tenantId: TENANT.B, conversationId: ROW.convB, userId: USER.workerB },
    ],
  });
  await tx.message.createMany({
    data: [
      { id: ROW.msgA, tenantId: TENANT.A, conversationId: ROW.convA, senderUserId: USER.employerA, body: 'A' },
      { id: ROW.msgB, tenantId: TENANT.B, conversationId: ROW.convB, senderUserId: USER.employerB, body: 'B' },
    ],
  });
}

async function seedShifts(tx: Tx): Promise<void> {
  const shift = (id: string, tenantId: string, employerId: string) =>
    ({ id, tenantId, employerId, shiftDate: new Date('2026-01-05'), startTime: '06:00', locationLabel: 'Field 1' });
  await tx.shift.createMany({
    data: [shift(ROW.shiftA, TENANT.A, ROW.profileA), shift(ROW.shiftB, TENANT.B, ROW.profileB)],
  });
  await tx.shiftAssignment.createMany({
    data: [
      { id: ROW.assignA, tenantId: TENANT.A, shiftId: ROW.shiftA, workerUserId: USER.workerA },
      { id: ROW.assignB, tenantId: TENANT.B, shiftId: ROW.shiftB, workerUserId: USER.workerB },
    ],
  });
}

async function seedLogs(tx: Tx): Promise<void> {
  const email = (id: string, tenantId: string) =>
    ({ id, tenantId, template: 'fixture', locale: 'en' as const, toEmail: 'a@example.com', fromEmail: 'b@example.com', subject: 'x' });
  await tx.emailLog.createMany({ data: [email(ROW.emailA, TENANT.A), email(ROW.emailB, TENANT.B)] });
  const sms = (id: string, tenantId: string, userId: string) =>
    ({ id, tenantId, userId, template: 'fixture', locale: 'en' as const, toPhone: '+15595550100', body: 'x' });
  await tx.smsLog.createMany({
    data: [sms(ROW.smsA, TENANT.A, USER.workerA), sms(ROW.smsB, TENANT.B, USER.workerB)],
  });
  const audit = (tenantId: string, actorId: string) =>
    ({ tenantId, actorId, actorType: 'system' as const, action: 'rls.fixture', eventHmac: new Uint8Array(32) });
  await tx.auditEvent.createMany({ data: [audit(TENANT.A, AUDIT_ACTOR.A), audit(TENANT.B, AUDIT_ACTOR.B)] });
}
