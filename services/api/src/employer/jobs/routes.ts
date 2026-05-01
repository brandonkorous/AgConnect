import { Hono } from 'hono';
import { ok, err, validate } from '@agconn/api-client/server';
import { JobStatus, type Tx } from '@agconn/db';
import {
  CreateJobBody,
  PatchJobBody,
  CloseJobBody,
  TranslateJobBody,
  EmployerJobsQuery,
  activePostingLimit,
} from '@agconn/schemas';
import { translate } from '@agconn/llm';
import { requireAuth, requireRole, requireTenant, type AuthVars } from '../../middleware/authContext';
import type { AuditCtxVars } from '../../middleware/audit';
import { isVerified } from '../shared';

export const employerJobsRoutes = new Hono<{ Variables: AuthVars & AuditCtxVars }>();
employerJobsRoutes.use('*', requireAuth);
employerJobsRoutes.use('*', requireRole('employer'));
employerJobsRoutes.use('*', requireTenant);

employerJobsRoutes.get('/', validate('query', EmployerJobsQuery), async (c) => {
  const userId = c.var.userId;
  const tenantId = c.var.tenantId!;
  const q = c.var.body;

  const profile = await c.var.db.employerProfile.findUnique({ where: { userId } });
  if (!profile) return err(c, 404, 'not_found');

  const where = {
    employerId: userId,
    tenantId,
    deletedAt: null,
    ...(q.status ? { status: q.status as JobStatus } : {}),
  };

  const rows = await c.var.db.jobPosting.findMany({
    where,
    orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    take: q.limit + 1,
  });

  const slice = rows.slice(0, q.limit);
  const hasMore = rows.length > q.limit;

  // Single grouped query for application counts across this slice.
  const ids = slice.map((j) => j.id);
  const counts = ids.length
    ? await c.var.db.application.groupBy({
        by: ['jobId', 'status'],
        where: { jobId: { in: ids }, deletedAt: null },
        _count: { _all: true },
      })
    : [];
  const countsByJob = new Map<string, Record<string, number>>();
  for (const r of counts) {
    const m = countsByJob.get(r.jobId) ?? {};
    m[r.status] = r._count._all;
    countsByJob.set(r.jobId, m);
  }

  const last = slice[slice.length - 1];
  const nextCursor =
    hasMore && last
      ? Buffer.from(`${last.createdAt.toISOString()}|${last.id}`).toString('base64url')
      : null;

  return ok(c, {
    jobs: slice.map((j) => shape(j, countsByJob.get(j.id) ?? {})),
    nextCursor,
  });
});

employerJobsRoutes.post('/', validate('json', CreateJobBody), async (c) => {
  const userId = c.var.userId;
  const tenantId = c.var.tenantId!;
  const body = c.var.body;

  const created = await c.var.db.jobPosting.create({
    data: {
      tenantId,
      employerId: userId,
      titleEn: body.titleEn,
      titleEs: body.titleEs,
      descriptionEn: body.descriptionEn,
      descriptionEs: body.descriptionEs,
      county: body.county,
      city: body.city ?? null,
      zipCode: body.zipCode ?? null,
      wageMin: body.wageMin,
      wageMax: body.wageMax,
      wageUnit: body.wageUnit,
      startDate: new Date(body.startDate),
      endDate: body.endDate ? new Date(body.endDate) : null,
      applyBy: body.applyBy ? new Date(body.applyBy) : null,
      skills: body.skills,
      housing: body.housing,
      transport: body.transport,
      positionsTotal: body.positionsTotal,
      status: JobStatus.draft,
      seoSlug: null,
    },
  });

  await c.var.audit.log({
    action: 'job.posting.created',
    resourceId: created.id,
    metadata: {
      title: created.titleEn,
      county: created.county,
      wage: `${Number(created.wageMin)}-${Number(created.wageMax)}`,
      wageUnit: created.wageUnit,
    },
  });

  return ok(c, { job: shape(created, {}) });
});

employerJobsRoutes.get('/:id', async (c) => {
  const userId = c.var.userId;
  const id = c.req.param('id');
  const job = await c.var.db.jobPosting.findFirst({
    where: { id, employerId: userId, deletedAt: null },
  });
  if (!job) return err(c, 404, 'not_found');

  const counts = await c.var.db.application.groupBy({
    by: ['status'],
    where: { jobId: id, deletedAt: null },
    _count: { _all: true },
  });
  const countMap = Object.fromEntries(counts.map((r) => [r.status, r._count._all]));

  return ok(c, { job: shape(job, countMap) });
});

