import { PgBoss } from 'pg-boss';
import { prisma, EnrollmentStatus } from '@agconn/db';
import { enqueueSms } from '@agconn/sms';
import { renderCertPdf } from './render.js';
import { uploadCert } from './storage.js';

// Cert generator: consumes `enrollment.completed` events and produces a
// bilingual certificate PDF. Renders via React-PDF, uploads to the private
// Supabase 'certs' bucket, stamps the resulting storage key on the Enrollment.
// The wallet API mints 24h signed URLs on read.
//
// Producers: training/routes.ts mark-complete + employer org training tools
// publish to this queue. The queue is created here so producers can blind-fire
// without coordinating queue boot order.

export const QUEUE = 'enrollment.completed';

export type CompletionJob = {
    enrollmentId: string;
    tenantId: string;
};

const ENV_KEYS_REQUIRED = ['DATABASE_URL', 'SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY'] as const;

function assertEnv(): void {
    const missing = ENV_KEYS_REQUIRED.filter((k) => !process.env[k]);
    if (missing.length > 0) {
        throw new Error(`cert-generator: missing required env: ${missing.join(', ')}`);
    }
}

let boss: PgBoss | null = null;

async function start(): Promise<void> {
    assertEnv();
    boss = new PgBoss({
        connectionString: process.env.DATABASE_URL!,
        schema: 'pgboss',
    });
    boss.on('error', (e) => console.error('[cert-generator] pg-boss error', e));
    await boss.start();
    await boss.createQueue(QUEUE);

    await boss.work<CompletionJob>(QUEUE, async (jobs) => {
        for (const job of jobs) {
            await handle(job.data);
        }
    });
    console.log('[cert-generator] running');
}

async function handle({ enrollmentId, tenantId }: CompletionJob): Promise<void> {
    const enrollment = await prisma.enrollment.findUnique({
        where: { id: enrollmentId },
        include: {
            program: {
                include: {
                    org: {
                        select: {
                            employerContacts: {
                                where: { deletedAt: null },
                                take: 1,
                                select: { employer: { select: { legalName: true } } },
                            },
                        },
                    },
                },
            },
            worker: true,
        },
    });
    if (!enrollment) {
        console.warn('[cert-generator] enrollment not found', { enrollmentId });
        return;
    }
    if (enrollment.status !== EnrollmentStatus.completed) {
        console.warn('[cert-generator] enrollment not completed yet', {
            enrollmentId,
            status: enrollment.status,
        });
        return;
    }
    if (enrollment.certUrl) return; // idempotent — already rendered

    const certificateId =
        enrollment.certificateId ??
        `AC-${new Date().getFullYear()}-${enrollmentId.slice(0, 8).toUpperCase()}`;

    const profile = await prisma.workerProfile.findUnique({
        where: { id: enrollment.workerId },
    });

    const pdfBuffer = await renderCertPdf({
        workerFirstName: profile?.firstName ?? '',
        workerLastName: profile?.lastName ?? '',
        programTitleEn: enrollment.program.titleEn,
        programTitleEs: enrollment.program.titleEs,
        funder: enrollment.program.funder,
        orgName:
            enrollment.program.org?.employerContacts[0]?.employer.legalName ??
            'Training organization',
        completedAt: enrollment.completedAt ?? new Date(),
        certificateId,
    });

    const storageKey = await uploadCert({
        tenantId,
        enrollmentId,
        certificateId,
        body: pdfBuffer,
    });

    // certUrl now stores the Supabase storage key, not a directly-fetchable URL.
    // The wallet endpoint signs it on read with a 24h TTL.
    await prisma.enrollment.update({
        where: { id: enrollmentId },
        data: { certificateId, certUrl: storageKey, certGeneratedAt: new Date() },
    });

    try {
        await enqueueSms({
            tenantId,
            userId: enrollment.workerId,
            template: 'training.completed',
            vars: {
                programTitle: enrollment.program.titleEn,
                // SMS gets the wallet deep link rather than the raw storage key —
                // worker opens the wallet, which mints a signed URL on the fly.
                certUrl: `${process.env.PUBLIC_WEB_URL ?? 'https://agconn.com'}/wallet/cert/${enrollmentId}`,
            },
            jobKey: `training.completed-${enrollmentId}`,
        });
    } catch (e) {
        console.error('[cert-generator] training.completed SMS enqueue failed', {
            enrollmentId,
            err: e instanceof Error ? e.message : String(e),
        });
    }
}

async function shutdown(signal: string): Promise<void> {
    console.log(`[cert-generator] received ${signal}, stopping…`);
    try {
        await boss?.stop({ graceful: true, timeout: 10_000 });
    } catch (e) {
        console.error('[cert-generator] error during shutdown', e);
    }
    process.exit(0);
}

process.on('SIGTERM', () => void shutdown('SIGTERM'));
process.on('SIGINT', () => void shutdown('SIGINT'));

void start().catch((err) => {
    console.error('[cert-generator] fatal startup error', err);
    process.exit(1);
});
