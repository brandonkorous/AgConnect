import { Hono } from 'hono';
import { ok, err, validate } from '@agconn/api-client/server';
import { County, Lang } from '@agconn/db';
import { PatchProfileBody } from '@agconn/schemas';
import { requireAuth, requireRole, type AuthVars } from '../../middleware/authContext';
import type { AuditCtxVars } from '../../middleware/audit';

export const profileRoutes = new Hono<{ Variables: AuthVars & AuditCtxVars }>();

profileRoutes.use('*', requireAuth);
profileRoutes.use('*', requireRole('worker'));

profileRoutes.get('/', async (c) => {
  const userId = c.var.userId;
  const user = await c.var.db.user.findUnique({ where: { id: userId } });
  if (!user) return err(c, 404, 'not_found');
  const profile = await c.var.db.workerProfile.findUnique({ where: { id: userId } });
  if (!profile) return err(c, 403, 'forbidden', 'not_onboarded');
  return ok(c, { user: shapeUser(user), workerProfile: shapeProfile(profile) });
});

profileRoutes.patch('/', validate('json', PatchProfileBody), async (c) => {
  const userId = c.var.userId;
  const tenantId = c.var.tenantId;
  if (!tenantId) return err(c, 403, 'no_tenant');
  const body = c.var.body;

  const existing = await c.var.db.workerProfile.findUnique({ where: { id: userId } });
  if (!existing) return err(c, 403, 'forbidden', 'not_onboarded');

  if (
    body.expectedUpdatedAt &&
    new Date(body.expectedUpdatedAt).getTime() !== existing.updatedAt.getTime()
  ) {
    return err(c, 409, 'conflict', 'profile_conflict');
  }

  const mergedResume =
    body.resume !== undefined
      ? deepMerge(
          (existing.resume as Record<string, unknown> | null) ?? {},
          body.resume as Record<string, unknown>,
        )
      : undefined;

  const profile = await c.var.db.workerProfile.update({
    where: { id: userId },
    data: {
      firstName: body.firstName ?? undefined,
      lastName: body.lastName ?? undefined,
      zipCode: body.zipCode === null ? null : body.zipCode ?? undefined,
      county: body.county ? (body.county as County) : undefined,
      skills: body.skills ?? undefined,
      availability: body.availability as object | undefined,
      resume: mergedResume as object | undefined,
    },
  });

  if (body.email !== undefined) {
    await c.var.db.user.update({
      where: { id: userId },
      data: { email: body.email },
    });
  }

  await c.var.audit.log({
    action: 'worker.profile.updated',
    resourceId: userId,
    metadata: { fields: Object.keys(body).join(',') },
  });

  const user = await c.var.db.user.findUnique({ where: { id: userId } });
  return ok(c, {
    user: user ? shapeUser(user) : null,
    workerProfile: shapeProfile(profile),
  });
});

const SECTIONS = ['experience', 'education', 'certifications'] as const;
type Section = (typeof SECTIONS)[number];

for (const section of SECTIONS) {
  profileRoutes.post(`/resume/${section}`, async (c) => {
    const userId = c.var.userId;
    const body = (await c.req.json().catch(() => null)) as Record<string, unknown> | null;
    if (!body || typeof body !== 'object') return err(c, 422, 'validation_failed');
    const existing = await c.var.db.workerProfile.findUnique({ where: { id: userId } });
    if (!existing) return err(c, 403, 'forbidden', 'not_onboarded');
    const resume = (existing.resume as Record<string, unknown> | null) ?? {};
    const arr = Array.isArray(resume[section]) ? (resume[section] as unknown[]) : [];
    arr.push(body);
    resume[section] = arr;
    await c.var.db.workerProfile.update({
      where: { id: userId },
      data: { resume: resume as object },
    });
    await c.var.audit.log({
      action: 'worker.profile.updated',
      resourceId: userId,
      metadata: { fields: `resume.${section}.add` },
    });
    return ok(c, { index: arr.length - 1 });
  });

  profileRoutes.delete(`/resume/${section}/:index`, async (c) => {
    const userId = c.var.userId;
    const idx = Number(c.req.param('index'));
    if (!Number.isInteger(idx) || idx < 0) return err(c, 422, 'validation_failed');
    const existing = await c.var.db.workerProfile.findUnique({ where: { id: userId } });
    if (!existing) return err(c, 403, 'forbidden', 'not_onboarded');
    const resume = (existing.resume as Record<string, unknown> | null) ?? {};
    const arr = Array.isArray(resume[section]) ? (resume[section] as unknown[]) : [];
    if (idx >= arr.length) return err(c, 404, 'not_found', 'index_out_of_range');
    arr.splice(idx, 1);
    resume[section] = arr;
    await c.var.db.workerProfile.update({
      where: { id: userId },
      data: { resume: resume as object },
    });
    await c.var.audit.log({
      action: 'worker.profile.updated',
      resourceId: userId,
      metadata: { fields: `resume.${section}.remove` },
    });
    return ok(c, { ok: true });
  });
}

profileRoutes.get('/preview-as-employer', async (c) => {
  const userId = c.var.userId;
  const profile = await c.var.db.workerProfile.findUnique({ where: { id: userId } });
  if (!profile) return err(c, 403, 'forbidden', 'not_onboarded');

  const resume = (profile.resume as Record<string, unknown> | null) ?? null;
  return ok(c, {
    firstName: profile.firstName,
    lastNameInitial: profile.lastName ? `${profile.lastName.charAt(0)}.` : '',
    county: profile.county,
    skills: profile.skills,
    experience: resume?.experience ?? [],
    certifications: resume?.certifications ?? profile.certifications,
  });
});

profileRoutes.post('/resume/reupload', async (c) => {
  await c.var.audit.log({
    action: 'worker.resume.uploaded',
    resourceId: c.var.userId,
    metadata: { fileBytes: 0, mimeType: 'unknown', parserVersion: 'pending' },
  });
  return ok(c, {
    status: 'parsing' as const,
    poll_url: '/v1/profile/resume/status',
  });
});

profileRoutes.get('/resume/status', async (c) => {
  return ok(c, {
    status: 'failed' as const,
    reason: 'parser_error' as const,
    fallback: 'manual_entry' as const,
  });
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
  certifications: unknown;
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
    certifications: p.certifications,
    availability: p.availability,
    resume: p.resume,
    resumeRawUrl: p.resumeRawUrl,
    onboardedAt: p.onboardedAt?.toISOString() ?? null,
    updatedAt: p.updatedAt.toISOString(),
  };
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