employerJobsRoutes.patch('/:id', validate('json', PatchJobBody), async (c) => {
  const userId = c.var.userId;
  const id = c.req.param('id');
  const body = c.var.body;

  const existing = await c.var.db.jobPosting.findFirst({
    where: { id, employerId: userId, deletedAt: null },
  });
  if (!existing) return err(c, 404, 'not_found');

  // While active, only description, endDate (extend only), and additive
  // skills are editable. Anything else: 422.
  if (existing.status === JobStatus.active) {
    const forbiddenChange =
      body.titleEn !== undefined ||
      body.titleEs !== undefined ||
      body.county !== undefined ||
      body.wageMin !== undefined ||
      body.wageMax !== undefined ||
      body.wageUnit !== undefined ||
      body.startDate !== undefined ||
      body.positionsTotal !== undefined ||
      body.housing !== undefined ||
      body.transport !== undefined;
    if (forbiddenChange) {
      return err(c, 422, 'validation_failed', 'cannot_edit_active_field');
    }
    if (body.endDate && existing.endDate && new Date(body.endDate) < existing.endDate) {
      return err(c, 422, 'validation_failed', 'end_date_shorten_forbidden');
    }
    if (body.skills && body.skills.some((s) => !existing.skills.includes(s)) === false &&
        existing.skills.some((s) => !body.skills!.includes(s))) {
      return err(c, 422, 'validation_failed', 'skills_remove_forbidden');
    }
  }

  if (existing.status === JobStatus.filled || existing.status === JobStatus.closed) {
    return err(c, 422, 'validation_failed', 'cannot_edit_archived');
  }

  const updated = await c.var.db.jobPosting.update({
    where: { id },
    data: {
      titleEn: body.titleEn ?? undefined,
      titleEs: body.titleEs ?? undefined,
      descriptionEn: body.descriptionEn ?? undefined,
      descriptionEs: body.descriptionEs ?? undefined,
      county: body.county ?? undefined,
      city: body.city === null ? null : body.city ?? undefined,
      zipCode: body.zipCode === null ? null : body.zipCode ?? undefined,
      wageMin: body.wageMin ?? undefined,
      wageMax: body.wageMax ?? undefined,
      wageUnit: body.wageUnit ?? undefined,
      startDate: body.startDate ? new Date(body.startDate) : undefined,
      endDate: body.endDate === null ? null : body.endDate ? new Date(body.endDate) : undefined,
      applyBy: body.applyBy === null ? null : body.applyBy ? new Date(body.applyBy) : undefined,
      skills: body.skills ?? undefined,
      housing: body.housing ?? undefined,
      transport: body.transport ?? undefined,
      positionsTotal: body.positionsTotal ?? undefined,
    },
  });

  return ok(c, { job: shape(updated, {}) });
});

employerJobsRoutes.post('/:id/publish', async (c) => {
  const userId = c.var.userId;
  const tenantId = c.var.tenantId!;
  const id = c.req.param('id');

  const profile = await c.var.db.employerProfile.findUnique({ where: { userId } });
  if (!profile) return err(c, 404, 'not_found');
  if (!isVerified(profile)) return err(c, 403, 'employer_not_verified');

  const limit = activePostingLimit(profile.plan);

  const result = await c.var.db.$transaction(async (tx) => {
    // Lock the employer profile row to serialize concurrent publishes.
    await tx.$queryRaw`SELECT id FROM employer_profiles WHERE id = ${profile.id} FOR UPDATE`;

    const job = await tx.jobPosting.findFirst({
      where: { id, employerId: userId, deletedAt: null },
    });
    if (!job) return { kind: 'not_found' as const };
    if (job.status !== JobStatus.draft) return { kind: 'not_draft' as const };

    if (Number.isFinite(limit)) {
      const activeCount = await tx.jobPosting.count({
        where: {
          employerId: userId,
          status: JobStatus.active,
          deletedAt: null,
        },
      });
      if (activeCount >= limit) return { kind: 'plan_limit' as const };
    }

    const slug = await reserveSlug(tx, job.county, job.titleEn, job.startDate);

    const published = await tx.jobPosting.update({
      where: { id },
      data: {
        status: JobStatus.active,
        publishedAt: new Date(),
        seoSlug: slug,
      },
    });

    return { kind: 'ok' as const, job: published };
  });

  if (result.kind === 'not_found') return err(c, 404, 'not_found');
  if (result.kind === 'not_draft') return err(c, 422, 'validation_failed', 'not_draft');
  if (result.kind === 'plan_limit') return err(c, 402, 'plan_posting_limit');

  await c.var.audit.log({
    action: 'job.posting.published',
    resourceId: result.job.id,
    metadata: {},
  });

  return ok(c, { job: shape(result.job, {}) });
});

