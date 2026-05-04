import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { config as loadEnv } from 'dotenv';
const here = dirname(fileURLToPath(import.meta.url));
loadEnv({ path: resolve(here, '..', '..', '..', '.env') });
const { prisma } = await import('../src/index.js');
const items = await prisma.complianceItem.findMany({
  select: { itemKey: true, label: true },
  orderBy: { itemKey: 'asc' },
});
const seen = new Set<string>();
for (const i of items) {
  if (seen.has(i.itemKey)) continue;
  seen.add(i.itemKey);
  console.log(`${i.itemKey}  →  ${i.label}`);
}
await prisma.$disconnect();
