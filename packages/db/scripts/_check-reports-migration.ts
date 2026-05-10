import { prisma } from '../src/index.js';

const main = async () => {
  const migrations = await prisma.$queryRaw<{ migration_name: string }[]>`
    SELECT migration_name FROM _prisma_migrations
    WHERE migration_name LIKE '%report%' OR migration_name LIKE '%20260509120000%'
    ORDER BY started_at DESC LIMIT 5`;
  console.log('relevant migrations:', migrations);

  const exists = await prisma.$queryRaw<{ exists: string | null }[]>`
    SELECT to_regclass('public.report_runs')::text as exists`;
  console.log('report_runs table:', exists);

  const idx = await prisma.$queryRaw<{ indexname: string }[]>`
    SELECT indexname FROM pg_indexes
    WHERE tablename='applications' AND indexname='applications_hired_at_idx'`;
  console.log('hired_at index:', idx);

  const hires = await prisma.$queryRaw<{ count: bigint }[]>`
    SELECT COUNT(*)::bigint as count FROM applications WHERE status='hired'`;
  console.log('hired applications in DB:', hires[0]?.count);

  const completed = await prisma.$queryRaw<{ count: bigint }[]>`
    SELECT COUNT(*)::bigint as count FROM enrollments WHERE status='completed'`;
  console.log('completed enrollments in DB:', completed[0]?.count);

  await prisma.$disconnect();
};

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
