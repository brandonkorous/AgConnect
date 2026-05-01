import { PgBoss } from 'pg-boss';

export const QUEUE_NAMES = {
  waitlistConfirm: 'email.waitlist.confirm',
  waitlistWelcome: 'email.waitlist.welcome',
} as const;

export type WaitlistConfirmJob = {
  waitlistId: string;
  tenantId: string;
  email: string;
  locale: 'en' | 'es';
};

export type WaitlistWelcomeJob = {
  waitlistId: string;
  tenantId: string;
  email: string;
  locale: 'en' | 'es';
};

let cachedBoss: PgBoss | null = null;
let starting: Promise<PgBoss> | null = null;

function getDatabaseUrl(): string {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL is not set — required for the email queue');
  return url;
}

/**
 * Returns a started pg-boss instance, creating it on first call.
 *
 * Producers (the API) and the worker share this lifecycle. Calling `start()`
 * is idempotent — pg-boss internally guards against duplicate schema setup —
 * but we cache the instance to avoid running setup twice in the same process.
 */
export async function getBoss(): Promise<PgBoss> {
  if (cachedBoss) return cachedBoss;
  if (starting) return starting;

  starting = (async () => {
    const boss = new PgBoss({
      connectionString: getDatabaseUrl(),
      schema: 'pgboss',
    });
    boss.on('error', (err: unknown) => {
      console.error('[pg-boss] error', err);
    });
    await boss.start();
    await Promise.all([
      boss.createQueue(QUEUE_NAMES.waitlistConfirm),
      boss.createQueue(QUEUE_NAMES.waitlistWelcome),
    ]);
    cachedBoss = boss;
    return boss;
  })();

  return starting;
}

export async function stopBoss(): Promise<void> {
  if (cachedBoss) {
    await cachedBoss.stop({ graceful: true, timeout: 10_000 });
    cachedBoss = null;
    starting = null;
  }
}

const SEND_OPTS = {
  retryLimit: 3,
  retryBackoff: true,
  retryDelay: 30,
  expireInSeconds: 24 * 60 * 60,
} as const;

export async function enqueueWaitlistConfirm(payload: WaitlistConfirmJob): Promise<string | null> {
  const boss = await getBoss();
  return boss.send(
    QUEUE_NAMES.waitlistConfirm,
    payload,
    {
      ...SEND_OPTS,
      singletonKey: `waitlist-confirm-${payload.waitlistId}`,
      singletonSeconds: 60 * 60,
    },
  );
}

export async function enqueueWaitlistWelcome(payload: WaitlistWelcomeJob): Promise<string | null> {
  const boss = await getBoss();
  return boss.send(
    QUEUE_NAMES.waitlistWelcome,
    payload,
    {
      ...SEND_OPTS,
      singletonKey: `waitlist-welcome-${payload.waitlistId}`,
      singletonSeconds: 24 * 60 * 60,
    },
  );
}
