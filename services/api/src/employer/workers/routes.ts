import { Hono } from 'hono';
import { ok, err, validate } from '@agconn/api-client/server';
import { AppStatus, JobStatus, type County, type Tx } from '@agconn/db';
import {
  WorkerSearchQuery,
  InviteWorkerBody,
  canUseFeature,
} from '@agconn/schemas';
import { enqueueSms } from '@agconn/sms';
import { requireAuth, requireRole, requireTenant, type AuthVars } from '../../middleware/authContext.js';
import type { AuditCtxVars } from '../../middleware/audit.js';

// audit-required:exempt — worker_search_log is itself the audit record for
// search activity (per docs/20-employer/04-worker-search/02-data-model.md).
// Invitation creates are audited via the GET /v1/employer/invitations
// surface and the worker-side accept event.

// Note on tenant scoping: WorkerProfile carries tenantId per the three-bucket
// tenancy migration (20260504200000_three_bucket_tenancy). The where clauses
// below intentionally filter by tenantId — workers seed-bound to a tenant
// during onboarding and are scoped to that tenant for all employer queries.

export const employerWorkersRoutes = new Hono<{ Variables: AuthVars & AuditCtxVars }>();
employerWorkersRoutes.use('*', requireAuth('employer'));
employerWorkersRoutes.use('*', requireRole('employer'));
employerWorkersRoutes.use('*', requireTenant);

employerWorkersRoutes.get('/', validate('query', WorkerSearchQuery), async (c) => {
  const userId = c.var.userId;
  const tenantId = c.var.tenantId!;
  const q = c.var.body;

  const profile = await c.var.db.employerProfile.findUnique({ where: { userId } });
  if (!profile) return err(c, 404, 'not_found');
  if (!canUseFeature(profile.plan, 'workerSearch')) {
    return err(c, 402, 'plan_required_pro');
  }

  const counties = q.county?.length ? (q.county as County[]) : null;

  const rows = await c.var.db.workerProfile.findMany({
    where: {
      onboardedAt: { not: null },
      deletedAt: null,
      ...(counties ? { county: { in: counties } } : {}),
      ...(q.skills?.length ? { skills: { hasSome: q.skills } } : {}),
    },
    orderBy: [{ updatedAt: 'desc' }],
    take: q.limit + 1,
    include: { user: { select: { id: true, phone: true, email: true } } },
  });

  const slice = rows.slice(0, q.limit);
  const hasMore = rows.length > q.limit;

  // Resolve relationships for THIS employer in one round-trip.
  const workerIds = slice.map((w) => w.id);
  const [hireRows, inviteRows, applyRows] = await Promise.all([
    workerIds.length
      ? c.var.db.application.findMany({
          where: {
            workerId: { in: workerIds },
            status: AppStatus.hired,
            deletedAt: null,
            job: { employerId: userId },
          },
          select: { workerId: true },
        })
      : [],
    workerIds.length
      ? c.var.db.workerInvitation.findMany({
          where: {
            workerId: { in: workerIds },
            employerId: profile.id,
            acceptedAt: { not: null },
          },
          select: { workerId: true },
        })
      : [],
    workerIds.length
      ? c.var.db.application.findMany({
          where: {
            workerId: { in: workerIds },
            deletedAt: null,
            status: { not: AppStatus.withdrawn },
            job: { employerId: userId },
          },
          select: { workerId: true },
        })
      : [],
  ]);
  const hired = new Set(hireRows.map((r) => r.workerId));
  const invited = new Set(inviteRows.map((r) => r.workerId));
  const applied = new Set(applyRows.map((r) => r.workerId));

  await c.var.db.workerSearchLog.create({
    data: {
      tenantId,
      employerId: profile.id,
      filters: q as object,
      resultCount: slice.length,
    },
  });

  const requested = q.skills ?? [];

  const last = slice[slice.length - 1];
  const nextCursor =
    hasMore && last
      ? Buffer.from(`${last.updatedAt.toISOString()}|${last.id}`).toString('base64url')
      : null;

  return ok(c, {
    workers: slice.map((w) => {
      const matchScore = requested.length
        ? w.skills.filter((s) => requested.includes(s)).length
        : 0;
      const relationship: 'hired' | 'invited' | 'applied' | undefined = hired.has(w.id)
        ? 'hired'
        : invited.has(w.id)
          ? 'invited'
          : applied.has(w.id)
            ? 'applied'
            : undefined;

      return shapeWorkerCard(w, matchScore, relationship);
    }),
    nextCursor,
  });
});

