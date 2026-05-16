import { prisma } from '@agconn/db';
import { stopFlcVerifyBoss } from '@agconn/flc-verify';
import { runFlcSweep } from './sweep.js';

// One-shot entrypoint for the flc-sweep Kubernetes CronJob. Replaces the old
// in-process boss.schedule(FLC_SWEEP_QUEUE, …) tick. Scans FLC employers due
// for re-verification and fans out flc.verify jobs; those jobs then wake the
// scale-to-zero flc-verifier consumer via the KEDA pg-boss scaler.
//
// runFlcSweep enqueues through @agconn/flc-verify, which lazily opens its own
// pg-boss connection — so we must stop it (and disconnect Prisma) for the
// process to exit instead of hanging on open handles.

async function main(): Promise<void> {
  const outcome = await runFlcSweep();
  console.log('[flc-sweep] complete', outcome);
}

main()
  .then(async () => {
    await stopFlcVerifyBoss();
    await prisma.$disconnect();
    process.exit(0);
  })
  .catch(async (err) => {
    console.error('[flc-sweep] failed', err);
    await stopFlcVerifyBoss().catch(() => {});
    await prisma.$disconnect().catch(() => {});
    process.exit(1);
  });
