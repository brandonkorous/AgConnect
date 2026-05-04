// One-time seed: loads compliance_item_content rows from the static TS file
// (packages/db/seed-data/compliance-item-content.ts) into the DB.
//
// After this runs, the DB is the source of truth — the TS file is retained
// only as a snapshot/fallback for re-seeding a fresh environment. Edits flow
// through the (future) admin surface, not the file.
//
// Idempotent: each row is upserted by item_key. Aliases in the TS file are
// applied so DB rows use the SHORT compliance_items.item_key form.
//
// Usage: pnpm --filter @agconn/db exec tsx scripts/seed-compliance-item-content.ts

import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { config as loadEnv } from 'dotenv';

const here = dirname(fileURLToPath(import.meta.url));
loadEnv({ path: resolve(here, '..', '..', '..', '.env') });

const { prisma } = await import('../src/index.js');
const { COMPLIANCE_ITEM_CONTENT } = await import('../seed-data/compliance-item-content.js');

// Mirror of ITEM_KEY_ALIASES from the TS file, but inverted: long-form
// content key → DB short key. Keep in sync if either side changes.
const LONG_TO_SHORT: Record<string, string> = {
  i_9_forms_on_file: 'i9_on_file',
  i_9s_expiring_within_30_days: 'i9_expiring',
  w_4s_collected: 'w4_collected',
  notice_of_intent: 'noi_filing',
  application_records_pur: 'pur_records',
  covid_19_prevention_plan: 'covid_plan',
  heat_illness_prevention_plan: 'heat_plan',
  pesticide_handler_training_wps: 'wps_training',
  overtime_calculations: 'overtime',
  piece_rate_paid_breaks_tracked: 'piece_breaks',
  itemized_wage_statements: 'wage_stmts',
};

let inserted = 0;
let updated = 0;
let skipped = 0;

for (const [longKey, content] of Object.entries(COMPLIANCE_ITEM_CONTENT)) {
  if (!content.why?.en) {
    skipped++;
    continue;
  }
  const dbKey = LONG_TO_SHORT[longKey] ?? longKey;
  const existing = await prisma.complianceItemContent.findUnique({
    where: { itemKey: dbKey },
    select: { itemKey: true },
  });
  await prisma.complianceItemContent.upsert({
    where: { itemKey: dbKey },
    create: { itemKey: dbKey, content: content as object },
    update: { content: content as object },
  });
  if (existing) {
    updated++;
    console.log(`  updated  ${dbKey}  ←  ${longKey}`);
  } else {
    inserted++;
    console.log(`  inserted ${dbKey}  ←  ${longKey}`);
  }
}

console.log(`\nDone. Inserted ${inserted}, updated ${updated}, skipped ${skipped} (no en.why).`);
await prisma.$disconnect();
