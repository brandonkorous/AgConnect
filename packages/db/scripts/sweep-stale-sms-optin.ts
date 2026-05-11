// SMS opt-in stub cleanup. Workers who text JOBS/TRABAJO/etc. but never
// reply YES leave a `pending_confirm` User row sitting forever. Sweep
// these out after 48 hours so the table doesn't accumulate zombies and so
// any future re-attempt sees a clean slate (a fresh stub gets created
// with the right consentMethod provenance).
//
// Run via:
//   pnpm --filter @agconn/db sweep:sms-optin
//
// Production: should be wired as a daily k8s CronJob. See
// services/audit-retention for the existing nightly-cron pattern. TODO:
// wire this into a sibling cron service or extend audit-retention's RLS
// role to cover users.smsOptInState updates.

import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { config as loadEnv } from 'dotenv';

const here = dirname(fileURLToPath(import.meta.url));
loadEnv({ path: resolve(here, '..', '..', '..', '.env') });

const { prisma } = await import('../src/index.js');

const TTL_HOURS = 48;
const cutoff = new Date(Date.now() - TTL_HOURS * 60 * 60 * 1000);

const stale = await prisma.user.findMany({
  where: {
    smsOptInState: 'pending_confirm',
    updatedAt: { lt: cutoff },
  },
  select: { id: true, phone: true, updatedAt: true },
});

if (stale.length === 0) {
  console.log('[sweep-stale-sms-optin] no stale stubs');
  await prisma.$disconnect();
  process.exit(0);
}

console.log(`[sweep-stale-sms-optin] found ${stale.length} stale stubs (>${TTL_HOURS}h)`);

let purged = 0;
for (const u of stale) {
  // Sanity guard: never delete a user that has any associated activity.
  // Pending stubs by definition have no applications, enrollments, etc.;
  // if they do, something has merged unexpectedly and we want a human to look.
  const linked = await prisma.application.count({ where: { workerId: u.id } });
  if (linked > 0) {
    console.warn(`  skip ${u.id} — has ${linked} applications, not a clean stub`);
    continue;
  }

  await prisma.user.delete({ where: { id: u.id } });
  console.log(`  purged ${u.id} (phone=${u.phone}, pending since ${u.updatedAt.toISOString()})`);
  purged++;
}

console.log(`[sweep-stale-sms-optin] done; purged ${purged} of ${stale.length}`);
await prisma.$disconnect();
