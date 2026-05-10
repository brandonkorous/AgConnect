import { prisma } from '../src/index.js';

const cols = await prisma.$queryRaw<{ column_name: string }[]>`
  SELECT column_name FROM information_schema.columns WHERE table_name='email_log' ORDER BY ordinal_position`;
console.log('email_log columns:', cols.map((c) => c.column_name).join(', '));

const logs = await prisma.emailLog.findMany({
  where: { template: { startsWith: 'grant' } },
  orderBy: { queuedAt: 'desc' },
  take: 5,
});
console.log('email_log rows (grant):');
for (const l of logs) {
  console.log(`  ${l.queuedAt.toISOString()}  ${l.template}  ${l.status}  ${l.errorMsg ?? ''}`);
}

const jobs = await prisma.$queryRaw<{ id: string; name: string; state: string; retry_count: number; output: unknown }[]>`
  SELECT id, name, state, retry_count, output
  FROM pgboss.job
  WHERE name='email.grant.report'
  ORDER BY created_on DESC LIMIT 5`;
console.log('pgboss jobs:');
for (const j of jobs) {
  console.log(`  ${j.id}  state=${j.state} retries=${j.retry_count} output=${JSON.stringify(j.output)?.slice(0, 200)}`);
}

await prisma.$disconnect();
