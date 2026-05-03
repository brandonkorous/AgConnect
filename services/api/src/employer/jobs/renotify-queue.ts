// pg-boss producer for the job-edit re-notification pipeline.
//
// When an employer materially edits a published job (wage, dates, location,
// description, etc.), every active applicant on that job needs a heads-up.
// The API records a JobEditEvent, then enqueues one renotify job per (event,
// application, channel) tuple — the consumer in services/sms-worker (and the
// email-worker counterpart) reads the row and dispatches.

import { PgBoss } from 'pg-boss';

export const RENOTIFY_QUEUE = 'job.edit.renotify' as const;

export type RenotifyJob = {
  tenantId: string;
  jobId: string;
  editEventId: string;
  applicationId: string;
  workerId: string;
  channel: 'sms' | 'email' | 'app';
  // Short summary of what changed, so the consumer can pick the right SMS
  // template + variables without re-querying the diff.
  changeSummary: {
    fields: string[];
    titleEn: string;
    titleEs: string;
    employerName: string;
  };
};

let cached: PgBoss | null = null;
let starting: Promise<PgBoss> | null = null;

export async function getRenotifyBoss(): Promise<PgBoss> {
  if (cached) return cached;
  if (starting) return starting;
  starting = (async () => {
    const url = process.env.DATABASE_URL;
    if (!url) throw new Error('DATABASE_URL not set');
    const boss = new PgBoss({ connectionString: url, schema: 'pgboss' });
    boss.on('error', (e: unknown) => console.error('[renotify pg-boss]', e));
    await boss.start();
    await boss.createQueue(RENOTIFY_QUEUE);
    cached = boss;
    return boss;
  })();
  return starting;
}

export async function enqueueRenotify(job: RenotifyJob): Promise<string | null> {
  const boss = await getRenotifyBoss();
  // Idempotent on (editEvent, application, channel) so repeated enqueue calls
  // for the same edit never fan out to duplicate notifications.
  const singletonKey = `${job.editEventId}-${job.applicationId}-${job.channel}`;
  return boss.send(RENOTIFY_QUEUE, job, {
    retryLimit: 3,
    retryBackoff: true,
    retryDelay: 60,
    expireInSeconds: 12 * 60 * 60,
    singletonKey,
    singletonSeconds: 24 * 60 * 60,
  });
}
