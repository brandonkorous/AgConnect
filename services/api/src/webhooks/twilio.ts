import { Hono, type Context } from 'hono';
import { ok, err } from '@agconn/api-client/server';
import { validateTwilioSignature, enqueueSms, enqueueProvision } from '@agconn/sms';
import { pools, SmsStatus, AppStatus, UserRole, County } from '@agconn/db';
import { emitSystemAudit } from '../middleware/audit.js';
import type { SkillSlug } from '@agconn/schemas';
import { updateClerkUserName } from '@agconn/auth';
import { completeOnboarding } from '../worker/onboarding/service.js';

// SMS micro-onboarding (Phase 3). County numbering matches the welcome
// template (sms.optin.welcome) and the @agconn/db County enum order. Skills
// are a curated numbered subset of @agconn/schemas SKILL_SLUGS (canonical) —
// not a hand-kept second list.
const SMS_COUNTIES: readonly County[] = [
    County.Fresno,
    County.Kern,
    County.Kings,
    County.Madera,
    County.Tulare,
];
// Typed against SkillSlug so this list cannot drift from the canonical
// @agconn/schemas SKILL_SLUGS — a removed/renamed slug fails typecheck here.
const SMS_SKILLS: readonly SkillSlug[] = [
    'harvesting',
    'pruning',
    'irrigation',
    'packing',
    'planting',
    'forklift',
    'tractor_op',
    'crew_leadership',
];
// Conscious SMS-channel deviation (spec 3.3): availability defaults to fully
// available so completeOnboarding's availability check passes; the worker
// refines it on the web. Documented in 07-acceptance amendment.
const ALL_AVAILABLE = {
    mon: { am: true, pm: true },
    tue: { am: true, pm: true },
    wed: { am: true, pm: true },
    thu: { am: true, pm: true },
    fri: { am: true, pm: true },
    sat: { am: true, pm: true },
    sun: { am: true, pm: true },
} as const;

type OnboardingDraft = { county?: County; firstName?: string; lastName?: string };

async function enqueueOnboard(
    userId: string,
    template:
        | 'sms.optin.welcome'
        | 'sms.onboard.ask_county'
        | 'sms.onboard.invalid_county'
        | 'sms.onboard.ask_name'
        | 'sms.onboard.ask_skills',
): Promise<void> {
    await enqueueSms({
        tenantId: SYSTEM_TENANT_ID,
        userId,
        template,
        vars: {},
        jobKey: `onboard-${template}-${userId}-${Date.now()}`,
    });
}

// Platform-level operations (workers, opt-in flow) live under this tenant
// per docs/00-foundation/01-multi-tenancy. SMS log rows for opt-in must
// reference a real tenant; the system tenant is the right home for them.
const SYSTEM_TENANT_ID = '00000000-0000-0000-0000-000000000000';