employerJobsRoutes.post('/:id/close', validate('json', CloseJobBody), async (c) => {
  const userId = c.var.userId;
  const id = c.req.param('id');
  const body = c.var.body;

  const existing = await c.var.db.jobPosting.findFirst({
    where: { id, employerId: userId, deletedAt: null },
  });
  if (!existing) return err(c, 404, 'not_found');
  if (existing.status === JobStatus.closed || existing.status === JobStatus.filled) {
    return err(c, 422, 'validation_failed', 'cannot_close_at_status');
  }

  const updated = await c.var.db.jobPosting.update({
    where: { id },
    data: {
      status: JobStatus.closed,
      closedAt: new Date(),
      ...(body.reason === 'filled' ? { filledAt: new Date() } : {}),
    },
  });

  await c.var.audit.log({
    action: 'job.posting.closed',
    resourceId: id,
    metadata: { reason: body.reason ?? 'unspecified' },
  });

  return ok(c, { job: shape(updated, {}) });
});

employerJobsRoutes.delete('/:id', async (c) => {
  const userId = c.var.userId;
  const id = c.req.param('id');
  const existing = await c.var.db.jobPosting.findFirst({
    where: { id, employerId: userId, deletedAt: null },
  });
  if (!existing) return err(c, 404, 'not_found');
  if (existing.status !== JobStatus.draft) {
    return err(c, 422, 'validation_failed', 'cannot_delete_non_draft');
  }
  await c.var.db.jobPosting.update({ where: { id }, data: { deletedAt: new Date() } });
  return ok(c, { ok: true });
});

employerJobsRoutes.post('/translate', validate('json', TranslateJobBody), async (c) => {
  const body = c.var.body;
  const result = await translate({
    text: body.text,
    fromLocale: body.fromLocale,
    toLocale: body.toLocale,
    context: body.field === 'title' ? 'job_title' : 'job_description',
  });
  return ok(c, result);
});

// Helpers ------------------------------------------------------------------

async function reserveSlug(tx: Tx, county: string, titleEn: string, startDate: Date): Promise<string> {
  const base = [
    county.toLowerCase(),
    titleEn
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-')
      .slice(0, 40),
    startDate.getUTCFullYear(),
  ].join('-');
  for (let attempt = 0; attempt < 5; attempt++) {
    const suffix = Math.random().toString(36).slice(2, 6);
    const candidate = `${base}-${suffix}`.slice(0, 80);
    const existing = await tx.jobPosting.findUnique({ where: { seoSlug: candidate } });
    if (!existing) return candidate;
  }
  throw new Error('slug_collision');
}

function shape(j: {
  id: string;
  seoSlug: string | null;
  titleEn: string;
  titleEs: string;
  county: string;
  city: string | null;
  wageMin: { toString: () => string };
  wageMax: { toString: () => string };
  wageUnit: string;
  startDate: Date;
  endDate: Date | null;
  skills: string[];
  housing: boolean;
  transport: boolean;
  positionsTotal: number;
  hireCount: number;
  status: string;
  publishedAt: Date | null;
  filledAt: Date | null;
  closedAt: Date | null;
  createdAt: Date;
}, counts: Record<string, number>) {
  return {
    id: j.id,
    seoSlug: j.seoSlug,
    titleEn: j.titleEn,
    titleEs: j.titleEs,
    county: j.county,
    city: j.city,
    wageMin: Number(j.wageMin.toString()),
    wageMax: Number(j.wageMax.toString()),
    wageUnit: j.wageUnit,
    startDate: j.startDate.toISOString().slice(0, 10),
    endDate: j.endDate ? j.endDate.toISOString().slice(0, 10) : null,
    employerName: '',
    employerVerified: true,
    skills: j.skills,
    housing: j.housing,
    transport: j.transport,
    positionsTotal: j.positionsTotal,
    hireCount: j.hireCount,
    status: j.status,
    publishedAt: j.publishedAt?.toISOString() ?? null,
    filledAt: j.filledAt?.toISOString() ?? null,
    closedAt: j.closedAt?.toISOString() ?? null,
    createdAt: j.createdAt.toISOString(),
    applicationCounts: {
      applied: counts['applied'] ?? 0,
      reviewed: counts['reviewed'] ?? 0,
      hired: counts['hired'] ?? 0,
      rejected: counts['rejected'] ?? 0,
    },
  };
}
