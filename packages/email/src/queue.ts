import { PgBoss } from 'pg-boss';

export const QUEUE_NAMES = {
  waitlistConfirm: 'email.waitlist.confirm',
  waitlistWelcome: 'email.waitlist.welcome',
  employer: 'email.employer',
  grantReport: 'email.grant.report',
} as const;

// Waitlist signups are platform-level (no owning tenant). The job runs
// under role='service' without a pinned app.tenant_id; the relaxed
// waitlist_service / email_log_service policies cover NULL-tenant rows.
export type WaitlistConfirmJob = {
  waitlistId: string;
  email: string;
  locale: 'en' | 'es';
};

export type WaitlistWelcomeJob = {
  waitlistId: string;
  email: string;
  locale: 'en' | 'es';
};

export type EmployerEmailTemplate =
  | 'employer.flc_pending'
  | 'employer.flc_verified'
  | 'employer.flc_rejected'
  | 'employer.billing.subscription_started'
  | 'employer.billing.subscription_canceled'
  | 'employer.billing.payment_failed'
  | 'employer.billing.invoice_paid';

export type EmployerEmailJob = {
  template: EmployerEmailTemplate;
  employerId: string;
  tenantId: string;
  to: string | null;                           // null → resolved from employer_profiles.contactEmail at send time
  locale: 'en' | 'es';
  vars: Record<string, string | number | null>;
  idempotencyKey: string;
};

export type GrantReportEmailTemplate = 'grant.report_ready';

export type GrantReportEmailJob = {
  template: GrantReportEmailTemplate;
  reportRunId: string;
  to: string;
  locale: 'en' | 'es';
  vars: Record<string, string | number | null>;
  idempotencyKey: string;
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
      boss.createQueue(QUEUE_NAMES.employer),
      boss.createQueue(QUEUE_NAMES.grantReport),
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
  expireInHours: 23,
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

export async function enqueueEmployerEmail(payload: EmployerEmailJob): Promise<string | null> {
  const boss = await getBoss();
  return boss.send(QUEUE_NAMES.employer, payload, {
    ...SEND_OPTS,
    singletonKey: payload.idempotencyKey,
    singletonSeconds: 24 * 60 * 60,
  });
}

export async function enqueueGrantReportEmail(
  payload: GrantReportEmailJob,
): Promise<string | null> {
  const boss = await getBoss();
  return boss.send(QUEUE_NAMES.grantReport, payload, {
    ...SEND_OPTS,
    singletonKey: payload.idempotencyKey,
    singletonSeconds: 24 * 60 * 60,
  });
}
