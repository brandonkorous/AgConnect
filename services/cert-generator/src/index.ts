import PgBoss from 'pg-boss';
import { prisma, EnrollmentStatus } from '@agconn/db';
import { enqueueSms } from '@agconn/sms';
import { renderCertHtml } from './render.js';
import { writeCert, type CertWriter } from './storage.js';

// Cert generator: consumes `enrollment.completed` events and produces a
// bilingual certificate. Writes the artifact via the configured storage
// adapter, stamps `certUrl` + `certificateId` on the Enrollment, then enqueues
// `training.completed` SMS so the worker is notified to download.
//
// Producers: training/routes.ts mark-complete + employer org training tools
// publish to this queue. The queue is created here so producers can blind-fire
// without coordinating queue boot order.

export const QUEUE = 'enrollment.completed';

export type CompletionJob = {
  enrollmentId: string;
  tenantId: string;
};

const ENV_KEYS_REQUIRED = ['DATABASE_URL'] as const;

function assertEnv(): void {
  const missing = ENV_KEYS_REQUIRED.filter((k) => !process.env[k]);
  if (missing.length > 0) {
    throw new Error(`cert-generator: missing required env: ${missing.join(', ')}`);
  }
  if (!process.env.AZURE_BLOB_CONNECTION_STRING) {
    console.warn(
      '[cert-generator] AZURE_BLOB_CONNECTION_STRING missing — using local fs writer (dev only)',
    );
  }
}

let boss: PgBoss | null = null;
let writer: CertWriter | null = null;

async function start(): Promise<void> {
  assertEnv();
  boss = new PgBoss({
    connectionString: process.env.DATABASE_URL!,
    schema: 'pgboss',
  });
  boss.on('error', (e) => console.error('[cert-generator] pg-boss error', e));
  await boss.start();
  await boss.createQueue(QUEUE);

  writer = await writeCert.init();

  await boss.work<CompletionJob>(QUEUE, async (jobs) => {
    for (const job of jobs) {
      await handle(job.data);
    }
  });
  console.log('[cert-generator] running');
}

async function handle({ enrollmentId, tenantId }: CompletionJob): Promise<void> {
  const enrollment = await prisma.enrollment.findUnique({
    where: { id: enrollmentId },
    include: { program: { include: { org: { include: { employerProfile: true } } } }, worker: true },
  });
  if (!enrollment) {
    console.warn('[cert-generator] enrollment not found', { enrollmentId });
    return;
  }
  if (enrollment.status !== EnrollmentStatus.completed) {
    // Producer fired before mark-complete persisted; skip silently — pg-boss
    // will retry up to retryLimit and the next attempt will see the row.
    console.warn('[cert-generator] enrollment not completed yet', {
      enrollmentId,
      status: enrollment.status,
    });
    return;
  }
  if (enrollment.certUrl) return; // idempotent

  const certificateId =
    enrollment.certificateId ??
    `AC-${new Date().getFullYear()}-${enrollmentId.slice(0, 8).toUpperCase()}`;

  const html = renderCertHtml({
    workerFirstName: '', // populated from workerProfile next block
    workerLastName: '',
    programTitleEn: enrollment.program.titleEn,
    programTitleEs: enrollment.program.titleEs,
    funder: enrollment.program.funder,
    orgName:
      enrollment.program.org?.employerProfile?.legalName ?? 'Training organization',
    completedAt: enrollment.completedAt ?? new Date(),
    certificateId,
  });

  // We want the worker's name on the certificate. Pull from workerProfile
  // since the user row only has phone/email.
  const profile = await prisma.workerProfile.findUnique({
    where: { id: enrollment.workerId },
  });
  const finalHtml = html
    .replace('__WORKER_FIRST__', profile?.firstName ?? '')
    .replace('__WORKER_LAST__', profile?.lastName ?? '');

  const certUrl = await writer!.write({
    tenantId,
    enrollmentId,
    certificateId,
    contentType: 'text/html',
    body: Buffer.from(finalHtml, 'utf8'),
  });

  await prisma.enrollment.update({
    where: { id: enrollmentId },
    data: { certificateId, certUrl },
  });

  try {
    await enqueueSms({
      tenantId,
      userId: enrollment.workerId,
      template: 'training.completed',
      vars: {
        programTitle: enrollment.program.titleEn,
        certUrl,
      },
      jobKey: `training.completed-${enrollmentId}`,
    });
  } catch (e) {
    console.error('[cert-generator] training.completed SMS enqueue failed', {
      enrollmentId,
      err: e instanceof Error ? e.message : String(e),
    });
  }
}

async function shutdown(signal: string): Promise<void> {
  console.log(`[cert-generator] received ${signal}, stopping…`);
  try {
    await boss?.stop({ graceful: true, timeout: 10_000 });
  } catch (e) {
    console.error('[cert-generator] error during shutdown', e);
  }
  process.exit(0);
}

process.on('SIGTERM', () => void shutdown('SIGTERM'));
process.on('SIGINT', () => void shutdown('SIGINT'));

void start().catch((err) => {
  console.error('[cert-generator] fatal startup error', err);
  process.exit(1);
});
