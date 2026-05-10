// Dev-only: ensure there's enough placement-report-shaped data in the DB
// to make /admin/reports/placement worth looking at. Idempotent — re-running
// updates the same fixtures (identified by a smoke-test marker).
//
// Picks an existing tenant + employer + a couple of workers + a posting,
// then ensures:
//   - 3 hired applications with hired_at in the last 30 days
//   - 1 completed enrollment with a certificate ID
//
// Usage: pnpm --filter @agconn/db smoke:placement

import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { config as loadEnv } from 'dotenv';

const here = dirname(fileURLToPath(import.meta.url));
loadEnv({ path: resolve(here, '..', '..', '..', '.env') });

const { prisma } = await import('../src/index.js');

const employer = await prisma.employerProfile.findFirst({
  where: { deletedAt: null },
  orderBy: { createdAt: 'asc' },
});
if (!employer) throw new Error('No employer profile in DB. Onboard one first.');
const tenant = await prisma.tenant.findUnique({ where: { id: employer.tenantId } });
if (!tenant) throw new Error(`Employer's tenant ${employer.tenantId} not found.`);
console.log('using tenant:', tenant.id, tenant.slug);
console.log('using employer:', employer.legalName, employer.id);

const job = await prisma.jobPosting.findFirst({
  where: { tenantId: tenant.id, employerId: employer.userId, deletedAt: null },
  orderBy: { createdAt: 'desc' },
});
if (!job) throw new Error('No job postings for employer. Create one first.');
console.log('using job:', job.titleEn, job.id);

const workers = await prisma.workerProfile.findMany({
  where: { deletedAt: null },
  take: 3,
  orderBy: { createdAt: 'asc' },
});
if (workers.length < 1) throw new Error('No workers in DB.');
console.log(`using ${workers.length} worker(s)`);

const today = new Date();
const daysAgo = (n: number) => {
  const d = new Date(today);
  d.setUTCDate(d.getUTCDate() - n);
  return d;
};

let hiredCount = 0;
for (let i = 0; i < workers.length; i++) {
  const worker = workers[i];
  if (!worker) continue;
  const hiredAt = daysAgo(7 + i * 5);
  const wage = 19.5 + i * 0.75;

  const existing = await prisma.application.findUnique({
    where: { jobId_workerId: { jobId: job.id, workerId: worker.id } },
  });

  if (existing) {
    if (existing.status !== 'hired') {
      await prisma.application.update({
        where: { id: existing.id },
        data: {
          status: 'hired',
          hiredAt,
          wageOffered: wage,
          countyAtApply: job.county,
        },
      });
      console.log(`  flipped ${worker.firstName} -> hired @ $${wage}/hr`);
      hiredCount++;
    } else {
      console.log(`  ${worker.firstName} already hired`);
      hiredCount++;
    }
  } else {
    await prisma.application.create({
      data: {
        tenantId: tenant.id,
        jobId: job.id,
        workerId: worker.id,
        status: 'hired',
        wageOffered: wage,
        appliedAt: daysAgo(14 + i * 5),
        hiredAt,
        countyAtApply: job.county,
        skillsAtApply: [],
      },
    });
    console.log(`  created hired application for ${worker.firstName} @ $${wage}/hr`);
    hiredCount++;
  }
}

const program = await prisma.trainingProgram.findFirst({
  where: { tenantId: tenant.id, deletedAt: null },
});

let completedCount = 0;
if (program && workers[0]) {
  const w = workers[0];
  const existing = await prisma.enrollment.findFirst({
    where: { workerId: w.id, programId: program.id, deletedAt: null },
  });
  if (existing) {
    if (existing.status !== 'completed' || !existing.certificateId) {
      await prisma.enrollment.update({
        where: { id: existing.id },
        data: {
          status: 'completed',
          completedAt: daysAgo(20),
          certificateId: `CERT-SMOKE-${w.id.slice(0, 6)}`,
          certUrl: existing.certUrl ?? `https://example.test/cert/${w.id.slice(0, 6)}.pdf`,
        },
      });
      console.log(`  flipped enrollment -> completed (${program.titleEn})`);
      completedCount++;
    } else {
      console.log(`  enrollment already completed`);
      completedCount++;
    }
  } else {
    await prisma.enrollment.create({
      data: {
        tenantId: tenant.id,
        programId: program.id,
        workerId: w.id,
        status: 'completed',
        enrolledAt: daysAgo(45),
        completedAt: daysAgo(20),
        certificateId: `CERT-SMOKE-${w.id.slice(0, 6)}`,
        certUrl: `https://example.test/cert/${w.id.slice(0, 6)}.pdf`,
      },
    });
    console.log(`  created completed enrollment (${program.titleEn})`);
    completedCount++;
  }
} else if (!program) {
  console.warn('  no training program found — skipping enrollment seed');
}

console.log(`\nDone. Hired applications: ${hiredCount}. Completed enrollments: ${completedCount}.`);
await prisma.$disconnect();
