import { enqueueSms } from '@agconn/sms';
import { dbClients, County } from '@agconn/db';
import type { SkillSlug } from '@agconn/schemas';
import { updateClerkUserName } from '@agconn/auth';
import { emitSystemAudit } from '../middleware/audit.js';
import { completeOnboarding } from '../worker/onboarding/service.js';
import { SYSTEM_TENANT_ID, enqueueOnboard, setOnboarding } from './twilio-optin.js';

// SMS micro-onboarding: name, then county, then skills. Runs as app.role = 'webhook'.
// County numbering matches sms.optin.welcome and the County enum order.
const SMS_COUNTIES: readonly County[] = [County.Fresno, County.Kern, County.Kings, County.Madera, County.Tulare];
// Typed against SkillSlug so a renamed canonical slug fails typecheck here.
const SMS_SKILLS: readonly SkillSlug[] = [
    'harvesting', 'pruning', 'irrigation', 'packing', 'planting', 'forklift', 'tractor_op', 'crew_leadership',
];
// SMS-channel deviation (spec 3.3): fully available, so completeOnboarding's availability check passes.
const DAY = { am: true, pm: true };
const ALL_AVAILABLE = { mon: DAY, tue: DAY, wed: DAY, thu: DAY, fri: DAY, sat: DAY, sun: DAY } as const;

export type OnboardingDraft = { county?: County; firstName?: string; lastName?: string };
type StepUser = { id: string; smsOnboardingStep: string | null; smsOnboardingDraft: unknown };

export async function handleOnboardingStep(user: StepUser, body: string, text: string): Promise<void> {
    const draft: OnboardingDraft = (user.smsOnboardingDraft as OnboardingDraft) ?? {};
    if (user.smsOnboardingStep === 'await_name') return takeName(user.id, draft, body);
    if (user.smsOnboardingStep === 'await_county') return takeCounty(user.id, draft, text);
    if (user.smsOnboardingStep === 'await_skills') return takeSkills(user.id, draft, text);
    // Unknown step: clear it so the worker is not stuck.
    await setOnboarding(user.id, null, {});
}

// A usable first AND last name, letters in each (accents allowed); anything else re-prompts.
async function takeName(userId: string, draft: OnboardingDraft, body: string): Promise<void> {
    const cleaned = body.trim().replace(/\s+/g, ' ');
    const parts = cleaned ? cleaned.split(' ') : [];
    const first = parts[0] ?? '';
    const last = parts.slice(1).join(' ');
    const hasLetter = (s: string): boolean => /\p{L}/u.test(s);
    if (parts.length < 2 || !hasLetter(first) || !hasLetter(last)) {
        await enqueueOnboard(userId, 'sms.onboard.ask_name');
        return;
    }
    draft.firstName = first.slice(0, 60);
    draft.lastName = last.slice(0, 60);
    await setOnboarding(userId, 'await_county', draft);
    await enqueueOnboard(userId, 'sms.onboard.ask_county');
}

async function takeCounty(userId: string, draft: OnboardingDraft, text: string): Promise<void> {
    const m = text.match(/^([1-5])$/);
    const idx = m ? Number(m[1]) - 1 : SMS_COUNTIES.findIndex((c) => String(c).toUpperCase() === text);
    if (idx < 0) {
        await enqueueOnboard(userId, 'sms.onboard.invalid_county');
        return;
    }
    draft.county = SMS_COUNTIES[idx];
    await setOnboarding(userId, 'await_skills', draft);
    await enqueueOnboard(userId, 'sms.onboard.ask_skills');
}

async function takeSkills(userId: string, draft: OnboardingDraft, text: string): Promise<void> {
    const picked = Array.from(new Set((text.match(/[1-8]/g) ?? []).map(Number)))
        .filter((n) => n >= 1 && n <= SMS_SKILLS.length);
    if (picked.length === 0) {
        await enqueueOnboard(userId, 'sms.onboard.ask_skills');
        return;
    }
    await completeSmsOnboarding(userId, draft, picked.map((n) => SMS_SKILLS[n - 1] as string));
}

async function completeSmsOnboarding(userId: string, draft: OnboardingDraft, skills: string[]): Promise<void> {
    if (!draft.county || !draft.firstName || !draft.lastName) {
        // Should not happen (each step validates); restart at the name step rather than strand the worker.
        await setOnboarding(userId, 'await_name', {});
        await enqueueOnboard(userId, 'sms.onboard.ask_name');
        return;
    }
    const result = await saveSmsProfile(userId, draft, skills);
    await emitSystemAudit({
        action: 'system.sms.opt_in_confirmed',
        resourceType: 'user',
        resourceId: userId,
        metadata: { phase: 'sms_onboarding_complete', county: String(draft.county), status: result.status },
    });
    await syncClerkName(userId, draft.firstName, draft.lastName);
    await enqueueSms({
        tenantId: SYSTEM_TENANT_ID,
        userId,
        template: 'sms.onboard.done',
        vars: { firstName: draft.firstName, county: String(draft.county) },
        jobKey: `onboard-done-${userId}`,
    });
}

// Writes the profile, then reuses the web finalize (sets onboardedAt and users.onboarded).
function saveSmsProfile(userId: string, draft: OnboardingDraft, skills: string[]) {
    return dbClients.webhooks.$transaction(async (tx) => {
        const profileData = {
            firstName: draft.firstName as string,
            lastName: draft.lastName as string,
            county: draft.county as County,
            skills,
            availability: ALL_AVAILABLE as object,
        };
        await tx.workerProfile.upsert({ where: { id: userId }, create: { id: userId, ...profileData }, update: profileData });
        const r = await completeOnboarding(tx, userId);
        await tx.user.update({ where: { id: userId }, data: { smsOnboardingStep: null, smsOnboardingDraft: {} } });
        return r;
    });
}

// Clerk mirrors the name; a Clerk failure must not fail onboarding (WorkerProfile is the source of truth).
async function syncClerkName(userId: string, firstName: string, lastName: string): Promise<void> {
    try {
        await updateClerkUserName(userId, { firstName, lastName });
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
}