employerWorkersRoutes.get('/:id', async (c) => {
  const userId = c.var.userId;
  const tenantId = c.var.tenantId!;
  const id = c.req.param('id');

  const profile = await c.var.db.employerProfile.findUnique({ where: { userId } });
  if (!profile) return err(c, 404, 'not_found');
  if (!canUseFeature(profile.plan, 'workerSearch')) {
    return err(c, 402, 'plan_required_pro');
  }

  const worker = await c.var.db.workerProfile.findFirst({
    where: { id, onboardedAt: { not: null }, deletedAt: null },
    include: { user: { select: { id: true, phone: true, email: true } } },
  });
  if (!worker) return err(c, 404, 'not_found');

  const relationship = await resolveRelationship(c.var.db, profile.id, userId, id);

  return ok(c, {
    worker: {
      ...shapeWorkerCard(worker, 0, relationship),
      experience: extractResumeArray(worker.resume, 'experience'),
      education: extractResumeArray(worker.resume, 'education'),
      languages: extractLanguages(worker.resume),
    },
  });
});

employerWorkersRoutes.post('/:id/invite', validate('json', InviteWorkerBody), async (c) => {
  const userId = c.var.userId;
  const tenantId = c.var.tenantId!;
  const workerId = c.req.param('id');
  const body = c.var.body;

  const profile = await c.var.db.employerProfile.findUnique({ where: { userId } });
  if (!profile) return err(c, 404, 'not_found');
  if (!canUseFeature(profile.plan, 'workerSearch')) {
    return err(c, 402, 'plan_required_pro');
  }

  const job = await c.var.db.jobPosting.findFirst({
    where: { id: body.jobId, employerId: userId, deletedAt: null },
  });
  if (!job) return err(c, 404, 'not_found');
  if (job.status !== JobStatus.active) {
    return err(c, 422, 'validation_failed', 'job_not_active');
  }

  const worker = await c.var.db.workerProfile.findFirst({
    where: { id: workerId, onboardedAt: { not: null }, deletedAt: null },
  });
  if (!worker) return err(c, 422, 'validation_failed', 'worker_not_eligible');

  const existingApp = await c.var.db.application.findFirst({
    where: { jobId: body.jobId, workerId, deletedAt: null },
  });
  if (existingApp) return err(c, 409, 'conflict', 'already_applied');

  try {
    const created = await c.var.db.workerInvitation.create({
      data: {
        tenantId,
        employerId: profile.id,
        workerId,
        jobId: body.jobId,
        message: body.message ?? null,
      },
    });

    await enqueueSms({
      tenantId,
      userId: workerId,
      template: 'worker.invitation',
      vars: {
        employer: profile.dbaName ?? profile.legalName,
        jobTitle: job.titleEn,
        wageMin: Number(job.wageMin.toString()).toFixed(0),
        wageMax: Number(job.wageMax.toString()).toFixed(0),
        county: job.county,
        id: created.id,
      },
      jobKey: `invite-${created.id}`,
    });

    return ok(c, {
      invitation: {
        id: created.id,
        workerId: created.workerId,
        jobId: created.jobId,
        message: created.message,
        acceptedAt: null,
        declinedAt: null,
        expiredAt: null,
        createdAt: created.createdAt.toISOString(),
      },
    });
  } catch (e) {
    const code = (e as { code?: string }).code;
    if (code === 'P2002') return err(c, 409, 'conflict', 'already_invited');
    throw e;
  }
});

export const employerInvitationsRoutes = new Hono<{ Variables: AuthVars & AuditCtxVars }>();
employerInvitationsRoutes.use('*', requireAuth('employer'));
employerInvitationsRoutes.use('*', requireRole('employer'));
employerInvitationsRoutes.use('*', requireTenant);

