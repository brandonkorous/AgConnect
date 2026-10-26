import { enqueueSms } from '@agconn/sms';
import { dbClients } from '@agconn/db';
import { emitSystemAudit } from '../middleware/audit.js';
import type { OnboardingDraft } from './twilio-onboarding.js';

// Every call here runs inside the inbound route's runWithRlsContext({ role: 'webhook' }).
const db = () => dbClients.webhooks;

// Opt-in SMS rows belong to the system tenant (docs/00-foundation/01-multi-tenancy).
export const SYSTEM_TENANT_ID = '00000000-0000-0000-0000-000000000000';

export type OnboardTemplate =
    | 'sms.optin.welcome'
    | 'sms.onboard.ask_county'
    | 'sms.onboard.invalid_county'
    | 'sms.onboard.ask_name'
    | 'sms.onboard.ask_skills';

export async function enqueueOnboard(userId: string, template: OnboardTemplate): Promise<void> {
    await enqueueSms({
        tenantId: SYSTEM_TENANT_ID,
        userId,
        template,
        vars: {},
        jobKey: `onboard-${template}-${userId}-${Date.now()}`,
    });
}

// Twilio needs a fast 200 TwiML reply, so inbound side effects log and audit a failure instead of throwing.
export async function bestEffort(label: string, fn: () => Promise<unknown>): Promise<void> {
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

export async function handleStop(from: string): Promise<void> {
    await db().smsOptOut.upsert({
        where: { phone: from },
        create: { phone: from, source: 'STOP' },
        update: {},
    });
    await emitSystemAudit({
        action: 'system.sms.opt_out_received',
        resourceType: 'sms_opt_out',
        resourceId: from,
        metadata: { phone: from, source: 'STOP' },
    });
}

// Records consent only (consent is not onboarded) and starts SMS onboarding at the name step.
export async function confirmOptIn(userId: string): Promise<void> {
    const user = await db().user.update({
        where: { id: userId },
        data: {
            smsOptInState: 'consented',
            consentMethod: 'sms_double_opt_in',
            consentedAt: new Date(),
            smsOnboardingStep: 'await_name',
        },
    });
    await emitSystemAudit({
        action: 'system.sms.opt_in_confirmed',
        resourceType: 'user',
        resourceId: user.id,
        metadata: { phone: user.phone ?? '', userId: user.id, lang: user.preferredLang.toString() },
    });
    await enqueueSms({
        tenantId: SYSTEM_TENANT_ID,
        userId: user.id,
        template: 'sms.optin.welcome',
        vars: {},
        jobKey: `optin-welcome-${user.id}`,
    });
}

export async function setOnboarding(userId: string, step: string | null, draft: OnboardingDraft): Promise<void> {
    await db().user.update({
        where: { id: userId },
        data: { smsOnboardingStep: step, smsOnboardingDraft: draft as object },
    });
}