// The inbound webhook's contract with Twilio is a fast TwiML response. A
// pg-boss enqueue (or a cold boss boot on the first provision) must never
// turn into a non-2xx or a >15s response — Twilio surfaces error 11200 and
// the queued work never runs. So every inbound side effect is best-effort:
// on failure we log + audit and the caller still returns <Response/>.
// Provisioning and opt-in are idempotent (singleton keys / step state), so a
// re-text recovers cleanly. Mirrors the "catch keeps the API responsive"
// pattern every other pg-boss producer uses.
async function bestEffort(label: string, fn: () => Promise<unknown>): Promise<void> {
    try {
        await fn();
    } catch (e) {
        console.error('[twilio] inbound side-effect failed (non-fatal)', {
            label,
            err: e instanceof Error ? e.message : String(e),
        });
        await emitSystemAudit({
            action: 'system.sms.dropped',
            resourceType: 'sms_inbound',
            resourceId: label,
            metadata: { reason: 'inbound_side_effect_failed', label },
        }).catch(() => {});
    }
}

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

    const body = (params.Body ?? '').trim();
    const text = body.toUpperCase();
    const from = params.From ?? '';

    console.log('[twilio] inbound', { from: from ? from.slice(-4) : 'none', text });

    // Outer safety net: past signature validation, Twilio must ALWAYS get a
    // 200 TwiML response (never a 5xx / >15s — that is error 11200, and it
    // also makes Twilio retry-storm). Routing decisions stay below; any
    // unexpected throw (DB read, cold pg-boss boot) degrades to silence here
    // rather than a failed webhook. Individual side effects are additionally
    // wrapped in bestEffort so the failure is logged + audited with context.
    try {
        if (!from) return twiml(c);

        // 1. STOP keywords — always wins, even on a pending stub.
        if (STOP_KEYWORDS.has(text)) {
            await bestEffort('stop', () => handleStop(from));
            return twiml(c);
        }

        // 2. Pending stub awaiting confirmation — YES advances; anything else
        //    re-prompts. We look up by phone so this works whether the
        //    existing user came from web signup or a prior SMS opt-in.
        const existing = await pools.webhooks.user.findFirst({
            where: { phone: from, role: UserRole.worker },
        });

        console.log('[twilio] inbound user state', { exists: !!existing, state: existing?.smsOptInState ?? 'none' });

        if (existing?.smsOptInState === 'pending_confirm') {
            if (CONFIRM_KEYWORDS.has(text)) {
                await bestEffort('confirm-optin', () => confirmOptIn(existing.id));
                return twiml(c);
            }
            await bestEffort('optin-invalid', () =>
                enqueueSms({
                    tenantId: SYSTEM_TENANT_ID,
                    userId: existing.id,
                    template: 'sms.optin.invalid',
                    vars: {},
                    jobKey: `optin-invalid-${existing.id}-${Date.now()}`,
                }),
            );
            return twiml(c);
        }

        // 2b. SMS micro-onboarding in progress — the active step owns the
        //     reply, resolved BEFORE keyword routing. A consented worker
        //     mid-flow who texts anything (including JOBS) is advanced or
        //     re-prompted, never met with silence. STOP handled above.
        if (existing?.smsOnboardingStep) {
            await bestEffort('onboarding-step', () => handleOnboardingStep(existing, body, text));
            return twiml(c);
        }

        const tokens = text.split(/\s+/);

        // 3. New opt-in via published keyword. Only for unknown phones —
        //    known workers texting JOBS again don't get re-onboarded.
        if (!existing) {
            const optInToken = tokens.find((t) => OPT_IN_KEYWORDS.has(t));
            if (optInToken) {
                // Identity keystone: hand off to sms.provision off the
                // request path (Twilio fast-response). The consumer ensures a
                // real Clerk user for this phone, upserts the User row, emits
                // the opt_in_pending audit, and enqueues the confirm SMS. No
                // sms_* id is ever minted, so the sms<->clerk merge problem
                // cannot occur. bestEffort guarantees a cold pg-boss boot or
                // enqueue failure cannot 11200 the webhook — the re-text is
                // idempotent (singletonKey provision-<phone>). See
                // docs/00-foundation/13-onboarding-identity-remediation/.
                const locale = ES_OPT_IN_KEYWORDS.has(optInToken) ? 'es' : 'en';
                await bestEffort('provision', () =>
                    enqueueProvision({ phone: from, locale, keyword: optInToken }),
                );
                return twiml(c);
            }
        }

        // 4. Consented, onboarded worker re-texting an opt-in keyword → a
        //    real matched-jobs digest instead of the old silent <Response/>.
        if (existing && tokens.some((t) => OPT_IN_KEYWORDS.has(t))) {
            await bestEffort('jobs-digest', () => sendJobsDigest(existing));
            return twiml(c);
        }

        // 5. SMS-apply keyword routing — workers text APPLY-ALMD (or whatever
        //    the job's keyword is) to apply. Only for already-consented
        //    workers; handleJobApply itself drops on unknown phone.
        for (const token of tokens) {
            if (token.length < 4 || token.length > 24) continue;
            const keyword = await pools.webhooks.smsKeyword.findFirst({
                where: { keyword: { equals: token, mode: 'insensitive' }, active: true },
            });
            if (!keyword || keyword.kind !== 'job_apply') continue;

            await bestEffort('job-apply', () => handleJobApply({ keyword, fromPhone: from }));
            return twiml(c);
        }

        return twiml(c);
    } catch (e) {
        // DB read or other unexpected failure — never fail the webhook.
        console.error('[twilio] inbound handler error (degraded to silence)', {
            from: from ? from.slice(-4) : 'none',
            err: e instanceof Error ? e.message : String(e),
        });
        return twiml(c);
    }
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
                // Enter SMS micro-onboarding. The welcome SMS enqueued below
                // (sms.optin.welcome) asks for the worker's NAME first (the
                // highest-value field, captured before drop-off), so the
                // first step is await_name. Phase 3: name -> county -> skills.
                smsOnboardingStep: 'await_name',
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

