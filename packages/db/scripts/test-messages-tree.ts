// Replicates the assembly the next-intl messages loader does.
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { config as loadEnv } from 'dotenv';

const here = dirname(fileURLToPath(import.meta.url));
loadEnv({ path: resolve(here, '..', '..', '..', '.env') });

const { prisma } = await import('../src/index.js');

const rows = await prisma.$transaction(
  async (tx) => {
    await tx.$executeRawUnsafe(`SET LOCAL app.role = 'admin'`);
    return tx.translationKey.findMany({
      where: { locale: 'en' as const, tenantId: null, status: 'published' as const },
      select: { namespace: true, key: true, value: true },
    });
  },
);

const root: Record<string, unknown> = {};
for (const row of rows) {
  const path = [...row.namespace.split('.'), ...row.key.split('.')];
  let cursor: Record<string, unknown> = root;
  for (let i = 0; i < path.length - 1; i++) {
    const segment = path[i]!;
    const next = cursor[segment];
    if (typeof next !== 'object' || next === null || Array.isArray(next)) {
      cursor[segment] = {};
    }
    cursor = cursor[segment] as Record<string, unknown>;
  }
  const leaf = path[path.length - 1]!;
  cursor[leaf] = row.value;
}

const compliance = (root.employer as Record<string, unknown>)?.compliance as Record<string, unknown>;
console.log('Total rows:', rows.length);
console.log('employer.compliance keys:', Object.keys(compliance ?? {}));
console.log('employer.compliance.evidence:', JSON.stringify(compliance?.evidence, null, 2));
await prisma.$disconnect();
