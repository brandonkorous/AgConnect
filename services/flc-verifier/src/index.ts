import { PgBoss } from 'pg-boss';
import { FLC_VERIFY_QUEUE, type FlcVerifyJob } from '@agconn/flc-verify';
import { handleVerifyJob } from './handler.js';

// Scale-to-zero consumer for the per-employer FLC verification queue.
//
// This process owns ONLY flc.verify (fan-in from signup + admin re-check +
// the nightly sweep). It carries no in-process cron: the two cron ticks that
// used to live here — flc.sweep and flc.mspa.sync — are now native Kubernetes
// CronJobs (deploy/k8s/base/flc-cronjobs.yaml) invoking sweep-main.ts /
// mspa-sync-main.ts. That split is what lets KEDA idle this deployment at
// zero replicas: with no self-scheduled clock, the only reason to run is a
// pending flc.verify job, which the KEDA pg-boss scaler detects.
//
// Lifecycle: producers persist jobs to pgboss.job whether or not a consumer
// is up. KEDA scales 0→N on backlog; this boots, drains, idles; KEDA scales
// back to 0 after cooldown. SIGTERM (scale-down) drains in-flight work first.

const ENV_KEYS_REQUIRED = ['DATABASE_URL'] as const;

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

  // Idempotent — the producer side (@agconn/flc-verify) also creates this, but
  // creating here keeps a cold first-ever boot self-sufficient.
  await boss.createQueue(FLC_VERIFY_QUEUE);

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

  console.log('[flc-verifier] running; verify=on (scale-to-zero consumer)');
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
