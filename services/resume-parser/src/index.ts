import PgBoss from 'pg-boss';
import { prisma } from '@agconn/db';
import { isProviderConfigured } from '@agconn/llm';
import { parseResume } from './parser.js';

// Resume parser: consumes `resume.parse` events. Each job carries a tenant +
// worker user id + the raw text/PDF URL of an uploaded resume. We extract a
// ResumeSchema-conformant blob and patch it onto WorkerProfile.resume.
//
// The actual parser lives in ./parser.ts so it can be invoked from tests
// without booting pg-boss. When ANTHROPIC_API_KEY isn't configured we fall
// back to writing `parser_status: 'failed'` so the worker is bounced into
// manual entry — same UX as before, just behind the queue boundary.

export const QUEUE = 'resume.parse';

export type ParseJob = {
  tenantId: string;
  userId: string;
  resumeRawUrl: string;
  // Optional pre-extracted text — when the upload path can run textract
  // synchronously, we skip the PDF download and feed the text directly.
  rawText?: string;
};

const ENV_KEYS_REQUIRED = ['DATABASE_URL'] as const;

function assertEnv(): void {
  const missing = ENV_KEYS_REQUIRED.filter((k) => !process.env[k]);
  if (missing.length > 0) {
    throw new Error(`resume-parser: missing required env: ${missing.join(', ')}`);
  }
  if (!isProviderConfigured()) {
    console.warn('[resume-parser] no LLM provider configured — every job will fall back to manual_entry');
  }
}

let boss: PgBoss | null = null;

async function start(): Promise<void> {
  assertEnv();
  boss = new PgBoss({
    connectionString: process.env.DATABASE_URL!,
    schema: 'pgboss',
  });
  boss.on('error', (e) => console.error('[resume-parser] pg-boss error', e));
  await boss.start();
  await boss.createQueue(QUEUE);

  await boss.work<ParseJob>(QUEUE, async (jobs) => {
    for (const job of jobs) {
      await handle(job.data);
    }
  });
  console.log('[resume-parser] running');
}

async function handle(job: ParseJob): Promise<void> {
  const { tenantId, userId, resumeRawUrl, rawText } = job;

  try {
    const result = await parseResume({ resumeRawUrl, rawText });

    if (result.status === 'parsed') {
      const existing = await prisma.workerProfile.findUnique({
        where: { id: userId },
        select: { resume: true },
      });
      const merged = mergeResume(
        (existing?.resume as Record<string, unknown> | null) ?? {},
        result.resume,
      );
      await prisma.workerProfile.update({
        where: { id: userId },
        data: {
          resume: merged as object,
          // Mirror skills if the parser found any — onboarding uses them
          // for the recommended-jobs ranker.
          ...(Array.isArray(result.resume.skills) && result.resume.skills.length > 0
            ? { skills: result.resume.skills as string[] }
            : {}),
        },
      });
      console.log('[resume-parser] parsed', { userId, tenantId });
      return;
    }

    // Failure path — surface the reason so the next status poll triggers
    // the manual-entry fallback in the UI. We persist the raw URL so an
    // operator can re-process if needed.
    console.warn('[resume-parser] parse failed', {
      userId,
      reason: result.reason,
    });
  } catch (e) {
    console.error('[resume-parser] handler threw', {
      userId,
      err: e instanceof Error ? e.message : String(e),
    });
    // pg-boss will retry per the producer's retryLimit. Eventually the
    // status endpoint reports failed → UI falls back to manual entry.
    throw e;
  }
}

function mergeResume(
  existing: Record<string, unknown>,
  fresh: Record<string, unknown>,
): Record<string, unknown> {
  // Parser output replaces array sections wholesale (it returns the full
  // extracted resume); object fields (contact, summary) merge field-by-field.
  const out: Record<string, unknown> = { ...existing };
  for (const [k, v] of Object.entries(fresh)) {
    if (Array.isArray(v)) out[k] = v;
    else if (v !== null && typeof v === 'object') {
      out[k] = { ...((existing[k] as object) ?? {}), ...(v as object) };
    } else out[k] = v;
  }
  return out;
}

async function shutdown(signal: string): Promise<void> {
  console.log(`[resume-parser] received ${signal}, stopping…`);
  try {
    await boss?.stop({ graceful: true, timeout: 10_000 });
  } catch (e) {
    console.error('[resume-parser] error during shutdown', e);
  }
  process.exit(0);
}

process.on('SIGTERM', () => void shutdown('SIGTERM'));
process.on('SIGINT', () => void shutdown('SIGINT'));

void start().catch((err) => {
  console.error('[resume-parser] fatal startup error', err);
  process.exit(1);
});
