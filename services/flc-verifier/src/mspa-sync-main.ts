import { prisma } from '@agconn/db';
import { runMspaSync } from './mspa-sync.js';

// One-shot entrypoint for the flc-mspa-sync Kubernetes CronJob. Replaces the
// old in-process boss.schedule(FLC_MSPA_SYNC_QUEUE, …) tick. Downloads the
// latest data.gov MSPA dataset and ingests it into mspa_flc_registry. Pure
// Prisma — no queue — so a disconnect is all that's needed to exit cleanly.

async function main(): Promise<void> {
  const outcome = await runMspaSync();
  console.log('[flc-mspa-sync] complete', outcome);
}

main()
  .then(async () => {
    await prisma.$disconnect();
    process.exit(0);
  })
  .catch(async (err) => {
    console.error('[flc-mspa-sync] failed', err);
    await prisma.$disconnect().catch(() => {});
    process.exit(1);
  });
