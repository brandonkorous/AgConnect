// One-shot: flip Korous Farms employer profile to verified so the Edit Job
// page's Publish button is exercisable in browser testing. Safe to delete
// after verification.
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { config as loadEnv } from 'dotenv';

const here = dirname(fileURLToPath(import.meta.url));
loadEnv({ path: resolve(here, '..', '..', '..', '.env') });

const { prisma } = await import('../src/index.js');

const updated = await prisma.employerProfile.updateMany({
  where: {
    OR: [{ legalName: 'Korous Farms' }, { dbaName: 'Korous Farms' }],
  },
  data: { flcVerifiedAt: new Date() },
});

const rows = await prisma.employerProfile.findMany({
  where: {
    OR: [{ legalName: 'Korous Farms' }, { dbaName: 'Korous Farms' }],
  },
  select: { id: true, legalName: true, dbaName: true, flcVerifiedAt: true },
});

console.log({ updated, rows });
await prisma.$disconnect();
