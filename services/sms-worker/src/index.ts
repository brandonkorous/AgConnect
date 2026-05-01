import { runSmsWorker } from '@agconn/sms';

const ENV_KEYS_REQUIRED = ['DATABASE_URL', 'AUDIT_HMAC_KEY', 'PUBLIC_API_URL'] as const;

function assertEnv(): void {
  const missing = ENV_KEYS_REQUIRED.filter((k) => !process.env[k]);
  if (missing.length > 0) {
    throw new Error(`sms-worker: missing required env: ${missing.join(', ')}`);
  }
  if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_MESSAGING_SERVICE_SID) {
    console.warn('[sms-worker] Twilio env not configured — sends will dry-run (sms_log + audit still record)');
  }
}

async function main(): Promise<void> {
  assertEnv();
  const handle = await runSmsWorker();

  const shutdown = async (signal: string) => {
    console.log(`[sms-worker] received ${signal}, stopping…`);
    try {
      await handle.stop();
    } catch (err) {
      console.error('[sms-worker] error during shutdown', err);
    }
    process.exit(0);
  };

  process.on('SIGTERM', () => void shutdown('SIGTERM'));
  process.on('SIGINT', () => void shutdown('SIGINT'));
}

void main().catch((err) => {
  console.error('[sms-worker] fatal startup error', err);
  process.exit(1);
});
