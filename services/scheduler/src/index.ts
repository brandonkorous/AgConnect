import { PgBoss } from 'pg-boss';
import { runSavedSearchDispatcher } from './saved-search-dispatcher.js';
import { runTrainingReminders } from './training-reminders.js';

// Single scheduler service that owns every cron job + every queue consumer
// that isn't tied to a specific output adapter (SMS, email). The cert
// generator and resume parser run as their own services because their
// dependencies (PDF rendering, LLM calls) are heavy and likely scale on
// different cadences than the cron loop.
//
// Each handler is idempotent — pg-boss redelivery on retry must not double
// SMS / over-mark anything. Idempotency keys live next to each handler.

const ENV_KEYS_REQUIRED = ['DATABASE_URL'] as const;

function assertEnv(): void {
  const missing = ENV_KEYS_REQUIRED.filter((k) => !process.env[k]);
  if (missing.length > 0) {
    throw new Error(`scheduler: missing required env: ${missing.join(', ')}`);
  }
}

let boss: PgBoss | null = null;

async function start(): Promise<void> {
  assertEnv();
  boss = new PgBoss({
    connectionString: process.env.DATABASE_URL!,
    schema: 'pgboss',
  });
  boss.on('error', (err) => {
    console.error('[scheduler] pg-boss error', err);
  });
  await boss.start();

  await runSavedSearchDispatcher(boss);
  await runTrainingReminders(boss);

  console.log('[scheduler] running');
}

async function shutdown(signal: string): Promise<void> {
  console.log(`[scheduler] received ${signal}, stopping…`);
  try {
    await boss?.stop({ graceful: true, timeout: 10_000 });
  } catch (err) {
    console.error('[scheduler] error during shutdown', err);
  }
  process.exit(0);
}

process.on('SIGTERM', () => void shutdown('SIGTERM'));
process.on('SIGINT', () => void shutdown('SIGINT'));

void start().catch((err) => {
  console.error('[scheduler] fatal startup error', err);
  process.exit(1);
});
