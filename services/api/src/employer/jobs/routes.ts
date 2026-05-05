import { Hono } from 'hono';
import { ok, err, validate } from '@agconn/api-client/server';
import { JobStatus, type Tx } from '@agconn/db';
import {
  CreateJobBody,
  PatchJobBody,
  AutosaveJobBody,
  CloseJobBody,
  TranslateJobBody,
  EmployerJobsQuery,
  activePostingLimit,
} from '@agconn/schemas';
import { translate } from '@agconn/llm';
import { requireAuth, requireRole, requireTenant, type AuthVars } from '../../middleware/authContext';
import type { AuditCtxVars } from '../../middleware/audit';
import { isVerified } from '../shared';
import { shapeJob } from './shape';
import { recordEditAndMaybeRenotify } from './edit-events';
import { enqueueAutomatch } from './automatch-queue';
import { employerJobPhotosRoutes } from './photos';
import { employerJobScreeningRoutes } from './screening';

export const employerJobsRoutes = new Hono<{ Variables: AuthVars & AuditCtxVars }>();
employerJobsRoutes.use('*', requireAuth);
employerJobsRoutes.use('*', requireRole('employer'));
employerJobsRoutes.use('*', requireTenant);

// ─── List ──────────────────────────────────────────────────────────────────
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
    include: {
      foremanContact: true,
      photos: { orderBy: { sortOrder: 'asc' } },
      screeningQuestions: { orderBy: { sortOrder: 'asc' } },
    },
  });

  const slice = rows.slice(0, q.limit);
  const hasMore = rows.length > q.limit;

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
    jobs: slice.map((j) => shapeJob(j, countsByJob.get(j.id) ?? {})),
    nextCursor,
  });
});