async function setOnboarding(
    userId: string,
    step: string | null,
    draft: OnboardingDraft,
): Promise<void> {
    await pools.webhooks.$transaction(async (tx) => {
        await tx.$executeRawUnsafe(`SET LOCAL app.role = 'webhook'`);
        await tx.user.update({
            where: { id: userId },
            data: { smsOnboardingStep: step, smsOnboardingDraft: draft as object },
        });
    });
}

async function completeSmsOnboarding(
    userId: string,
    draft: OnboardingDraft,
    skills: string[],
): Promise<void> {
    if (!draft.county || !draft.firstName || !draft.lastName) {
        // Safety net (each step validates, so this is a should-not-happen).
        // Restart from the top of the flow — name first — rather than
        // stranding the worker mid-state.
        await setOnboarding(userId, 'await_name', {});
        await enqueueOnboard(userId, 'sms.onboard.ask_name');
        return;
    }
    const result = await pools.webhooks.$transaction(async (tx) => {
        await tx.$executeRawUnsafe(`SET LOCAL app.role = 'webhook'`);
        const profileData = {
            firstName: draft.firstName as string,
            lastName: draft.lastName as string,
            county: draft.county as County,
            skills,
            availability: ALL_AVAILABLE as object,
        };
        await tx.workerProfile.upsert({
            where: { id: userId },
            create: { id: userId, ...profileData },
            update: profileData,
        });
        // Reuse the Phase 2 finalize: validates the profile, sets
        // WorkerProfile.onboardedAt + User.onboarded=true. ALL_AVAILABLE
        // satisfies its availability check (the conscious SMS deviation).
        const r = await completeOnboarding(tx, userId);
        await tx.user.update({
            where: { id: userId },
            data: { smsOnboardingStep: null, smsOnboardingDraft: {} },
        });
        return r;
    });
    await emitSystemAudit({
        action: 'system.sms.opt_in_confirmed',
        resourceType: 'user',
        resourceId: userId,
        metadata: {
            phase: 'sms_onboarding_complete',
            county: String(draft.county),
            status: result.status,
        },
    });

    // Sync the captured name onto the Clerk user. ensureClerkUserByPhone
    // created it nameless; without this every SMS-onboarded worker stays
    // nameless in Clerk (admin directory, support tooling, future web login).
    // Best-effort and post-commit: a Clerk hiccup must not fail onboarding —
    // WorkerProfile is the hiring source of truth, Clerk is the mirror. The
    // userId IS the Clerk user_* id (identity keystone).
    try {
        await updateClerkUserName(userId, {
            firstName: draft.firstName,
            lastName: draft.lastName,
        });
    } catch (e) {
        console.error('[twilio] clerk name sync failed (non-fatal)', {
            userIdTail: userId.slice(-6),
            err: e instanceof Error ? e.message : String(e),
        });
        await emitSystemAudit({
            action: 'system.sms.dropped',
            resourceType: 'user',
            resourceId: userId,
            metadata: { reason: 'clerk_name_sync_failed', phase: 'sms_onboarding_complete' },
        }).catch(() => {});
    }

    await enqueueSms({
        tenantId: SYSTEM_TENANT_ID,
        userId,
        template: 'sms.onboard.done',
        vars: { firstName: draft.firstName, county: String(draft.county) },
        jobKey: `onboard-done-${userId}`,
    });
}

