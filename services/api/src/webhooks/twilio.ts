import { Hono, type Context } from 'hono';
import { ok, err } from '@agconn/api-client/server';
import { validateTwilioSignature, enqueueSms, enqueueProvision } from '@agconn/sms';
import { pools, SmsStatus, AppStatus, UserRole } from '@agconn/db';
import { emitSystemAudit } from '../middleware/audit.js';

// Platform-level operations (workers, opt-in flow) live under this tenant
// per docs/00-foundation/01-multi-tenancy. SMS log rows for opt-in must
// reference a real tenant; the system tenant is the right home for them.
const SYSTEM_TENANT_ID = '00000000-0000-0000-0000-000000000000';

// Twilio webhook contracts:
//   /v1/webhooks/twilio/status   — message status callback. Body is form-encoded;
//                                  query string (?logId=...) carries our row id.
//   /v1/webhooks/twilio/inbound  — inbound SMS (STOP keyword handler only).
//
// Both URLs are unauthenticated but require a valid X-Twilio-Signature header
// computed from the public URL + form params. Without TWILIO_AUTH_TOKEN, every
// request 401s.

function publicApiUrl(c: { req: { url: string } }): string {
    // Prefer PUBLIC_API_URL when set so we match what Twilio used to compute the
    // signature, even when the API is behind a proxy that rewrites Host. Fall
    // back to the request URL in dev.
    const fromEnv = process.env.PUBLIC_API_URL;
    if (fromEnv) {
        const url = new URL(c.req.url);
        return new URL(`${url.pathname}${url.search}`, fromEnv).toString();
    }
    return c.req.url;
}

function mapTwilioStatus(s: string | undefined): SmsStatus | null {
    switch ((s ?? '').toLowerCase()) {
        case 'queued':
            return 'queued';
        case 'sending':
            return 'sending';
        case 'sent':
            return 'sent';
        case 'delivered':
            return 'delivered';
        case 'failed':
        case 'undelivered':
            return 'failed';
        default:
            return null;
    }
}

export const twilioWebhookRoutes = new Hono();

// Twilio inbound SMS webhooks require a TwiML response (text/xml). An empty
// <Response/> tells Twilio not to send any reply — actual replies go out via
// the sms-worker queue.
const twiml = (c: Context) => c.body('<Response/>', 200, { 'Content-Type': 'text/xml' });

twilioWebhookRoutes.post('/status', async (c) => {
    const params = Object.fromEntries(new URLSearchParams(await c.req.text())) as Record<string, string>;
    const valid = validateTwilioSignature({
        signature: c.req.header('x-twilio-signature'),
        url: publicApiUrl(c),
        params,
    });
    if (!valid) {
        return err(c, 401, 'unauthenticated', 'invalid Twilio signature');
    }

    const logId = c.req.query('logId');
    const status = mapTwilioStatus(params.MessageStatus);
    if (!logId || !status) {
        return ok(c, { received: true });
    }

    const now = new Date();
    await pools.webhooks.$transaction(async (tx) => {
        await tx.$executeRawUnsafe(`SET LOCAL app.role = 'webhook'`);
        await tx.smsLog.update({
            where: { id: logId },
            data: {
                status,
                deliveredAt: status === 'delivered' ? now : undefined,
                failedAt: status === 'failed' ? now : undefined,
                errorCode: params.ErrorCode || undefined,
            },
        });
    });

    return ok(c, { received: true });
});

const STOP_KEYWORDS = new Set(['STOP', 'STOPALL', 'UNSUBSCRIBE', 'CANCEL', 'END', 'QUIT']);

// Mobile-originated double opt-in. Worker texts one of these from a flyer
// or the worker landing page; we reply with sms.optin.confirm; they reply
// YES (or SI/SÍ/Y) and become consented. See the Twilio A2P 10DLC
// campaign description for the published list.
const OPT_IN_KEYWORDS = new Set(['JOBS', 'TRABAJO', 'AGCONN', 'JOIN', 'START']);
const ES_OPT_IN_KEYWORDS = new Set(['TRABAJO']);
const CONFIRM_KEYWORDS = new Set(['YES', 'Y', 'SI', 'SÍ', 'YEP', 'YEAH', 'OK']);

