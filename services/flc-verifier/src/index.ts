import { PgBoss } from 'pg-boss';
import {
  FLC_VERIFY_QUEUE,
  FLC_SWEEP_QUEUE,
  FLC_MSPA_SYNC_QUEUE,
  type FlcVerifyJob,
} from '@agconn/flc-verify';
import { handleVerifyJob } from './handler.js';
import { runFlcSweep } from './sweep.js';
import { runMspaSync } from './mspa-sync.js';

// Single long-running worker that owns three queues:
//
//   - flc.verify      (per-employer, fan-in from signup + sweep + admin)
//   - flc.sweep       (cron, enqueues flc.verify for due employers)
//   - flc.mspa.sync   (cron, downloads + ingests data.gov MSPA dataset)
//
// All three live in one process because they share the same pg-boss
// instance and operational profile (small, network-bound, low-CPU).
// Splitting them into separate deployments would only add complexity.

const ENV_KEYS_REQUIRED = ['DATABASE_URL'] as const;

// Cron schedules. Sweep first (4 AM UTC = 8 PM PT previous day), MSPA sync
// 30 minutes later. Both run before the audit-cronjobs sweep at 02:00–03:00
// of the *following* night to avoid DB contention.
const SWEEP_CRON = '0 4 * * *';
const MSPA_SYNC_CRON = '30 4 * * *';

function assertEnv(): void {
  const missing = ENV_KEYS_REQUIRED.filter((k) => !process.env[k]);
  if (missing.length > 0) {
    throw new Error(`flc-verifier: missing required env: ${missing.join(', ')}`);
  }
}

let boss: PgBoss | null = null;

async function start(): Promise<void> {
  assertEnv();
  boss = new PgBoss({
    connectionString: process.env.DATABASE_URL!,
    schema: 'pgboss',
  });
  boss.on('error', (err) => console.error('[flc-verifier] pg-boss error', err));
  await boss.start();

  await boss.createQueue(FLC_VERIFY_QUEUE);
  await boss.createQueue(FLC_SWEEP_QUEUE);
  await boss.createQueue(FLC_MSPA_SYNC_QUEUE);

  await boss.work<FlcVerifyJob>(FLC_VERIFY_QUEUE, async (jobs) => {
    for (const job of jobs) {
      try {
        await handleVerifyJob(job.data);
      } catch (err) {
        console.error('[flc-verifier] verify handler failed', {
          employerId: job.data.employerId,
          err: err instanceof Error ? err.message : String(err),
        });
        throw err;
      }
    }
  });

  await boss.work(FLC_SWEEP_QUEUE, async () => {
    const outcome = await runFlcSweep();
    console.log('[flc-verifier] sweep complete', outcome);
  });

  await boss.work(FLC_MSPA_SYNC_QUEUE, async () => {
    const outcome = await runMspaSync();
    console.log('[flc-verifier] mspa sync complete', outcome);
  });

  await boss.schedule(FLC_SWEEP_QUEUE, SWEEP_CRON);
  await boss.schedule(FLC_MSPA_SYNC_QUEUE, MSPA_SYNC_CRON);

  console.log(
    `[flc-verifier] running; verify=on, sweep=${SWEEP_CRON}, mspa-sync=${MSPA_SYNC_CRON}`,
  );
}

async function shutdown(signal: string): Promise<void> {
  console.log(`[flc-verifier] received ${signal}, stopping…`);
  try {
    await boss?.stop({ graceful: true, timeout: 10_000 });
  } catch (err) {
    console.error('[flc-verifier] error during shutdown', err);
  }
  process.exit(0);
}

process.on('SIGTERM', () => void shutdown('SIGTERM'));
process.on('SIGINT', () => void shutdown('SIGINT'));

void start().catch((err) => {
  console.error('[flc-verifier] fatal startup error', err);
  process.exit(1);
});
