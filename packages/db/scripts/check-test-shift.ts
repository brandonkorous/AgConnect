import { config as loadEnv } from 'dotenv';
loadEnv({ path: '../../.env' });

const id = process.argv[2];
if (!id) {
  console.error('usage: tsx check-test-shift.ts <shiftId>');
  process.exit(1);
}

const { prisma } = await import('../src/index.js');
const s = await prisma.shift.findUnique({
  where: { id },
  select: {
    startTime: true,
    endTime: true,
    locationLabel: true,
    shiftType: true,
    metadata: true,
    updatedAt: true,
  },
});
console.log(JSON.stringify(s, null, 2));
await prisma.$disconnect();