// ─── Create ────────────────────────────────────────────────────────────────
employerJobsRoutes.post('/', validate('json', CreateJobBody), async (c) => {
  const userId = c.var.userId;
  const tenantId = c.var.tenantId!;
  const body = c.var.body;

  const screeningQs = body.screeningQuestions ?? [];

  const created = await c.var.db.$transaction(async (tx) => {
    const humanId = await reserveHumanId(tx, tenantId);
    const job = await tx.jobPosting.create({
      data: {
        tenantId,
        employerId: userId,
        ...mapV1Fields(body),
        ...mapV2Fields(body),
        humanId,
        status: JobStatus.draft,
        seoSlug: null,
        lastEditedById: userId,
      },
      include: {
        foremanContact: true,
        photos: true,
        screeningQuestions: true,
      },
    });

    if (screeningQs.length) {
      await tx.jobScreeningQuestion.createMany({
        data: screeningQs.map((q, idx) => ({
          tenantId,
          jobId: job.id,
          sortOrder: idx,
          questionEn: q.questionEn,
          questionEs: q.questionEs,
          answerType: q.answerType,
          required: q.required,
        })),
      });
    }

    return job;
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

  // Re-fetch to include any seeded screening questions in the response.
  const final = await c.var.db.jobPosting.findUnique({
    where: { id: created.id },
    include: {
      foremanContact: true,
      photos: { orderBy: { sortOrder: 'asc' } },
      screeningQuestions: { orderBy: { sortOrder: 'asc' } },
    },
  });
  return ok(c, { job: shapeJob(final!, {}) });
});

// ─── Detail ────────────────────────────────────────────────────────────────
employerJobsRoutes.get('/:id', async (c) => {
  const userId = c.var.userId;
  const id = c.req.param('id');
  const job = await c.var.db.jobPosting.findFirst({
    where: { id, employerId: userId, deletedAt: null },
    include: {
      foremanContact: true,
      photos: { orderBy: { sortOrder: 'asc' } },
      screeningQuestions: { orderBy: { sortOrder: 'asc' } },
    },
  });
  if (!job) return err(c, 404, 'not_found');

  const counts = await c.var.db.application.groupBy({
    by: ['status'],
    where: { jobId: id, deletedAt: null },
    _count: { _all: true },
  });
  const countMap = Object.fromEntries(counts.map((r) => [r.status, r._count._all]));
  return ok(c, { job: shapeJob(job, countMap) });
});

// ─── Patch (loosened — published edits are allowed; logged + re-notified) ─
employerJobsRoutes.patch('/:id', validate('json', PatchJobBody), async (c) => {
  const userId = c.var.userId;
  const tenantId = c.var.tenantId!;
  const id = c.req.param('id');
  const body = c.var.body;

  const existing = await c.var.db.jobPosting.findFirst({
    where: { id, employerId: userId, deletedAt: null },
  });
  if (!existing) return err(c, 404, 'not_found');

  if (existing.status === JobStatus.filled || existing.status === JobStatus.closed) {
    return err(c, 422, 'validation_failed', 'cannot_edit_archived');
  }

  // Hard-locked even on active: county (changes SEO slug + match radius) and
  // positionsTotal can only INCREASE (never below current hires).
  if (existing.status === JobStatus.active) {
    if (body.county && body.county !== existing.county) {
      return err(c, 422, 'validation_failed', 'cannot_change_county_active');
    }
    if (body.positionsTotal != null && body.positionsTotal < existing.hireCount) {
      return err(c, 422, 'validation_failed', 'positions_below_hire_count');
    }
    if (body.endDate && existing.endDate && new Date(body.endDate) < existing.endDate) {
      return err(c, 422, 'validation_failed', 'end_date_shorten_forbidden');
    }
  }

  const employerProfile = await c.var.db.employerProfile.findUnique({
    where: { userId },
    select: { dbaName: true, legalName: true },
  });
  const employerName = employerProfile?.dbaName || employerProfile?.legalName || 'Your employer';

  const result = await c.var.db.$transaction(async (tx) => {
    const updated = await tx.jobPosting.update({
      where: { id },
      data: {
        ...mapV1Patch(body),
        ...mapV2Patch(body),
        lastEditedById: userId,
        autosavedAt: null, // explicit save clears the autosave watermark
      },
      include: {
        foremanContact: true,
        photos: { orderBy: { sortOrder: 'asc' } },
        screeningQuestions: { orderBy: { sortOrder: 'asc' } },
      },
    });

    const renotify = await recordEditAndMaybeRenotify({
      tx,
      tenantId,
      jobId: id,
      actorUserId: userId,
      before: existing as unknown as Record<string, unknown>,
      after: updated as unknown as Record<string, unknown>,
      status: existing.status as 'draft' | 'active',
      employerName,
      notifyApplicants: body.notifyApplicants,
      renotifyPaused: existing.renotifyPaused,
    });

    return { updated, renotify };
  });

  if (result.renotify.changedFields.length > 0) {
    await c.var.audit.log({
      action: 'job.posting.edited',
      resourceId: id,
      metadata: {
        fields: result.renotify.changedFields,
        renotificationsQueued: result.renotify.renotificationsQueued,
        renotificationsSuppressed: result.renotify.renotificationsSuppressed,
      },
    });
  }

  return ok(c, {
    job: shapeJob(result.updated, {}),
    edit: {
      changedFields: result.renotify.changedFields,
      renotificationsQueued: result.renotify.renotificationsQueued,
      renotificationsSuppressed: result.renotify.renotificationsSuppressed,
      suppressedRecipientCount: result.renotify.suppressedRecipientCount,
    },
  });
});

// ─── Autosave (drafts only, no diff-log, no validation cross-field refines)
employerJobsRoutes.post('/:id/autosave', validate('json', AutosaveJobBody), async (c) => {
  const userId = c.var.userId;
  const id = c.req.param('id');
  const body = c.var.body;

  const existing = await c.var.db.jobPosting.findFirst({
    where: { id, employerId: userId, deletedAt: null },
    select: { id: true, status: true },
  });
  if (!existing) return err(c, 404, 'not_found');
  if (existing.status !== JobStatus.draft) {
    return err(c, 422, 'validation_failed', 'autosave_drafts_only');
  }

  const updated = await c.var.db.jobPosting.update({
    where: { id },
    data: {
      ...mapV1Patch(body),
      ...mapV2Patch(body),
      lastEditedById: userId,
      autosavedAt: new Date(),
    },
    select: { id: true, autosavedAt: true },
  });
  return ok(c, { id: updated.id, autosavedAt: updated.autosavedAt?.toISOString() ?? null });
});

// ─── Publish ───────────────────────────────────────────────────────────────
employerJobsRoutes.post('/:id/publish', async (c) => {
  const userId = c.var.userId;
  const tenantId = c.var.tenantId!;
  const id = c.req.param('id');

  const profile = await c.var.db.employerProfile.findUnique({ where: { userId } });
  if (!profile) return err(c, 404, 'not_found');
  if (!isVerified(profile)) return err(c, 403, 'employer_not_verified');

  const limit = activePostingLimit(profile.plan);

  const result = await c.var.db.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT id FROM employer_profiles WHERE id = ${profile.id} FOR UPDATE`;

    const job = await tx.jobPosting.findFirst({
      where: { id, employerId: userId, deletedAt: null },
    });
    if (!job) return { kind: 'not_found' as const };
    if (job.status !== JobStatus.draft) return { kind: 'not_draft' as const };

    const wageMinNum = Number(job.wageMin?.toString() ?? '0');
    const wageMaxNum = Number(job.wageMax?.toString() ?? '0');
    if (!(wageMinNum > 0) && !(wageMaxNum > 0)) {
      return { kind: 'wage_required' as const };
    }

    if (Number.isFinite(limit)) {
      const activeCount = await tx.jobPosting.count({
        where: { employerId: userId, status: JobStatus.active, deletedAt: null },
      });
      if (activeCount >= limit) return { kind: 'plan_limit' as const };
    }

    const slug = await reserveSlug(tx, job.county, job.titleEn, job.startDate);
    const keyword = await reserveSmsKeyword(tx, tenantId, job.id, job.titleEn);

    const published = await tx.jobPosting.update({
      where: { id },
      data: {
        status: JobStatus.active,
        publishedAt: new Date(),
        seoSlug: slug,
        smsApplyKeyword: keyword,
      },
      include: {
        foremanContact: true,
        photos: { orderBy: { sortOrder: 'asc' } },
        screeningQuestions: { orderBy: { sortOrder: 'asc' } },
      },
    });

    return { kind: 'ok' as const, job: published };
  });

  if (result.kind === 'not_found') return err(c, 404, 'not_found');
  if (result.kind === 'not_draft') return err(c, 422, 'validation_failed', 'not_draft');
  if (result.kind === 'wage_required') return err(c, 422, 'validation_failed', 'wage_required');
  if (result.kind === 'plan_limit') return err(c, 402, 'plan_posting_limit');

  await c.var.audit.log({
    action: 'job.posting.published',
    resourceId: result.job.id,
    metadata: { keyword: result.job.smsApplyKeyword },
  });

  // Auto-match SMS blast — top 30 qualifying workers within ~25mi. Best-effort;
  // do not fail the publish on enqueue error.
  if (result.job.autoMatchEnabled) {
    try {
      await enqueueAutomatch({ tenantId, jobId: result.job.id });
    } catch (e) {
      console.warn('[publish] automatch enqueue failed', e);
    }
  }

  return ok(c, { job: shapeJob(result.job, {}) });
});

// ─── Pause / Resume renotifications ──────────────────────────────────────
// Toggles the `renotifyPaused` flag on the posting. While paused, the
// recordEditAndMaybeRenotify pipeline skips the SMS/push enqueue on edits.
employerJobsRoutes.post('/:id/pause-renotify', async (c) => {
  const userId = c.var.userId;
  const id = c.req.param('id');

  const job = await c.var.db.jobPosting.findFirst({
    where: { id, employerId: userId, deletedAt: null },
    select: { id: true, status: true, renotifyPaused: true },
  });
  if (!job) return err(c, 404, 'not_found');
  if (job.status !== JobStatus.active) {
    return err(c, 422, 'validation_failed', 'cannot_pause_non_active');
  }
  if (job.renotifyPaused) return ok(c, { renotifyPaused: true });

  await c.var.db.jobPosting.update({
    where: { id },
    data: { renotifyPaused: true },
  });

  await c.var.audit.log({
    action: 'job.posting.renotify.paused',
    resourceId: id,
  });

  return ok(c, { renotifyPaused: true });
});

employerJobsRoutes.post('/:id/resume-renotify', async (c) => {
  const userId = c.var.userId;
  const id = c.req.param('id');

  const job = await c.var.db.jobPosting.findFirst({
    where: { id, employerId: userId, deletedAt: null },
    select: { id: true, renotifyPaused: true },
  });
  if (!job) return err(c, 404, 'not_found');
  if (!job.renotifyPaused) return ok(c, { renotifyPaused: false });

  await c.var.db.jobPosting.update({
    where: { id },
    data: { renotifyPaused: false },
  });

  await c.var.audit.log({
    action: 'job.posting.renotify.resumed',
    resourceId: id,
  });

  return ok(c, { renotifyPaused: false });
});

// ─── Republish (re-runs auto-match SMS for an active posting) ────────────
employerJobsRoutes.post('/:id/republish', async (c) => {
  const userId = c.var.userId;
  const tenantId = c.var.tenantId!;
  const id = c.req.param('id');

  const job = await c.var.db.jobPosting.findFirst({
    where: { id, employerId: userId, deletedAt: null },
    select: { id: true, status: true, autoMatchEnabled: true },
  });
  if (!job) return err(c, 404, 'not_found');
  if (job.status !== JobStatus.active) {
    return err(c, 422, 'validation_failed', 'cannot_republish_non_active');
  }

  let enqueuedId: string | null = null;
  if (job.autoMatchEnabled) {
    try {
      enqueuedId = await enqueueAutomatch({ tenantId, jobId: job.id });
    } catch (e) {
      console.warn('[republish] automatch enqueue failed', e);
      return err(c, 500, 'automatch_enqueue_failed');
    }
  }

  await c.var.audit.log({
    action: 'job.posting.republished',
    resourceId: job.id,
    metadata: { enqueued: !!enqueuedId, autoMatchEnabled: job.autoMatchEnabled },
  });

  return ok(c, { ok: true, enqueued: !!enqueuedId });
});

// ─── Reopen (closed → active; preserves slug + keyword) ──────────────────
employerJobsRoutes.post('/:id/reopen', async (c) => {
  const userId = c.var.userId;
  const id = c.req.param('id');

  const profile = await c.var.db.employerProfile.findUnique({ where: { userId } });
  if (!profile) return err(c, 404, 'not_found');
  if (!isVerified(profile)) return err(c, 403, 'employer_not_verified');

  const limit = activePostingLimit(profile.plan);

  const result = await c.var.db.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT id FROM employer_profiles WHERE id = ${profile.id} FOR UPDATE`;

    const job = await tx.jobPosting.findFirst({
      where: { id, employerId: userId, deletedAt: null },
    });
    if (!job) return { kind: 'not_found' as const };
    if (job.status !== JobStatus.closed) return { kind: 'not_closed' as const };

    if (Number.isFinite(limit)) {
      const activeCount = await tx.jobPosting.count({
        where: { employerId: userId, status: JobStatus.active, deletedAt: null },
      });
      if (activeCount >= limit) return { kind: 'plan_limit' as const };
    }

    const reopened = await tx.jobPosting.update({
      where: { id },
      data: {
        status: JobStatus.active,
        closedAt: null,
        filledAt: null,
      },
      include: {
        foremanContact: true,
        photos: { orderBy: { sortOrder: 'asc' } },
        screeningQuestions: { orderBy: { sortOrder: 'asc' } },
      },
    });

    return { kind: 'ok' as const, job: reopened };
  });

  if (result.kind === 'not_found') return err(c, 404, 'not_found');
  if (result.kind === 'not_closed') return err(c, 422, 'validation_failed', 'not_closed');
  if (result.kind === 'plan_limit') return err(c, 402, 'plan_posting_limit');

  await c.var.audit.log({
    action: 'job.posting.reopened',
    resourceId: result.job.id,
  });

  return ok(c, { job: shapeJob(result.job, {}) });
});

