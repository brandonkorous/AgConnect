// One-shot: ensure there's at least one Application row in `applied` state on
// the Almond harvest crew lead posting so the renotify queue has a recipient
// to gate against. Safe to delete after browser verification.
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { config as loadEnv } from 'dotenv';

const here = dirname(fileURLToPath(import.meta.url));
loadEnv({ path: resolve(here, '..', '..', '..', '.env') });

const { prisma } = await import('../src/index.js');

const JOB_ID = '5b7bc70f-b13c-4b70-9473-388d243ebd65';

const job = await prisma.jobPosting.findUnique({
  where: { id: JOB_ID },
  select: { tenantId: true, employerId: true },
});
if (!job) throw new Error('job not found');

const existing = await prisma.application.findFirst({
  where: { jobId: JOB_ID, status: 'applied', deletedAt: null },
});
if (existing) {
  console.log({ existing: existing.id });
} else {
  // Find any worker in the same tenant to use as the applicant.
  let worker = await prisma.workerProfile.findFirst({
    where: { tenantId: job.tenantId, deletedAt: null },
    select: { id: true },
  });
  if (!worker) {
    const userId = `test_worker_${Date.now()}`;
    await prisma.user.create({
      data: {
        id: userId,
        tenantId: job.tenantId,
        role: 'worker',
        preferredLang: 'es',
        phone: '+15551234567',
        onboarded: true,
      },
    });
    const wp = await prisma.workerProfile.create({
      data: {
        id: userId,
        tenantId: job.tenantId,
        firstName: 'Test',
        lastName: 'Applicant',
        skills: ['harvesting'],
      },
    });
    worker = { id: wp.id };
    console.log({ createdWorker: wp.id });
  }

  const created = await prisma.application.create({
    data: {
      tenantId: job.tenantId,
      jobId: JOB_ID,
      workerId: worker.id,
      status: 'applied',
    },
  });
  console.log({ created: created.id });
}

const all = await prisma.application.findMany({
  where: { jobId: JOB_ID, deletedAt: null },
  select: { id: true, workerId: true, status: true },
});
console.log({ all });

await prisma.$disconnect();
