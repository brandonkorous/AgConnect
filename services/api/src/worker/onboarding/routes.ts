import { Hono } from 'hono';
import { ok, err, validate } from '@agconn/api-client/server';
import {
  PatchOnboardingProfileBody,
  SetLanguageBody,
  WaitlistBody,
} from '@agconn/schemas';
import { Lang, runWithRlsContext } from '@agconn/db';
import { enqueueSms } from '@agconn/sms';
import { requireAuth, requireRole, type AuthVars } from '../../middleware/authContext.js';
import type { AuditCtxVars } from '../../middleware/audit.js';
import {
  OnboardingError,
  completeOnboarding,
  deriveNextStep,
  hashPhone,
  patchOnboardingProfile,
  setLanguage,
  startOnboarding,
  type SmsDraftLite,
} from './service.js';

export const onboardingRoutes = new Hono<{ Variables: AuthVars & AuditCtxVars }>();

onboardingRoutes.use('*', requireAuth('worker'));
onboardingRoutes.use('*', requireRole('worker'));

// Merged draft (SMS partial state + WorkerProfile) so the wizard prefills and skips steps SMS already answered.
onboardingRoutes.get('/draft', async (c) => {
  const userId = c.var.userId;
  const [user, profile] = await Promise.all([
    c.var.db.user.findUnique({
      where: { id: userId },
      select: { preferredLang: true, onboarded: true, smsOnboardingDraft: true },
    }),
    c.var.db.workerProfile.findUnique({ where: { id: userId } }),
  ]);
  const smsDraft = (user?.smsOnboardingDraft ?? {}) as SmsDraftLite;
  const nextStep = user
    ? deriveNextStep(user, profile, smsDraft)
    : 'language';
  return ok(c, {
    firstName: profile?.firstName || smsDraft?.firstName || null,
    lastName: profile?.lastName || smsDraft?.lastName || null,
    county: profile?.county || smsDraft?.county || null,
    skills: profile?.skills && profile.skills.length > 0 ? profile.skills : null,
    availability: profile?.availability ?? null,
    nextStep,
  });
});

onboardingRoutes.post('/start', async (c) => {
  const userId = c.var.userId;

  // Phone + email come from the User row populated by the Clerk webhook.
  const user = await c.var.db.user.findUnique({ where: { id: userId } });
  if (!user) return err(c, 403, 'forbidden', 'user_missing');

  try {
    const result = await startOnboarding(c.var.db, {
      userId,
      phone: user.phone ?? null,
      email: user.email ?? null,
      preferredLang: user.preferredLang === Lang.en ? 'en' : 'es',
    });

    if (result.user.phone) {
      await c.var.db.workerProfile.upsert({
        where: { id: userId },
        create: {
          id: userId,
          firstName: '',
          lastName: '',
          phoneHash: hashPhone(result.user.phone),
        },
        update: { phoneHash: hashPhone(result.user.phone) },
      });
    }

    return ok(c, {
      user: shapeUser(result.user),
      next_step: result.next_step,
    });
  } catch (e) {
    if (e instanceof OnboardingError) {
      return err(c, e.httpStatus as 401 | 403 | 404 | 409 | 422, 'conflict', e.code);
    }
    throw e;
  }
});

onboardingRoutes.patch('/language', validate('json', SetLanguageBody), async (c) => {
  const result = await setLanguage(c.var.db, c.var.userId, c.var.body.lang);
  return ok(c, { user: shapeUser(result.user), next_step: result.next_step });
});

onboardingRoutes.patch(
  '/profile',
  validate('json', PatchOnboardingProfileBody),
  async (c) => {
    const result = await patchOnboardingProfile(
      c.var.db,
      c.var.userId,
      c.var.body,
    );
    await c.var.audit.log({
      action: 'worker.profile.updated',
      resourceId: c.var.userId,
      metadata: { fields: Object.keys(c.var.body).join(',') },
    });
    return ok(c, {
      user: shapeUser(result.user),
      profile: shapeProfile(result.profile),
      next_step: result.next_step,
    });
  },
);