// ─── Close + delete + translate (unchanged behavior, new shape) ──────────
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
    include: {
      foremanContact: true,
      photos: { orderBy: { sortOrder: 'asc' } },
      screeningQuestions: { orderBy: { sortOrder: 'asc' } },
    },
  });

  await c.var.audit.log({
    action: 'job.posting.closed',
    resourceId: id,
    metadata: { reason: body.reason ?? 'unspecified' },
  });

  return ok(c, { job: shapeJob(updated, {}) });
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

// Mount the sub-routers under /v1/employer/jobs/*
employerJobsRoutes.route('/', employerJobPhotosRoutes);
employerJobsRoutes.route('/', employerJobScreeningRoutes);

// ─── Helpers ──────────────────────────────────────────────────────────────

function mapV1Fields(body: CreateJobBody) {
  return {
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
  };
}

function mapV2Fields(body: CreateJobBody) {
  return {
    cropId: body.cropId ?? null,
    roleTypeId: body.roleTypeId ?? null,
    dailyStartTime: body.dailyStartTime ? timeStringToDate(body.dailyStartTime) : null,
    dailyEndTime: body.dailyEndTime ? timeStringToDate(body.dailyEndTime) : null,
    workingDays: body.workingDays ?? 31,
    wageStructure: body.wageStructure ?? 'hourly',
    pieceRate: body.pieceRate ?? null,
    pieceUnit: body.pieceUnit ?? null,
    payFrequency: body.payFrequency ?? 'weekly',
    mealsProvided: body.mealsProvided ?? false,
    endOfSeasonBonusCents: body.endOfSeasonBonusCents ?? null,
    pickupPoint: body.pickupPoint ?? null,
    minExperience: body.minExperience ?? 'none',
    minAge: body.minAge ?? 'eighteen',
    autoMatchEnabled: body.autoMatchEnabled ?? true,
    autoTranslateEnabled: body.autoTranslateEnabled ?? true,
    smsApplyEnabled: body.smsApplyEnabled ?? true,
    applicationDeadlineAt: body.applicationDeadlineAt ? new Date(body.applicationDeadlineAt) : null,
    foremanContactId: body.foremanContactId ?? null,
    siteAddress: body.siteAddress ?? null,
    siteAcres: body.siteAcres ?? null,
  };
}

