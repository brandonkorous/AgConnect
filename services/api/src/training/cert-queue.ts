import PgBoss from 'pg-boss';

// Producer-side wrapper for the cert generator queue. The consumer lives in
// services/cert-generator and owns the queue contract; we just publish.

export const CERT_GENERATOR_QUEUE = 'enrollment.completed' as const;

let cached: PgBoss | null = null;
let starting: Promise<PgBoss> | null = null;

export async function getCertGeneratorBoss(): Promise<PgBoss> {
  if (cached) return cached;
  if (starting) return starting;
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL is not set — required for cert generator queue');

  starting = (async () => {
    const boss = new PgBoss({ connectionString: url, schema: 'pgboss' });
    boss.on('error', (err) => console.error('[cert-generator-queue] error', err));
    await boss.start();
    await boss.createQueue(CERT_GENERATOR_QUEUE);
    cached = boss;
    return boss;
  })();

  return starting;
}