onboardingRoutes.post('/complete', async (c) => {
  const result = await completeOnboarding(c.var.db, c.var.userId);
  if (result.status === 'profile_incomplete') {
    return err(c, 422, 'validation_failed', 'profile_incomplete', {
      details: { missing: result.missing },
    });
  }
  await c.var.audit.log({
    action: 'worker.profile.updated',
    resourceId: c.var.userId,
    metadata: { fields: 'onboardedAt' },
  });

  // Welcome SMS is best-effort: a queue failure must not block onboarding completion.
  try {
    const profile = await c.var.db.workerProfile.findUnique({
      where: { id: c.var.userId },
    });
    const tenantId = c.var.tenantId;
    if (profile && tenantId) {
      await enqueueSms({
        tenantId,
        userId: c.var.userId,
        template: 'welcome',
        vars: { firstName: profile.firstName || 'there' },
      });
    }
  } catch (e) {
    console.error('[onboarding] welcome SMS enqueue failed', {
      userId: c.var.userId,
      err: e instanceof Error ? e.message : String(e),
    });
  }

  return ok(c, { status: 'complete', redirect: '/jobs' });
});

// Resume upload stub: audit it and steer the UI to manual entry until the parser pipeline owns uploads.
onboardingRoutes.post('/resume', async (c) => {
  await c.var.audit.log({
    action: 'worker.resume.uploaded',
    resourceId: c.var.userId,
    metadata: { fileBytes: 0, mimeType: 'unknown', parserVersion: 'pending' },
  });
  return ok(c, {
    status: 'parsing' as const,
    poll_url: '/v1/onboarding/resume/status',
    estimated_seconds: 12,
  });
});

onboardingRoutes.get('/resume/status', async (c) => {
  // Manual fill-in keeps onboarding usable end to end until the parser pipeline is online.
  return ok(c, {
    status: 'failed' as const,
    reason: 'parser_error' as const,
    fallback: 'manual_entry' as const,
  });
});

// Waitlist for unsupported counties, in the landing waitlist shape so the same email pipeline runs.
export const onboardingWaitlistRoute = new Hono<{ Variables: AuthVars & AuditCtxVars }>();
onboardingWaitlistRoute.use('*', requireAuth('worker'));
onboardingWaitlistRoute.post('/waitlist', validate('json', WaitlistBody), async (c) => {
  const tenantId = c.var.tenantId;
  if (!tenantId) return err(c, 403, 'no_tenant');
  const body = c.var.body;
  // Signed-in users have no waitlist policy; the row is written as the service role in the worker's tenant.
  await runWithRlsContext({ role: 'service', tenantId }, () => c.var.db.waitlist.create({
    data: {
      tenantId,
      email: body.email ?? null,
      phone: body.phone ?? null,
      county: body.county,
      preferredLang: body.preferredLang === 'en' ? Lang.en : Lang.es,
      audience: 'worker',
      source: 'landing_waitlist_form',
    },
  }));
  await c.var.audit.log({
    action: 'worker.profile.updated',
    resourceId: c.var.userId,
    metadata: { fields: 'waitlist_signup' },
  });
  return ok(c, { status: 'queued' as const });
});

function shapeUser(u: {
  id: string;
  role: string;
  preferredLang: Lang;
  onboarded: boolean;
  phone: string | null;
  email: string | null;
}) {
  return {
    id: u.id,
    role: u.role,
    preferredLang: u.preferredLang === Lang.en ? 'en' : 'es',
    onboarded: u.onboarded,
    phone: u.phone,
    email: u.email,
  };
}

function shapeProfile(p: {
  firstName: string;
  lastName: string;
  zipCode: string | null;
  county: string | null;
  skills: string[];
  availability: unknown;
  resume: unknown;
  resumeRawUrl: string | null;
  onboardedAt: Date | null;
  updatedAt: Date;
}) {
  return {
    firstName: p.firstName,
    lastName: p.lastName,
    zipCode: p.zipCode,
    county: p.county,
    skills: p.skills,
    availability: p.availability,
    resume: p.resume,
    resumeRawUrl: p.resumeRawUrl,
    onboardedAt: p.onboardedAt?.toISOString() ?? null,
    updatedAt: p.updatedAt.toISOString(),
  };
}