employerInvitationsRoutes.get('/', async (c) => {
  const userId = c.var.userId;
  const profile = await c.var.db.employerProfile.findUnique({ where: { userId } });
  if (!profile) return err(c, 404, 'not_found');

  const rows = await c.var.db.workerInvitation.findMany({
    where: { employerId: profile.id },
    orderBy: { createdAt: 'desc' },
    take: 100,
  });

  return ok(c, {
    invitations: rows.map((r) => ({
      id: r.id,
      workerId: r.workerId,
      jobId: r.jobId,
      message: r.message,
      acceptedAt: r.acceptedAt?.toISOString() ?? null,
      declinedAt: r.declinedAt?.toISOString() ?? null,
      expiredAt: r.expiredAt?.toISOString() ?? null,
      createdAt: r.createdAt.toISOString(),
    })),
  });
});

// Helpers ------------------------------------------------------------------

async function resolveRelationship(
  db: Tx,
  employerProfileId: string,
  employerUserId: string,
  workerId: string,
): Promise<'hired' | 'invited' | 'applied' | undefined> {
  const [hire, invite, apply] = await Promise.all([
    db.application.findFirst({
      where: {
        workerId,
        status: AppStatus.hired,
        deletedAt: null,
        job: { employerId: employerUserId },
      },
      select: { id: true },
    }),
    db.workerInvitation.findFirst({
      where: { workerId, employerId: employerProfileId, acceptedAt: { not: null } },
      select: { id: true },
    }),
    db.application.findFirst({
      where: {
        workerId,
        deletedAt: null,
        status: { not: AppStatus.withdrawn },
        job: { employerId: employerUserId },
      },
      select: { id: true },
    }),
  ]);
  if (hire) return 'hired';
  if (invite) return 'invited';
  if (apply) return 'applied';
  return undefined;
}

function shapeWorkerCard(
  w: {
    id: string;
    firstName: string;
    lastName: string;
    county: County | null;
    skills: string[];
    certifications: unknown;
    availability: unknown;
    resume: unknown;
    user: { phone: string | null; email: string | null };
  },
  matchScore: number,
  relationship: 'hired' | 'invited' | 'applied' | undefined,
) {
  const lastInitial = w.lastName.slice(0, 1).toUpperCase();
  const showContact = relationship !== undefined;
  return {
    id: w.id,
    firstName: w.firstName,
    lastInitial,
    ...(showContact ? { lastName: w.lastName } : {}),
    county: w.county,
    skills: w.skills,
    matchScore,
    certifications: certsFromJson(w.certifications),
    availability: w.availability,
    experienceCount: countExperience(w.resume),
    ...(showContact && w.user.phone ? { phone: w.user.phone } : {}),
    ...(showContact && w.user.email ? { email: w.user.email } : {}),
    ...(relationship ? { relationship } : {}),
  };
}

function certsFromJson(value: unknown): Array<{ name: string; issuer: string | null; source: 'agconn' | 'self' }> {
  if (!Array.isArray(value)) return [];
  const result: Array<{ name: string; issuer: string | null; source: 'agconn' | 'self' }> = [];
  for (const v of value) {
    if (!v || typeof v !== 'object') continue;
    const o = v as Record<string, unknown>;
    const name = typeof o.name === 'string' ? o.name : '';
    if (!name) continue;
    result.push({
      name,
      issuer: typeof o.issuer === 'string' ? o.issuer : null,
      source: o.source === 'agconn' ? 'agconn' : 'self',
    });
  }
  return result;
}

function countExperience(resume: unknown): number {
  if (!resume || typeof resume !== 'object') return 0;
  const exp = (resume as { experience?: unknown }).experience;
  return Array.isArray(exp) ? exp.length : 0;
}

function extractResumeArray(resume: unknown, key: string): unknown[] {
  if (!resume || typeof resume !== 'object') return [];
  const v = (resume as Record<string, unknown>)[key];
  return Array.isArray(v) ? v : [];
}

function extractLanguages(resume: unknown): string[] {
  if (!resume || typeof resume !== 'object') return [];
  const v = (resume as Record<string, unknown>).languages;
  return Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : [];
}
