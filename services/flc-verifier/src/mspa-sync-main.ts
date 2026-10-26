import { serviceDb } from '@agconn/db';
import { runMspaSync } from './mspa-sync.js';

// One-shot entrypoint for the flc-mspa-sync CronJob: download the data.gov MSPA file and ingest it.

async function main(): Promise<void> {
  const outcome = await runMspaSync();
  console.log('[flc-mspa-sync] complete', outcome);
}

main()
  .then(async () => {
    await serviceDb.$disconnect();
    process.exit(0);
  })
  .catch(async (err) => {
    console.error('[flc-mspa-sync] failed', err);
    await serviceDb.$disconnect().catch(() => {});
    process.exit(1);
  });
