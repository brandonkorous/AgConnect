// Operational helper: create one editable shift for the verified employer in
// the dev DB so the /employer/crews/shifts/[id]/edit page can be smoke-tested
// in the browser. Idempotent: returns the first existing test shift if any.
//
// Run with `pnpm --filter @agconn/db exec tsx scripts/create-test-shift.ts`.

import { config as loadEnv } from 'dotenv';
loadEnv({ path: '../../.env' });

async function main() {
  const { prisma, ShiftType, AppStatus } = await import('../src/index.js');

  const profile = await prisma.employerProfile.findFirst({
    where: { flcVerifiedAt: { not: null } },
    include: { user: true },
  });
  if (!profile) {
    throw new Error('no verified employer');
  }
  const userId = profile.userId;
  const tenantId = profile.user.tenantId!;

  const existing = await prisma.shift.findFirst({
    where: {
      employerId: userId,
      tenantId,
      status: 'scheduled',
      shiftDate: { gte: new Date() },
    },
    orderBy: { shiftDate: 'asc' },
  });

  if (existing) {
    console.log(`existing: ${existing.id}  date=${existing.shiftDate.toISOString().slice(0, 10)}`);
    await prisma.$disconnect();
    return;
  }

  const crew = await prisma.crew.findFirst({
    where: { employerId: userId, tenantId, deletedAt: null },
  });
  if (!crew) throw new Error('no crew for verified employer');

  const tomorrow = new Date();
  tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);

  const shift = await prisma.shift.create({
    data: {
      tenantId,
      employerId: userId,
      crewId: crew.id,
      shiftDate: tomorrow,
      startTime: '06:30',
      endTime: '14:00',
      locationLabel: 'Block 12 · 4321 Avenue 12, Madera, CA 93637',
      locationLat: 36.961_111,
      locationLng: -120.060_5,
      shiftType: ShiftType.work,
      metadata: {
        pickup: { enabled: true, label: 'Yard, 5:30 AM' },
        equipmentProvided: false,
        lunchProvided: false,
        safety: {},
        notifications: { smsEveningBefore: true },
      },
      notes: 'Almond shake — auto-populates heat advisory from NWS.',
    },
  });

  // Attempt to attach the active hire if there is one — gives the workers
  // section something to render.
  const hired = await prisma.application.findFirst({
    where: {
      status: AppStatus.hired,
      job: { employerId: userId, deletedAt: null },
    },
  });
  if (hired) {
    await prisma.shiftAssignment.create({
      data: {
        tenantId,
        shiftId: shift.id,
        workerUserId: hired.workerId,
      },
    });
  }

  console.log(`created: ${shift.id}  date=${tomorrow.toISOString().slice(0, 10)}`);
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
