// One-shot: hard-delete shifts left in `cancelled` state by browser-driven
// smoke tests on the verified employer. Keeps the dev DB tidy.

import { config as loadEnv } from 'dotenv';
loadEnv({ path: '../../.env' });

const { prisma } = await import('../src/index.js');

const profile = await prisma.employerProfile.findFirst({
  where: { flcVerifiedAt: { not: null } },
});
if (!profile) {
  console.error('no verified employer');
  process.exit(1);
}

const cancelled = await prisma.shift.findMany({
  where: { employerId: profile.userId, status: 'cancelled' },
  select: { id: true, shiftDate: true },
});

for (const s of cancelled) {
  await prisma.shiftAssignment.deleteMany({ where: { shiftId: s.id } });
  await prisma.shift.delete({ where: { id: s.id } }).catch(() => undefined);
}

console.log(`Cleaned ${cancelled.length} cancelled shift(s).`);
await prisma.$disconnect();
