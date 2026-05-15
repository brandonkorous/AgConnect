import { PgBoss } from 'pg-boss';
import { ParseExtractKind, ParseJobStatus, prisma } from '@agconn/db';
import { isProviderConfigured } from '@agconn/llm';
import { parseResume, type ParseResult } from './parser.js';

// Resume parser: consumes `resume.parse` events. Each job carries a tenant +
// worker user id + the raw text/PDF URL of an uploaded resume. We extract a
// ResumeSchema-conformant blob and patch it onto WorkerProfile.resume, and
// persist a ResumeParseJob row with token usage + cost for monthly rollups.
//
// The actual parser lives in ./parser.ts so it can be invoked from tests
// without booting pg-boss. When no LLM provider key is configured we fall
// back to writing `parser_status: 'failed'` so the worker is bounced into
// manual entry — same UX as before, just behind the queue boundary.

export const QUEUE = 'resume.parse';

export type ParseJob = {
    tenantId: string;
    userId: string;
    resumeRawUrl: string;
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

    // Create the audit row first so we can attribute even crashed parses.
    const row = await prisma.resumeParseJob.create({
        data: {
            tenantId,
            userId,
            blobPath: resumeRawUrl,
            status: ParseJobStatus.running,
        },
    });

    let result: ParseResult;
    try {
        result = await parseResume({ resumeRawUrl, rawText });
    } catch (e) {
        await prisma.resumeParseJob.update({
            where: { id: row.id },
            data: {
                status: ParseJobStatus.failed,
                errorCode: 'internal',
                errorMsg: e instanceof Error ? e.message : String(e),
                completedAt: new Date(),
            },
        });
        console.error('[resume-parser] handler threw', {
            userId,
            err: e instanceof Error ? e.message : String(e),
        });
        throw e;
    }

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
                ...(Array.isArray(result.resume.skills) && result.resume.skills.length > 0
                    ? { skills: result.resume.skills as string[] }
                    : {}),
            },
        });

        await prisma.resumeParseJob.update({
            where: { id: row.id },
            data: {
                status: ParseJobStatus.succeeded,
                extractKind: mapExtractKind(result.extractKind),
                rawTextLength: result.rawTextLength,
                modelUsed: result.modelUsed,
                inputTokens: result.usage.inputTokens,
                outputTokens: result.usage.outputTokens,
                cacheReadTokens: result.usage.cacheReadInputTokens ?? 0,
                cacheWriteTokens: result.usage.cacheCreationInputTokens ?? 0,
                costUsd: result.costUsd.toFixed(5),
                parseDurationMs: result.parseDurationMs,
                repairAttempted: result.repairAttempted,
                completedAt: new Date(),
            },
        });
        console.log('[resume-parser] parsed', {
            userId,
            tenantId,
            kind: result.extractKind,
            ms: result.parseDurationMs,
            costUsd: result.costUsd.toFixed(5),
            repaired: result.repairAttempted,
        });
        return;
    }

    // Failure path — record the diagnostic detail so an operator can re-process.
    await prisma.resumeParseJob.update({
        where: { id: row.id },
        data: {
            status: ParseJobStatus.failed,
            extractKind: result.extractKind ? mapExtractKind(result.extractKind) : null,
            rawTextLength: result.rawTextLength,
            modelUsed: result.modelUsed,
            inputTokens: result.usage?.inputTokens ?? null,
            outputTokens: result.usage?.outputTokens ?? null,
            cacheReadTokens: result.usage?.cacheReadInputTokens ?? null,
            cacheWriteTokens: result.usage?.cacheCreationInputTokens ?? null,
            costUsd: result.costUsd > 0 ? result.costUsd.toFixed(5) : null,
            parseDurationMs: result.parseDurationMs,
            repairAttempted: result.repairAttempted,
            errorCode: result.code,
            errorMsg: result.message,
            completedAt: new Date(),
        },
    });
    console.warn('[resume-parser] parse failed', {
        userId,
        reason: result.code,
        message: result.message,
    });
}

function mapExtractKind(kind: string): ParseExtractKind {
    switch (kind) {
        case 'pdf_text':
            return ParseExtractKind.pdf_text;
        case 'pdf_ocr':
            return ParseExtractKind.pdf_ocr;
        case 'docx':
            return ParseExtractKind.docx;
        case 'html':
            return ParseExtractKind.html;
        default:
            return ParseExtractKind.plaintext;
    }
}

function mergeResume(
    existing: Record<string, unknown>,
    fresh: Record<string, unknown>,
): Record<string, unknown> {
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
