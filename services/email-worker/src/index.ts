import { runEmailWorker } from '@agconn/email';

const ENV_KEYS_REQUIRED = [
  'DATABASE_URL',
  'WAITLIST_TOKEN_SECRET',
  'PUBLIC_WEB_URL',
  'PUBLIC_API_URL',
] as const;

function assertEnv(): void {
  const missing = ENV_KEYS_REQUIRED.filter((k) => !process.env[k]);
  if (missing.length > 0) {
    throw new Error(`email-worker: missing required env: ${missing.join(', ')}`);
  }
  if (!process.env.RESEND_API_KEY) {
    console.warn('[worker] RESEND_API_KEY missing — sends will be skipped (suppression check still runs)');
  }
}

async function main(): Promise<void> {
  assertEnv();
  const handle = await runEmailWorker();

  const shutdown = async (signal: string) => {
    console.log(`[worker] received ${signal}, stopping…`);
    try {
      await handle.stop();
    } catch (err) {
      console.error('[worker] error during shutdown', err);
    }
    process.exit(0);
  };

  process.on('SIGTERM', () => void shutdown('SIGTERM'));
  process.on('SIGINT', () => void shutdown('SIGINT'));
}

void main().catch((err) => {
  console.error('[worker] fatal startup error', err);
  process.exit(1);
});