twilioWebhookRoutes.post('/inbound', async (c) => {
    const params = Object.fromEntries(new URLSearchParams(await c.req.text())) as Record<string, string>;
    const valid = validateTwilioSignature({
        signature: c.req.header('x-twilio-signature'),
        url: publicApiUrl(c),
        params,
    });
    if (!valid) {
        return err(c, 401, 'unauthenticated', 'invalid Twilio signature');
    }

    const text = (params.Body ?? '').trim().toUpperCase();
    const from = params.From ?? '';

    console.log('[twilio] inbound', { from: from ? from.slice(-4) : 'none', text });

    // 1. STOP keywords — always wins, even on a pending stub.
    if (from && STOP_KEYWORDS.has(text)) {
        await handleStop(from);
        return twiml(c);
    }

    if (!from) return twiml(c);

    // 2. Pending stub awaiting confirmation — YES advances; anything else
    //    re-prompts. We look up by phone so this works whether the existing
    //    user came from web signup or a prior SMS opt-in.
    const existing = await pools.webhooks.user.findFirst({
        where: { phone: from, role: UserRole.worker },
    });

    console.log('[twilio] inbound user state', { exists: !!existing, state: existing?.smsOptInState ?? 'none' });

    if (existing?.smsOptInState === 'pending_confirm') {
        if (CONFIRM_KEYWORDS.has(text)) {
            await confirmOptIn(existing.id);
            return twiml(c);
        }
        await enqueueSms({
            tenantId: SYSTEM_TENANT_ID,
            userId: existing.id,
            template: 'sms.optin.invalid',
            vars: {},
            jobKey: `optin-invalid-${existing.id}-${Date.now()}`,
        });
        return twiml(c);
    }

    const tokens = text.split(/\s+/);

    // 3. New opt-in via published keyword. Only for unknown phones — known
    //    workers texting JOBS again don't get re-onboarded.
    if (!existing) {
        const optInToken = tokens.find((t) => OPT_IN_KEYWORDS.has(t));
        if (optInToken) {
            // Identity keystone: hand off to sms.provision off the request
            // path (Twilio fast-response). The consumer ensures a real Clerk
            // user for this phone, upserts the User row, emits the
            // opt_in_pending audit (with the real user id), and enqueues the
            // confirm SMS. No sms_* id is ever minted, so the sms<->clerk
            // merge problem cannot occur. See
            // docs/00-foundation/13-onboarding-identity-remediation/.
            const locale = ES_OPT_IN_KEYWORDS.has(optInToken) ? 'es' : 'en';
            await enqueueProvision({ phone: from, locale, keyword: optInToken });
            return twiml(c);
        }
    }

    // 4. SMS-apply keyword routing — workers text APPLY-ALMD (or whatever
    //    the job's keyword is) to apply. Only for already-consented workers;
    //    handleJobApply itself drops on unknown phone.
    for (const token of tokens) {
        if (token.length < 4 || token.length > 24) continue;
        const keyword = await pools.webhooks.smsKeyword.findFirst({
            where: { keyword: { equals: token, mode: 'insensitive' }, active: true },
        });
        if (!keyword || keyword.kind !== 'job_apply') continue;

        await handleJobApply({ keyword, fromPhone: from });
        return twiml(c);
    }

    return twiml(c);
});

async function handleStop(from: string): Promise<void> {
    await pools.webhooks.$transaction(async (tx) => {
        await tx.$executeRawUnsafe(`SET LOCAL app.role = 'webhook'`);
        await tx.smsOptOut.upsert({
            where: { phone: from },
            create: { phone: from, source: 'STOP' },
            update: {},
        });
    });
    await emitSystemAudit({
        action: 'system.sms.opt_out_received',
        resourceType: 'sms_opt_out',
        resourceId: from,
        metadata: { phone: from, source: 'STOP' },
    });
}

async function confirmOptIn(userId: string): Promise<void> {
    const now = new Date();
    const user = await pools.webhooks.$transaction(async (tx) => {
        await tx.$executeRawUnsafe(`SET LOCAL app.role = 'webhook'`);
        // INVARIANT consent != onboarded: confirming opt-in records consent
        // (permission to message) only. `onboarded` means profile complete
        // enough to match/hire and is set by the onboarding flow (Phase 2/3),
        // never here. See docs/00-foundation/13-onboarding-identity-remediation/.
        return tx.user.update({
            where: { id: userId },
            data: {
                smsOptInState: 'consented',
                consentMethod: 'sms_double_opt_in',
                consentedAt: now,
            },
        });
    });

    await emitSystemAudit({
        action: 'system.sms.opt_in_confirmed',
        resourceType: 'user',
        resourceId: user.id,
        metadata: {
            phone: user.phone ?? '',
            userId: user.id,
            lang: user.preferredLang.toString(),
        },
    });

    await enqueueSms({
        tenantId: SYSTEM_TENANT_ID,
        userId: user.id,
        template: 'sms.optin.welcome',
        vars: {},
        jobKey: `optin-welcome-${user.id}`,
    });
}

async function handleJobApply(args: {
    keyword: { id: string; tenantId: string; keyword: string; entityId: string };
    fromPhone: string;
}): Promise<void> {
    const { keyword, fromPhone } = args;
    if (!fromPhone) return;

    const job = await pools.webhooks.jobPosting.findFirst({
        where: { id: keyword.entityId, deletedAt: null, status: 'active' },
        include: {
            employer: { select: { legalName: true, dbaName: true } },
        },
    });
    if (!job) return;

    // Resolve worker by phone. If unknown, send a "we couldn't find your
    // account" reply — onboarding flow handles registration separately.
    const worker = await pools.webhooks.user.findFirst({
        where: { phone: fromPhone, role: 'worker', deletedAt: null },
    });
    if (!worker) {
        console.warn('[twilio] sms-apply: unknown phone, dropped', { toPhone: fromPhone, keyword: keyword.keyword });
        await emitSystemAudit({
            action: 'system.sms.dropped',
            resourceType: 'sms_keyword',
            resourceId: keyword.id,
            metadata: { template: 'sms.apply.unknown_phone', reason: 'unknown_worker', toPhone: fromPhone },
        });
        return;
    }

    // Idempotent: skip if this worker already applied to this job.
    const existing = await pools.webhooks.application.findFirst({
        where: { jobId: job.id, workerId: worker.id },
    });

    let applicationId = existing?.id;
    if (!existing) {
        const created = await pools.webhooks.application.create({
            data: {
                tenantId: job.tenantId,
                jobId: job.id,
                workerId: worker.id,
                status: AppStatus.applied,
                countyAtApply: job.county,
                skillsAtApply: [],
            },
        });
        applicationId = created.id;
    }

    // Bump keyword usage so the employer can see SMS-apply traffic.
    await pools.webhooks.smsKeyword.update({
        where: { id: keyword.id },
        data: { lastUsedAt: new Date() },
    });

    const employer =
        job.employer.dbaName ??
        job.employer.legalName ??
        'AGCONN employer';
    await enqueueSms({
        tenantId: job.tenantId,
        userId: worker.id,
        template: 'sms.apply.confirmed',
        vars: { jobTitle: job.titleEn, employer },
        jobKey: `apply-confirm-${applicationId}`,
    });
}
