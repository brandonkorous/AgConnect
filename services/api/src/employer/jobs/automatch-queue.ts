// Producer side of the auto-match queue. Consumer lives in
// services/sms-worker/src/automatch.ts.

import { PgBoss } from 'pg-boss';

export const AUTOMATCH_QUEUE = 'job.publish.automatch' as const;

export type AutomatchJob = {
  tenantId: string;
  jobId: string;
};

let cached: PgBoss | null = null;
let starting: Promise<PgBoss> | null = null;

export async function getAutomatchBoss(): Promise<PgBoss> {
  if (cached) return cached;
  if (starting) return starting;
  starting = (async () => {
    const url = process.env.DATABASE_URL;
    if (!url) throw new Error('DATABASE_URL not set');
    const boss = new PgBoss({ connectionString: url, schema: 'pgboss' });
    boss.on('error', (e: unknown) => console.error('[automatch pg-boss]', e));
    await boss.start();
    await boss.createQueue(AUTOMATCH_QUEUE);
    cached = boss;
    return boss;
  })();
  return starting;
}

export async function enqueueAutomatch(job: AutomatchJob): Promise<string | null> {
  const boss = await getAutomatchBoss();
  return boss.send(AUTOMATCH_QUEUE, job, {
    retryLimit: 2,
    retryBackoff: true,
    retryDelay: 60,
    expireInSeconds: 6 * 60 * 60,
    singletonKey: `automatch-${job.jobId}`,
    singletonSeconds: 24 * 60 * 60,
    startAfter: 30, // Let the publish transaction land first
  });
}
