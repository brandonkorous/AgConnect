import { asService, serviceDb } from '@agconn/db';
import { stopFlcVerifyBoss } from '@agconn/flc-verify';
import { runFlcSweep } from './sweep.js';

// One-shot entrypoint for the flc-sweep CronJob; stops pg-boss and the pool so the process can exit.

async function main(): Promise<void> {
  const outcome = await asService(runFlcSweep)();
  console.log('[flc-sweep] complete', outcome);
}

main()
  .then(async () => {
    await stopFlcVerifyBoss();
    await serviceDb.$disconnect();
    process.exit(0);
  })
  .catch(async (err) => {
    console.error('[flc-sweep] failed', err);
    await stopFlcVerifyBoss().catch(() => {});
    await serviceDb.$disconnect().catch(() => {});
    process.exit(1);
  });
