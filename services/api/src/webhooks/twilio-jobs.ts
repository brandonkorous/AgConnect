import { enqueueSms } from '@agconn/sms';
import { dbClients, AppStatus } from '@agconn/db';
import { emitSystemAudit } from '../middleware/audit.js';
import { SYSTEM_TENANT_ID, setOnboarding } from './twilio-optin.js';

// Jobs digest and SMS-apply for consented workers. Runs as app.role = 'webhook'.
const db = () => dbClients.webhooks;

type DigestJob = { id: string; titleEn: string; titleEs: string; wageMin: unknown; wageMax: unknown; smsApplyKeyword: string | null };

function digestList(jobs: DigestJob[], lang: 'en' | 'es'): string {
    return jobs
        .map((j) => {
            const title = lang === 'en' ? j.titleEn : j.titleEs;
            const code = j.smsApplyKeyword ?? `JOB-${j.id.slice(0, 4)}`;
            return `${title} $${Number(j.wageMin)}-${Number(j.wageMax)}/hr — ${code}`;
        })
        .join('\n');
}

export async function sendJobsDigest(user: { id: string; preferredLang: unknown }): Promise<void> {
    const profile = await db().workerProfile.findUnique({ where: { id: user.id }, select: { county: true } });
    const lang = String(user.preferredLang) === 'en' ? 'en' : 'es';
    if (!profile?.county) {
        // Consented but not matchable: restart onboarding (name first), never silence.
        await setOnboarding(user.id, 'await_name', {});
        const jobKey = `onboard-welcome-${user.id}-${Date.now()}`;
        await enqueueSms({ tenantId: SYSTEM_TENANT_ID, userId: user.id, template: 'sms.optin.welcome', vars: {}, jobKey });
        return;
    }
    const jobs = await db().jobPosting.findMany({
        where: { county: profile.county, status: 'active', deletedAt: null },
        orderBy: { publishedAt: 'desc' },
        take: 3,
        select: { id: true, titleEn: true, titleEs: true, wageMin: true, wageMax: true, smsApplyKeyword: true },
    });
    const stamp = `${user.id}-${Date.now()}`;
    if (jobs.length === 0) {
        const vars = { county: String(profile.county) };
        await enqueueSms({ tenantId: SYSTEM_TENANT_ID, userId: user.id, template: 'sms.jobs.none', vars, jobKey: `jobs-none-${stamp}` });
        return;
    }
    const vars = { list: digestList(jobs, lang) };
    await enqueueSms({ tenantId: SYSTEM_TENANT_ID, userId: user.id, template: 'sms.jobs.digest', vars, jobKey: `jobs-digest-${stamp}` });
}

type ApplyKeyword = { id: string; tenantId: string; keyword: string; entityId: string };

async function findApplyingWorker(fromPhone: string, keyword: ApplyKeyword) {
    const worker = await db().user.findFirst({ where: { phone: fromPhone, role: 'worker', deletedAt: null } });
    if (worker) return worker;
    console.warn('[twilio] sms-apply: unknown phone, dropped', { toPhone: fromPhone, keyword: keyword.keyword });
    await emitSystemAudit({
        action: 'system.sms.dropped',
        resourceType: 'sms_keyword',
        resourceId: keyword.id,
        metadata: { template: 'sms.apply.unknown_phone', reason: 'unknown_worker', toPhone: fromPhone },
    });
    return null;
}

// Idempotent: a worker who already applied to the job keeps the existing application.
export async function handleJobApply(args: { keyword: ApplyKeyword; fromPhone: string }): Promise<void> {
    const { keyword, fromPhone } = args;
    if (!fromPhone) return;
    const job = await db().jobPosting.findFirst({
        where: { id: keyword.entityId, deletedAt: null, status: 'active' },
        include: { employer: { select: { legalName: true, dbaName: true } } },
    });
    if (!job) return;
    const worker = await findApplyingWorker(fromPhone, keyword);
    if (!worker) return;
    const existing = await db().application.findFirst({ where: { jobId: job.id, workerId: worker.id } });
    const applicationId = existing?.id ?? (await db().application.create({
        data: {
            tenantId: job.tenantId, jobId: job.id, workerId: worker.id,
            status: AppStatus.applied, countyAtApply: job.county, skillsAtApply: [],
        },
    })).id;
    // Usage stamp so the employer sees SMS-apply traffic.
    await db().smsKeyword.update({ where: { id: keyword.id }, data: { lastUsedAt: new Date() } });
    const employer = job.employer.dbaName ?? job.employer.legalName ?? 'AGCONN employer';
    await enqueueSms({
        tenantId: job.tenantId,
        userId: worker.id,
        template: 'sms.apply.confirmed',
        vars: { jobTitle: job.titleEn, employer },
        jobKey: `apply-confirm-${applicationId}`,
    });
}
