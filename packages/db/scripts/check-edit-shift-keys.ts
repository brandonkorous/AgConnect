// Operational smoke: confirms the new edit-shift translation keys made it
// into the DB after `pnpm i18n:seed`. Run with `pnpm --filter @agconn/db
// exec tsx --env-file=../../.env scripts/check-edit-shift-keys.ts`.

import { config as loadEnv } from 'dotenv';
loadEnv({ path: '../../.env' });

const TARGETS = [
  'crews.edit_shift.save_bar_complete',
  'crews.edit_shift.save_bar_single',
  'crews.edit_shift.save_bar_repeat',
  'crews.edit_shift.preview.rail_label',
  'crews.edit_shift.preview.worker_preview',
  'crews.edit_shift.safety.heat.loading',
  'crews.edit_shift.safety.heat.loading_help',
  'crews.edit_shift.safety.heat.unavailable',
  'crews.edit_shift.safety.heat.unavailable_help',
  'crews.edit_shift.safety.heat.source',
] as const;

async function main() {
  const { prisma } = await import('../src/index.js');
  let missing = 0;
  await prisma.$transaction(async (tx) => {
    await tx.$executeRawUnsafe(`SET LOCAL app.role = 'admin'`);
    for (const k of TARGETS) {
      const rows = await tx.translationKey.findMany({
        where: { namespace: 'employer', key: k },
        select: { locale: true, value: true },
      });
      const en = rows.find((r) => r.locale === 'en')?.value;
      const es = rows.find((r) => r.locale === 'es')?.value;
      const pad = k.padEnd(54);
      console.log(`${pad}  ${en ? 'EN ok' : 'EN MISSING'}  ${es ? 'ES ok' : 'ES MISSING'}`);
      if (!en || !es) missing++;
    }
  });
  await prisma.$disconnect();
  if (missing > 0) {
    console.error(`\n${missing} key(s) missing — re-run pnpm i18n:seed`);
    process.exit(1);
  }
  console.log(`\nAll ${TARGETS.length} keys present in EN + ES.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
