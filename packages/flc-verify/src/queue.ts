import { PgBoss } from 'pg-boss';

// Per-employer FLC verification job. Producers (POST /v1/employer/onboarding,
// PATCH /v1/employer/me on license change, the nightly sweep) enqueue here;
// services/flc-verifier consumes.
export const FLC_VERIFY_QUEUE = 'flc.verify' as const;

// Nightly cron tick: scans employer_profiles for FLC employers due for a
// re-check and enqueues FLC_VERIFY jobs for each.
export const FLC_SWEEP_QUEUE = 'flc.sweep' as const;

// Nightly cron tick: pulls the latest data.gov MSPA dataset and ingests it
// into mspa_flc_registry. Independent of per-employer verifies because the
// dataset only refreshes monthly upstream.
export const FLC_MSPA_SYNC_QUEUE = 'flc.mspa.sync' as const;

export type FlcVerifyReason =
  | 'onboarding'
  | 'license_changed'
  | 'nightly_sweep'
  | 'admin_requested';

export type FlcVerifyJob = {
  employerId: string;
  tenantId: string;
  reason: FlcVerifyReason;
};

let cachedBoss: PgBoss | null = null;
let starting: Promise<PgBoss> | null = null;

function getDatabaseUrl(): string {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL is not set — required for the FLC verify queue');
  return url;
}

export async function getFlcVerifyBoss(): Promise<PgBoss> {
  if (cachedBoss) return cachedBoss;
  if (starting) return starting;

  starting = (async () => {
    const boss = new PgBoss({
      connectionString: getDatabaseUrl(),
      schema: 'pgboss',
    });
    boss.on('error', (err: unknown) => {
      console.error('[flc-verify pg-boss] error', err);
    });
    await boss.start();
    await boss.createQueue(FLC_VERIFY_QUEUE);
    cachedBoss = boss;
    return boss;
  })();

  return starting;
}

export async function stopFlcVerifyBoss(): Promise<void> {
  if (cachedBoss) {
    await cachedBoss.stop({ graceful: true, timeout: 10_000 });
    cachedBoss = null;
    starting = null;
  }
}

const SEND_OPTS = {
  retryLimit: 3,
  retryBackoff: true,
  retryDelay: 60,
  expireInSeconds: 23 * 60 * 60,
} as const;

export type EnqueueFlcVerifyArgs = FlcVerifyJob & {
  // Override the auto-generated singleton key when you need to force a fresh
  // attempt within the dedup window (e.g. admin clicked "re-check now").
  jobKey?: string;
};

export async function enqueueFlcVerify(args: EnqueueFlcVerifyArgs): Promise<string | null> {
  const boss = await getFlcVerifyBoss();
  // Default dedup: one verify per employer per hour. The nightly sweep gives
  // each employer a fresh key by date, so the cron will always go through.
  const singletonKey = args.jobKey ?? `flc-verify-${args.employerId}`;

  const payload: FlcVerifyJob = {
    employerId: args.employerId,
    tenantId: args.tenantId,
    reason: args.reason,
  };

  return boss.send(FLC_VERIFY_QUEUE, payload, {
    ...SEND_OPTS,
    singletonKey,
    singletonSeconds: 60 * 60,
  });
}
