import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { config as loadEnv } from 'dotenv';

const here = dirname(fileURLToPath(import.meta.url));
loadEnv({ path: resolve(here, '..', '..', '..', '.env') });

const { prisma } = await import('../src/index.js');

const rows = await prisma.translationKey.findMany({
  where: { namespace: 'employer', key: { startsWith: 'compliance.evidence' } },
  select: { locale: true, key: true, value: true, status: true, tenantId: true },
});
console.log(JSON.stringify(rows, null, 2));
await prisma.$disconnect();