async function handleOnboardingStep(
    user: {
        id: string;
        smsOnboardingStep: string | null;
        smsOnboardingDraft: unknown;
    },
    body: string,
    text: string,
): Promise<void> {
    const step = user.smsOnboardingStep;
    const draft: OnboardingDraft = (user.smsOnboardingDraft as OnboardingDraft) ?? {};

    if (step === 'await_name') {
        // Require a usable first AND last name — never store a half-name or
        // junk (an employer won't hire "Brandon Brandon" or "asdf"). One
        // token, digits/symbols only, or empty all re-prompt; we never fall
        // back lastName=firstName. Lenient on accents/hyphens/apostrophes
        // (Spanish names) via the Unicode letter class.
        const cleaned = body.trim().replace(/\s+/g, ' ');
        const parts = cleaned ? cleaned.split(' ') : [];
        const first = parts[0] ?? '';
        const last = parts.slice(1).join(' ');
        const hasLetter = (s: string): boolean => /\p{L}/u.test(s);
        if (parts.length < 2 || !hasLetter(first) || !hasLetter(last)) {
            await enqueueOnboard(user.id, 'sms.onboard.ask_name');
            return;
        }
        draft.firstName = first.slice(0, 60);
        draft.lastName = last.slice(0, 60);
        await setOnboarding(user.id, 'await_county', draft);
        await enqueueOnboard(user.id, 'sms.onboard.ask_county');
        return;
    }
    if (step === 'await_county') {
        const m = text.match(/^([1-5])$/);
        const idx = m
            ? Number(m[1]) - 1
            : SMS_COUNTIES.findIndex((c) => String(c).toUpperCase() === text);
        if (idx < 0) {
            await enqueueOnboard(user.id, 'sms.onboard.invalid_county');
            return;
        }
        draft.county = SMS_COUNTIES[idx];
        await setOnboarding(user.id, 'await_skills', draft);
        await enqueueOnboard(user.id, 'sms.onboard.ask_skills');
        return;
    }
    if (step === 'await_skills') {
        const picked = Array.from(
            new Set((text.match(/[1-8]/g) ?? []).map(Number)),
        ).filter((n) => n >= 1 && n <= SMS_SKILLS.length);
        if (picked.length === 0) {
            await enqueueOnboard(user.id, 'sms.onboard.ask_skills');
            return;
        }
        const skills = picked.map((n) => SMS_SKILLS[n - 1] as string);
        await completeSmsOnboarding(user.id, draft, skills);
        return;
    }
    // Unknown step — clear so the worker isn't stuck.
    await setOnboarding(user.id, null, {});
}

async function sendJobsDigest(user: {
    id: string;
    preferredLang: unknown;
}): Promise<void> {
    const profile = await pools.webhooks.workerProfile.findUnique({
        where: { id: user.id },
        select: { county: true },
    });
    const lang = String(user.preferredLang) === 'en' ? 'en' : 'es';

    if (!profile?.county) {
        // Consented but not matchable — re-enter onboarding from the top
        // (welcome asks name first now), never silence.
        await setOnboarding(user.id, 'await_name', {});
        await enqueueSms({
            tenantId: SYSTEM_TENANT_ID,
            userId: user.id,
            template: 'sms.optin.welcome',
            vars: {},
            jobKey: `onboard-welcome-${user.id}-${Date.now()}`,
        });
        return;
    }

    const jobs = await pools.webhooks.jobPosting.findMany({
        where: { county: profile.county, status: 'active', deletedAt: null },
        orderBy: { publishedAt: 'desc' },
        take: 3,
        select: {
            id: true,
            titleEn: true,
            titleEs: true,
            wageMin: true,
            wageMax: true,
            smsApplyKeyword: true,
        },
    });

    if (jobs.length === 0) {
        await enqueueSms({
            tenantId: SYSTEM_TENANT_ID,
            userId: user.id,
            template: 'sms.jobs.none',
            vars: { county: String(profile.county) },
            jobKey: `jobs-none-${user.id}-${Date.now()}`,
        });
        return;
    }

    const list = jobs
        .map((j) => {
            const title = lang === 'en' ? j.titleEn : j.titleEs;
            const code = j.smsApplyKeyword ?? `JOB-${j.id.slice(0, 4)}`;
            return `${title} $${Number(j.wageMin)}-${Number(j.wageMax)}/hr — ${code}`;
        })
        .join('\n');

    await enqueueSms({
        tenantId: SYSTEM_TENANT_ID,
        userId: user.id,
        template: 'sms.jobs.digest',
        vars: { list },
        jobKey: `jobs-digest-${user.id}-${Date.now()}`,
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
