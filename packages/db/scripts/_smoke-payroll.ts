// One-shot: seed a draft payroll period + crew + shifts (one work, one training)
// + assignments with piece-rate work, then invoke the calc engine and print
// the resulting line so we can sanity-check AB 1513 + AEWR locally.
//
// Safe to delete after smoke test.
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { config as loadEnv } from 'dotenv';

const here = dirname(fileURLToPath(import.meta.url));
loadEnv({ path: resolve(here, '..', '..', '..', '.env') });

const { prisma } = await import('../src/index.js');

const employer = await prisma.user.findFirst({
  where: { role: 'employer' },
  include: { employerProfile: true },
});
if (!employer || !employer.employerProfile) throw new Error('no employer');
console.log('employer:', employer.id, employer.employerProfile.legalName, 'tenant:', employer.tenantId, 'h2a:', employer.employerProfile.participatesInH2a);

const tenantId = employer.tenantId!;
const employerId = employer.id;

// Create a fresh draft period (May 11–17, the week after the existing approved one).
const startDate = new Date('2026-05-11');
const endDate = new Date('2026-05-17');
const payDate = new Date('2026-05-22');

let period = await prisma.payrollPeriod.findFirst({
  where: { tenantId, employerId, startDate, endDate },
});
if (!period) {
  period = await prisma.payrollPeriod.create({
    data: { tenantId, employerId, startDate, endDate, payDate, status: 'draft' },
  });
}
console.log('period:', period.id, 'status:', period.status);

if (period.status !== 'draft') {
  await prisma.payrollPeriod.update({ where: { id: period.id }, data: { status: 'draft' } });
  console.log('reset to draft');
}

// Workers are platform-level (tenant_id is null). Pick the first one with a
// workerProfile or fall back to creating a profile for any worker user.
let worker = await prisma.user.findFirst({
  where: { role: 'worker', workerProfile: { isNot: null } },
  include: { workerProfile: true },
});
if (!worker) {
  worker = await prisma.user.findFirst({
    where: { role: 'worker' },
    include: { workerProfile: true },
  });
}
if (!worker) throw new Error('no worker user; cannot smoke');
if (!worker.workerProfile) {
  await prisma.workerProfile.create({
    data: { id: worker.id, firstName: 'Maria', lastName: 'Lopez' },
  });
}
console.log('worker:', worker.id);

// Crew with base wage.
let crew = await prisma.crew.findFirst({
  where: { tenantId, employerId, name: 'Smoke crew' },
});
if (!crew) {
  crew = await prisma.crew.create({
    data: {
      tenantId,
      employerId,
      name: 'Smoke crew',
      color: 'olive',
      baseWageCents: 1700,
    },
  });
}
console.log('crew:', crew.id, 'baseWage:', crew.baseWageCents);

// Ensure worker is on the crew.
const existingMember = await prisma.crewMember.findFirst({
  where: { crewId: crew.id, workerUserId: worker.id, leftAt: null },
});
if (!existingMember) {
  await prisma.crewMember.create({
    data: { tenantId, crewId: crew.id, workerUserId: worker.id, role: 'member' },
  });
}

// Wipe prior smoke shifts in the period (idempotent).
await prisma.shiftAssignment.deleteMany({
  where: { tenantId, shift: { employerId, shiftDate: { gte: startDate, lte: endDate } } },
});
await prisma.shift.deleteMany({
  where: { tenantId, employerId, shiftDate: { gte: startDate, lte: endDate } },
});

// Two productive piece-rate work shifts (Mon, Tue), one training (Wed).
const shifts = [
  {
    date: new Date('2026-05-11'),
    type: 'work' as const,
    hours: 8,
    pieces: 40,
    pieceRateCents: 500,
  },
  {
    date: new Date('2026-05-12'),
    type: 'work' as const,
    hours: 9,
    pieces: 50,
    pieceRateCents: 500,
  },
  {
    date: new Date('2026-05-13'),
    type: 'training' as const,
    hours: 4,
    pieces: 0,
    pieceRateCents: 0,
  },
];

for (const s of shifts) {
  const shift = await prisma.shift.create({
    data: {
      tenantId,
      employerId,
      crewId: crew.id,
      shiftDate: s.date,
      startTime: '06:00',
      endTime: s.type === 'training' ? '10:00' : '15:00',
      locationLabel: 'Smoke field',
      status: 'completed',
      shiftType: s.type,
    },
  });
  await prisma.shiftAssignment.create({
    data: {
      tenantId,
      shiftId: shift.id,
      workerUserId: worker.id,
      status: 'completed',
      hoursWorked: s.hours,
      piecesCount: s.pieces,
      pieceRateCents: s.pieceRateCents,
    },
  });
}

console.log('seeded 3 shifts (2 work piece-rate + 1 training)');
console.log('now visit: /en/employer/payroll → Tools → Generate from shifts');
console.log('or POST /v1/employer/payroll/periods/' + period.id + '/generate-lines');

await prisma.$disconnect();
