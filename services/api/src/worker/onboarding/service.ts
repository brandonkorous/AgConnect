// audit-required:exempt — onboarding mutations are audited at the route
// layer (worker/onboarding/routes.ts emits worker.profile.updated and
// worker.resume.uploaded); duplicating the call in service.ts would log twice.
import { createHash } from 'node:crypto';
import { County, Lang, UserRole, type Tx, type User, type WorkerProfile } from '@agconn/db';
import type { OnboardingNextStep, PatchOnboardingProfileBody } from '@agconn/schemas';

const PHONE_PEPPER = process.env.PHONE_HASH_PEPPER ?? 'dev-pepper-rotate-me';

export const hashPhone = (phoneE164: string): string =>
  createHash('sha256').update(`${phoneE164}|${PHONE_PEPPER}`).digest('hex');

export const deriveNextStep = (
  user: Pick<User, 'preferredLang'> & { onboarded: boolean },
  profile: WorkerProfile | null,
): OnboardingNextStep => {
  if (profile?.onboardedAt) return 'complete';
  if (!profile) return 'language';
  if (!profile.firstName || !profile.lastName) return 'profile_review';
  if (!profile.county) return 'county';
  if (profile.skills.length === 0) return 'skills';

  const av = profile.availability as
    | Record<string, { am?: boolean; pm?: boolean }>
    | null;
  const hasSlot = av
    ? Object.values(av).some(
        (slot) =>
          slot && typeof slot === 'object' && 'am' in slot && (slot.am || slot.pm),
      )
    : false;
  if (!hasSlot) return 'availability';

  return 'complete';
};

export type StartContext = {
  userId: string;
  phone: string | null;
  email: string | null;
  preferredLang: 'en' | 'es';
};

export async function startOnboarding(db: Tx, ctx: StartContext) {
  // Workers are platform-level (bucket 2): User.tenantId stays null.
  const existing = await db.user.findUnique({ where: { id: ctx.userId } });

  // Phone uniqueness for workers is platform-wide — the same phone can't be
  // registered to two different worker accounts.
  if (ctx.phone) {
    const collision = await db.user.findFirst({
      where: {
        role: UserRole.worker,
        phone: ctx.phone,
        NOT: { id: ctx.userId },
      },
    });
    if (collision) {
      throw new OnboardingError('phone_collision', 409);
    }
  }

  const user = await db.user.upsert({
    where: { id: ctx.userId },
    update: {
      phone: ctx.phone ?? existing?.phone ?? null,
      email: ctx.email ?? existing?.email ?? null,
      preferredLang: existing?.preferredLang ?? (ctx.preferredLang === 'en' ? Lang.en : Lang.es),
    },
    create: {
      id: ctx.userId,
      role: 'worker',
      phone: ctx.phone,
      email: ctx.email,
      preferredLang: ctx.preferredLang === 'en' ? Lang.en : Lang.es,
      onboarded: false,
    },
  });

  const profile = await db.workerProfile.findUnique({ where: { id: user.id } });

  return {
    user,
    profile,
    next_step: deriveNextStep(user, profile),
  };
}

export async function setLanguage(db: Tx, userId: string, lang: 'en' | 'es') {
  const user = await db.user.update({
    where: { id: userId },
    data: { preferredLang: lang === 'en' ? Lang.en : Lang.es },
  });
  const profile = await db.workerProfile.findUnique({ where: { id: userId } });
  return { user, profile, next_step: deriveNextStep(user, profile) };
}

export async function patchOnboardingProfile(
  db: Tx,
  userId: string,
  body: PatchOnboardingProfileBody,
) {
  const existingProfile = await db.workerProfile.findUnique({ where: { id: userId } });

  // Derive name from resume if not provided and profile not yet created.
  const firstName =
    body.firstName ??
    existingProfile?.firstName ??
    body.resume?.contact?.firstName ??
    '';
  const lastName =
    body.lastName ??
    existingProfile?.lastName ??
    body.resume?.contact?.lastName ??
    '';

  // Merge resume partial onto existing.
  const existingResumeObj =
    existingProfile?.resume && typeof existingProfile.resume === 'object' && !Array.isArray(existingProfile.resume)
      ? (existingProfile.resume as Record<string, unknown>)
      : {};
  const mergedResume =
    body.resume !== undefined
      ? deepMerge(existingResumeObj, body.resume as Record<string, unknown>)
      : existingProfile?.resume;

  const profile = await db.workerProfile.upsert({
    where: { id: userId },
    create: {
      id: userId,
      firstName,
      lastName,
      zipCode: body.zipCode ?? null,
      county: body.county ? (body.county as County) : null,
      skills: body.skills ?? [],
      availability: (body.availability as object | undefined) ?? {},
      resume: (mergedResume as object | null) ?? undefined,
    },
    update: {
      firstName: body.firstName ?? undefined,
      lastName: body.lastName ?? undefined,
      zipCode: body.zipCode ?? undefined,
      county: body.county ? (body.county as County) : undefined,
      skills: body.skills ?? undefined,
      availability: body.availability as object | undefined,
      resume: body.resume !== undefined ? (mergedResume as object) : undefined,
    },
  });

  if (body.email) {
    await db.user.update({ where: { id: userId }, data: { email: body.email } });
  }

  const user = await db.user.findUnique({ where: { id: userId } });
  if (!user) throw new OnboardingError('not_found', 404);

  return { user, profile, next_step: deriveNextStep(user, profile) };
}

export type CompleteResult =
  | { status: 'complete' }
  | { status: 'profile_incomplete'; missing: string[] };

export async function completeOnboarding(
  db: Tx,
  userId: string,
): Promise<CompleteResult> {
  const profile = await db.workerProfile.findUnique({ where: { id: userId } });
  if (!profile) {
    return { status: 'profile_incomplete', missing: ['firstName', 'lastName', 'county', 'skills', 'availability'] };
  }

  const missing: string[] = [];
  if (!profile.firstName) missing.push('firstName');
  if (!profile.lastName) missing.push('lastName');
  if (!profile.county) missing.push('county');
  if (profile.skills.length === 0) missing.push('skills');

  const av = profile.availability as Record<string, { am?: boolean; pm?: boolean }> | null;
  const hasSlot = av
    ? Object.values(av).some(
        (s) => s && typeof s === 'object' && 'am' in s && (s.am || s.pm),
      )
    : false;
  if (!hasSlot) missing.push('availability');

  if (missing.length > 0) {
    return { status: 'profile_incomplete', missing };
  }

  await db.workerProfile.update({
    where: { id: userId },
    data: { onboardedAt: new Date() },
  });
  await db.user.update({ where: { id: userId }, data: { onboarded: true } });

  return { status: 'complete' };
}

export class OnboardingError extends Error {
  constructor(
    public code: string,
    public httpStatus: number,
    message?: string,
  ) {
    super(message ?? code);
  }
}

function deepMerge(
  target: Record<string, unknown>,
  source: Record<string, unknown>,
): Record<string, unknown> {
  const out: Record<string, unknown> = { ...target };
  for (const [k, v] of Object.entries(source)) {
    if (v === undefined) continue;
    if (
      v !== null &&
      typeof v === 'object' &&
      !Array.isArray(v) &&
      target[k] &&
      typeof target[k] === 'object' &&
      !Array.isArray(target[k])
    ) {
      out[k] = deepMerge(target[k] as Record<string, unknown>, v as Record<string, unknown>);
    } else {
      out[k] = v;
    }
  }
  return out;
}