// PATCH variants honor `null` as "clear" and `undefined` as "leave alone".
function mapV1Patch(body: PatchJobBody) {
  return {
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
  };
}

function mapV2Patch(body: PatchJobBody) {
  return {
    cropId: body.cropId === null ? null : body.cropId ?? undefined,
    roleTypeId: body.roleTypeId === null ? null : body.roleTypeId ?? undefined,
    dailyStartTime:
      body.dailyStartTime === null
        ? null
        : body.dailyStartTime
          ? timeStringToDate(body.dailyStartTime)
          : undefined,
    dailyEndTime:
      body.dailyEndTime === null
        ? null
        : body.dailyEndTime
          ? timeStringToDate(body.dailyEndTime)
          : undefined,
    workingDays: body.workingDays ?? undefined,
    wageStructure: body.wageStructure ?? undefined,
    pieceRate: body.pieceRate === null ? null : body.pieceRate ?? undefined,
    pieceUnit: body.pieceUnit === null ? null : body.pieceUnit ?? undefined,
    payFrequency: body.payFrequency ?? undefined,
    mealsProvided: body.mealsProvided ?? undefined,
    endOfSeasonBonusCents:
      body.endOfSeasonBonusCents === null ? null : body.endOfSeasonBonusCents ?? undefined,
    pickupPoint: body.pickupPoint === null ? null : body.pickupPoint ?? undefined,
    minExperience: body.minExperience ?? undefined,
    minAge: body.minAge ?? undefined,
    autoMatchEnabled: body.autoMatchEnabled ?? undefined,
    autoTranslateEnabled: body.autoTranslateEnabled ?? undefined,
    smsApplyEnabled: body.smsApplyEnabled ?? undefined,
    applicationDeadlineAt:
      body.applicationDeadlineAt === null
        ? null
        : body.applicationDeadlineAt
          ? new Date(body.applicationDeadlineAt)
          : undefined,
    foremanContactId:
      body.foremanContactId === null ? null : body.foremanContactId ?? undefined,
    siteAddress: body.siteAddress === null ? null : body.siteAddress ?? undefined,
    siteAcres: body.siteAcres === null ? null : body.siteAcres ?? undefined,
  };
}

