import { Hono, type Context } from 'hono';
import { ok, err } from '@agconn/api-client/server';
import { validateTwilioSignature, enqueueSms, enqueueProvision } from '@agconn/sms';
import { dbClients, runWithRlsContext, SmsStatus, UserRole, type User } from '@agconn/db';
import { SYSTEM_TENANT_ID, bestEffort, confirmOptIn, handleStop } from './twilio-optin.js';
import { handleOnboardingStep } from './twilio-onboarding.js';
import { handleJobApply, sendJobsDigest } from './twilio-jobs.js';

// /status (delivery callback, ?logId=) and /inbound (inbound SMS); both need a valid X-Twilio-Signature.
// A verified request runs as app.role = 'webhook'.
const db = () => dbClients.webhooks;
const asWebhook = <T>(fn: () => Promise<T>) => runWithRlsContext({ role: 'webhook' }, fn);

// PUBLIC_API_URL matches the URL Twilio signed even behind a proxy that rewrites Host.
function publicApiUrl(c: { req: { url: string } }): string {
    const fromEnv = process.env.PUBLIC_API_URL;
    if (fromEnv) {
        const url = new URL(c.req.url);
        return new URL(`${url.pathname}${url.search}`, fromEnv).toString();
    }
    return c.req.url;
}

function mapTwilioStatus(s: string | undefined): SmsStatus | null {
    switch ((s ?? '').toLowerCase()) {
        case 'queued': return 'queued';
        case 'sending': return 'sending';
        case 'sent': return 'sent';
        case 'delivered': return 'delivered';
        case 'failed':
        case 'undelivered': return 'failed';
        default: return null;
    }
}

async function signedParams(c: Context): Promise<Record<string, string> | null> {
    const params = Object.fromEntries(new URLSearchParams(await c.req.text())) as Record<string, string>;
    const valid = validateTwilioSignature({ signature: c.req.header('x-twilio-signature'), url: publicApiUrl(c), params });
    return valid ? params : null;
}

export const twilioWebhookRoutes = new Hono();

// An empty <Response/> sends no reply; real replies go out through the sms-worker queue.
const twiml = (c: Context) => c.body('<Response/>', 200, { 'Content-Type': 'text/xml' });

twilioWebhookRoutes.post('/status', async (c) => {
    const params = await signedParams(c);
    if (!params) return err(c, 401, 'unauthenticated', 'invalid Twilio signature');
    const logId = c.req.query('logId');
    const status = mapTwilioStatus(params.MessageStatus);
    if (!logId || !status) return ok(c, { received: true });
    const now = new Date();
    await asWebhook(() => db().smsLog.update({
        where: { id: logId },
        data: {
            status,
            deliveredAt: status === 'delivered' ? now : undefined,
            failedAt: status === 'failed' ? now : undefined,
            errorCode: params.ErrorCode || undefined,
        },
    }));
    return ok(c, { received: true });
});

const STOP_KEYWORDS = new Set(['STOP', 'STOPALL', 'UNSUBSCRIBE', 'CANCEL', 'END', 'QUIT']);
// Mobile-originated double opt-in keywords (the Twilio A2P 10DLC campaign's published list).
const OPT_IN_KEYWORDS = new Set(['JOBS', 'TRABAJO', 'AGCONN', 'JOIN', 'START']);
const ES_OPT_IN_KEYWORDS = new Set(['TRABAJO']);
const CONFIRM_KEYWORDS = new Set(['YES', 'Y', 'SI', 'SÍ', 'YEP', 'YEAH', 'OK']);

twilioWebhookRoutes.post('/inbound', async (c) => {
    const params = await signedParams(c);
    if (!params) return err(c, 401, 'unauthenticated', 'invalid Twilio signature');
    const body = (params.Body ?? '').trim();
    const text = body.toUpperCase();
    const from = params.From ?? '';
    console.log('[twilio] inbound', { from: from ? from.slice(-4) : 'none', text });
    // Past the signature Twilio must always get a 200 TwiML reply (a 5xx is error 11200 and a retry storm).
    try {
        if (from) await asWebhook(() => routeInbound(from, body, text));
    } catch (e) {
        console.error('[twilio] inbound handler error (degraded to silence)', {
            from: from ? from.slice(-4) : 'none',
            err: e instanceof Error ? e.message : String(e),
        });
    }
    return twiml(c);
});

async function routeInbound(from: string, body: string, text: string): Promise<void> {
    if (STOP_KEYWORDS.has(text)) return bestEffort('stop', () => handleStop(from));
    // Looked up by phone, so a user from web signup or an earlier SMS opt-in is found either way.
    const existing = await db().user.findFirst({ where: { phone: from, role: UserRole.worker } });
    console.log('[twilio] inbound user state', { exists: !!existing, state: existing?.smsOptInState ?? 'none' });
    if (existing?.smsOptInState === 'pending_confirm') return routePending(existing, text);
    // An onboarding step in progress owns the reply, before any keyword routing.
    if (existing?.smsOnboardingStep) {
        return bestEffort('onboarding-step', () => handleOnboardingStep(existing, body, text));
    }
    const tokens = text.split(/\s+/);
    const optInToken = tokens.find((t) => OPT_IN_KEYWORDS.has(t));
    if (!existing && optInToken) {
        // sms.provision makes the Clerk user and User row off the request path; re-texting is idempotent.
        const locale = ES_OPT_IN_KEYWORDS.has(optInToken) ? 'es' : 'en';
        return bestEffort('provision', () => enqueueProvision({ phone: from, locale, keyword: optInToken }));
    }
    if (existing && optInToken) return bestEffort('jobs-digest', () => sendJobsDigest(existing));
    await routeApplyKeyword(tokens, from);
}

async function routePending(existing: User, text: string): Promise<void> {
    if (CONFIRM_KEYWORDS.has(text)) return bestEffort('confirm-optin', () => confirmOptIn(existing.id));
    await bestEffort('optin-invalid', () =>
        enqueueSms({
            tenantId: SYSTEM_TENANT_ID,
            userId: existing.id,
            template: 'sms.optin.invalid',
            vars: {},
            jobKey: `optin-invalid-${existing.id}-${Date.now()}`,
        }),
    );
}

// Workers text a job's keyword (for example APPLY-ALMD) to apply; unknown phones are dropped in handleJobApply.
async function routeApplyKeyword(tokens: string[], from: string): Promise<void> {
    for (const token of tokens) {
        if (token.length < 4 || token.length > 24) continue;
        const keyword = await db().smsKeyword.findFirst({
            where: { keyword: { equals: token, mode: 'insensitive' }, active: true },
        });
        if (!keyword || keyword.kind !== 'job_apply') continue;
        await bestEffort('job-apply', () => handleJobApply({ keyword, fromPhone: from }));
        return;
    }
}
