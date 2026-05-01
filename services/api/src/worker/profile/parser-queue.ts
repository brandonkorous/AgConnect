import PgBoss from 'pg-boss';

// Thin wrapper around the resume-parser pg-boss queue. Lives here in the API
// rather than in @agconn/llm because the queue contract is owned by the
// services/resume-parser worker; producers (this API) only need to enqueue.

export const RESUME_PARSE_QUEUE = 'resume.parse' as const;

let cached: PgBoss | null = null;
let starting: Promise<PgBoss> | null = null;

export async function getResumeParserBoss(): Promise<PgBoss> {
  if (cached) return cached;
  if (starting) return starting;
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL is not set — required for resume parser queue');

  starting = (async () => {
    const boss = new PgBoss({ connectionString: url, schema: 'pgboss' });
    boss.on('error', (err) => console.error('[resume-parser-queue] error', err));
    await boss.start();
    await boss.createQueue(RESUME_PARSE_QUEUE);
    cached = boss;
    return boss;
  })();

  return starting;
}