function timeStringToDate(hhmm: string): Date {
  const [h, m] = hhmm.split(':').map((s) => Number(s));
  // Postgres TIME has no date component — store as UTC time-of-day.
  return new Date(Date.UTC(1970, 0, 1, h ?? 0, m ?? 0, 0, 0));
}

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

// "SV-2025-0042" — first 2 chars from employer DBA initials, year, sequence.
async function reserveHumanId(tx: Tx, tenantId: string): Promise<string> {
  const year = new Date().getUTCFullYear();
  const prefixCount = await tx.jobPosting.count({
    where: {
      tenantId,
      humanId: { startsWith: `${year}-`, mode: 'insensitive' },
    },
  });
  const seq = String(prefixCount + 1).padStart(4, '0');
  return `${year}-${seq}`;
}

// SMS keyword: 4-7 chars, alphanumeric, derived from job title initials, with a
// short suffix to avoid collisions. Stored on the job + in sms_keywords for
// the inbound webhook to look up.
async function reserveSmsKeyword(
  tx: Tx,
  tenantId: string,
  jobId: string,
  titleEn: string,
): Promise<string> {
  const base = titleEn
    .toUpperCase()
    .replace(/[^A-Z0-9 ]/g, '')
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w.slice(0, 1))
    .join('')
    .slice(0, 4) || 'JOB';
  for (let attempt = 0; attempt < 6; attempt++) {
    const suffix = randomAlnum(3);
    const candidate = `${base}-${suffix}`;
    const existing = await tx.smsKeyword.findFirst({
      where: { keyword: { equals: candidate, mode: 'insensitive' } },
    });
    if (!existing) {
      await tx.smsKeyword.create({
        data: { tenantId, keyword: candidate, kind: 'job_apply', entityId: jobId, active: true },
      });
      return candidate;
    }
  }
  throw new Error('keyword_collision');
}

function randomAlnum(n: number): string {
  const alphabet = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'; // no I/O/L/0/1
  let out = '';
  for (let i = 0; i < n; i++) {
    out += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return out;
}
