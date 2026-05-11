import { Hono } from 'hono';
import { z } from 'zod';
import { ok, err, validate } from '@agconn/api-client/server';
import {
  clerkAdminAuthMiddleware,
  requireAdminOrg,
  type AdminOrgVars,
} from '../../middleware/adminClerkAuth.js';
import type { AuditCtxVars } from '../../middleware/audit.js';

export const adminWorkRoutes = new Hono<{ Variables: AdminOrgVars & AuditCtxVars }>();

adminWorkRoutes.use('*', clerkAdminAuthMiddleware);
adminWorkRoutes.use('*', requireAdminOrg('admin'));

const CountyEnum = z.enum(['Fresno', 'Kern', 'Kings', 'Madera', 'Tulare']);
const arrayOf = <T extends z.ZodTypeAny>(item: T) =>
  z.preprocess((v) => (typeof v === 'string' ? [v] : v), z.array(item));

// ─── jobs ───────────────────────────────────────────────────────────────────

const listJobsQuery = z
  .object({
    search: z.string().min(1).max(200).optional(),
    status: z.enum(['draft', 'active', 'closed', 'filled']).optional(),
    employerId: z.string().uuid().optional(),
    counties: arrayOf(CountyEnum).optional(),
    tenantId: z.string().uuid().optional(),
    limit: z.coerce.number().int().min(1).max(500).default(100),
  })
  .strict();

adminWorkRoutes.get('/jobs', validate('query', listJobsQuery), async (c) => {
  const q = c.var.body;
  const where: Record<string, unknown> = { deletedAt: null };
  if (q.status) where['status'] = q.status;
  if (q.employerId) where['employerId'] = q.employerId;
  if (q.counties?.length) where['county'] = { in: q.counties };
  if (q.tenantId) where['tenantId'] = q.tenantId;
  if (q.search) {
    where['OR'] = [
      { titleEn: { contains: q.search, mode: 'insensitive' } },
      { titleEs: { contains: q.search, mode: 'insensitive' } },
      { seoSlug: { contains: q.search } },
    ];
  }

  const jobs = await c.var.db.jobPosting.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: q.limit,
    select: {
      id: true,
      tenantId: true,
      employerId: true,
      titleEn: true,
      county: true,
      city: true,
      wageMin: true,
      wageMax: true,
      wageUnit: true,
      status: true,
      positionsTotal: true,
      hireCount: true,
      startDate: true,
      applyBy: true,
      publishedAt: true,
      filledAt: true,
      closedAt: true,
      createdAt: true,
    },
  });

  return ok(c, {
    jobs: jobs.map((j) => ({
      id: j.id,
      tenantId: j.tenantId,
      employerId: j.employerId,
      titleEn: j.titleEn,
      county: j.county,
      city: j.city,
      wageMin: Number(j.wageMin),
      wageMax: Number(j.wageMax),
      wageUnit: j.wageUnit,
      status: j.status,
      positionsTotal: j.positionsTotal,
      hireCount: j.hireCount,
      startDate: j.startDate.toISOString().slice(0, 10),
      applyBy: j.applyBy?.toISOString().slice(0, 10) ?? null,
      publishedAt: j.publishedAt?.toISOString() ?? null,
      filledAt: j.filledAt?.toISOString() ?? null,
      closedAt: j.closedAt?.toISOString() ?? null,
      createdAt: j.createdAt.toISOString(),
    })),
  });
});

adminWorkRoutes.get('/jobs/:id', async (c) => {
  const id = c.req.param('id');
  const job = await c.var.db.jobPosting.findUnique({
    where: { id },
    include: {
      tenant: { select: { id: true, name: true } },
      employer: { select: { id: true, legalName: true } },
      screeningQuestions: { orderBy: { sortOrder: 'asc' } },
      renotifications: { orderBy: { id: 'desc' }, take: 50 },
    },
  });
  if (!job) return err(c, 404, 'not_found');

  const applicationCount = await c.var.db.application.count({
    where: { jobId: id, deletedAt: null },
  });

  return ok(c, {
    job: {
      id: job.id,
      tenantId: job.tenantId,
      tenantName: job.tenant.name,
      employerId: job.employer.id,
      employerName: job.employer.legalName,
      titleEn: job.titleEn,
      titleEs: job.titleEs,
      descriptionEn: job.descriptionEn,
      descriptionEs: job.descriptionEs,
      county: job.county,
      city: job.city,
      zipCode: job.zipCode,
      wageMin: Number(job.wageMin),
      wageMax: Number(job.wageMax),
      wageUnit: job.wageUnit,
      skills: job.skills,
      housing: job.housing,
      transport: job.transport,
      positionsTotal: job.positionsTotal,
      hireCount: job.hireCount,
      status: job.status,
      seoSlug: job.seoSlug,
      startDate: job.startDate.toISOString().slice(0, 10),
      endDate: job.endDate?.toISOString().slice(0, 10) ?? null,
      applyBy: job.applyBy?.toISOString().slice(0, 10) ?? null,
      publishedAt: job.publishedAt?.toISOString() ?? null,
      filledAt: job.filledAt?.toISOString() ?? null,
      closedAt: job.closedAt?.toISOString() ?? null,
      createdAt: job.createdAt.toISOString(),
      updatedAt: job.updatedAt.toISOString(),
    },
    applicationCount,
    screeningQuestions: job.screeningQuestions.map((q2) => ({
      id: q2.id,
      sortOrder: q2.sortOrder,
      questionEn: q2.questionEn,
      questionEs: q2.questionEs,
      answerType: q2.answerType,
      required: q2.required,
    })),
    renotifications: job.renotifications.map((r) => ({
      id: r.id,
      channel: r.channel,
      status: r.status,
      sentAt: r.sentAt?.toISOString() ?? null,
      error: r.error,
    })),
  });
});

// ─── applications ───────────────────────────────────────────────────────────

const listAppsQuery = z
  .object({
    search: z.string().min(1).max(200).optional(),
    status: z.enum(['applied', 'reviewed', 'hired', 'rejected', 'withdrawn']).optional(),
    jobId: z.string().uuid().optional(),
    workerId: z.string().optional(),
    tenantId: z.string().uuid().optional(),
    limit: z.coerce.number().int().min(1).max(500).default(100),
  })
  .strict();

adminWorkRoutes.get('/applications', validate('query', listAppsQuery), async (c) => {
  const q = c.var.body;
  const where: Record<string, unknown> = { deletedAt: null };
  if (q.status) where['status'] = q.status;
  if (q.jobId) where['jobId'] = q.jobId;
  if (q.workerId) where['workerId'] = q.workerId;
  if (q.tenantId) where['tenantId'] = q.tenantId;
  if (q.search) {
    where['OR'] = [
      { id: { contains: q.search } },
      { workerId: { contains: q.search } },
      { job: { titleEn: { contains: q.search, mode: 'insensitive' } } },
    ];
  }

  const apps = await c.var.db.application.findMany({
    where,
    orderBy: { appliedAt: 'desc' },
    take: q.limit,
    include: {
      job: { select: { titleEn: true, employerId: true } },
    },
  });

  return ok(c, {
    applications: apps.map((a) => ({
      id: a.id,
      tenantId: a.tenantId,
      jobId: a.jobId,
      jobTitle: a.job.titleEn,
      employerId: a.job.employerId,
      workerId: a.workerId,
      status: a.status,
      wageOffered: a.wageOffered ? Number(a.wageOffered) : null,
      appliedAt: a.appliedAt.toISOString(),
      reviewedAt: a.reviewedAt?.toISOString() ?? null,
      hiredAt: a.hiredAt?.toISOString() ?? null,
      rejectedAt: a.rejectedAt?.toISOString() ?? null,
      countyAtApply: a.countyAtApply,
    })),
  });
});

adminWorkRoutes.get('/applications/:id', async (c) => {
  const id = c.req.param('id');
  const app = await c.var.db.application.findUnique({
    where: { id },
    include: {
      job: { select: { id: true, titleEn: true, employerId: true } },
      worker: {
        select: {
          id: true,
          email: true,
          phone: true,
          preferredLang: true,
          workerProfile: { select: { firstName: true, lastName: true, county: true } },
        },
      },
      events: { orderBy: { createdAt: 'desc' }, take: 100 },
      screeningAnswers: {
        include: { question: true },
      },
    },
  });
  if (!app) return err(c, 404, 'not_found');

  return ok(c, {
    application: {
      id: app.id,
      tenantId: app.tenantId,
      jobId: app.jobId,
      jobTitle: app.job.titleEn,
      employerId: app.job.employerId,
      workerId: app.workerId,
      workerName: app.worker.workerProfile
        ? `${app.worker.workerProfile.firstName} ${app.worker.workerProfile.lastName}`
        : null,
      workerEmail: app.worker.email,
      workerPhone: app.worker.phone,
      workerLang: app.worker.preferredLang,
      workerCounty: app.worker.workerProfile?.county ?? null,
      status: app.status,
      wageOffered: app.wageOffered ? Number(app.wageOffered) : null,
      countyAtApply: app.countyAtApply,
      skillsAtApply: app.skillsAtApply,
      workerNote: app.workerNote,
      employerNote: app.employerNote,
      rejectionReason: app.rejectionReason,
      rejectionReasonText: app.rejectionReasonText,
      appliedAt: app.appliedAt.toISOString(),
      reviewedAt: app.reviewedAt?.toISOString() ?? null,
      hiredAt: app.hiredAt?.toISOString() ?? null,
      rejectedAt: app.rejectedAt?.toISOString() ?? null,
      withdrawnAt: app.withdrawnAt?.toISOString() ?? null,
      startDate: app.startDate?.toISOString().slice(0, 10) ?? null,
    },
    events: app.events.map((e) => ({
      id: e.id,
      fromStatus: e.fromStatus,
      toStatus: e.toStatus,
      actorUserId: e.actorUserId,
      actorRole: e.actorRole,
      metadata: e.metadata,
      createdAt: e.createdAt.toISOString(),
    })),
    screeningAnswers: app.screeningAnswers.map((sa) => ({
      id: sa.id,
      questionEn: sa.question.questionEn,
      answerType: sa.question.answerType,
      answerYes: sa.answerYes,
      answerText: sa.answerText,
      answeredAt: sa.answeredAt.toISOString(),
    })),
  });
});

// ─── enrollments ────────────────────────────────────────────────────────────

const listEnrollmentsQuery = z
  .object({
    search: z.string().min(1).max(200).optional(),
    status: z.enum(['enrolled', 'completed', 'dropped']).optional(),
    programId: z.string().uuid().optional(),
    workerId: z.string().optional(),
    tenantId: z.string().uuid().optional(),
    limit: z.coerce.number().int().min(1).max(500).default(100),
  })
  .strict();

adminWorkRoutes.get('/enrollments', validate('query', listEnrollmentsQuery), async (c) => {
  const q = c.var.body;
  const where: Record<string, unknown> = { deletedAt: null };
  if (q.status) where['status'] = q.status;
  if (q.programId) where['programId'] = q.programId;
  if (q.workerId) where['workerId'] = q.workerId;
  if (q.tenantId) where['tenantId'] = q.tenantId;
  if (q.search) {
    where['OR'] = [
      { id: { contains: q.search } },
      { workerId: { contains: q.search } },
      { program: { titleEn: { contains: q.search, mode: 'insensitive' } } },
    ];
  }

  const rows = await c.var.db.enrollment.findMany({
    where,
    orderBy: { enrolledAt: 'desc' },
    take: q.limit,
    include: {
      program: { select: { titleEn: true, funder: true, county: true } },
    },
  });

  return ok(c, {
    enrollments: rows.map((e) => ({
      id: e.id,
      tenantId: e.tenantId,
      programId: e.programId,
      programTitle: e.program.titleEn,
      funder: e.program.funder,
      county: e.program.county,
      workerId: e.workerId,
      status: e.status,
      enrolledAt: e.enrolledAt.toISOString(),
      completedAt: e.completedAt?.toISOString() ?? null,
      droppedAt: e.droppedAt?.toISOString() ?? null,
      noShow: e.noShow,
      certIssued: e.certificateId !== null,
      certificateId: e.certificateId,
    })),
  });
});

adminWorkRoutes.get('/enrollments/:id', async (c) => {
  const id = c.req.param('id');
  const e = await c.var.db.enrollment.findUnique({
    where: { id },
    include: {
      program: true,
      worker: {
        include: {
          workerProfile: { select: { firstName: true, lastName: true, county: true } },
        },
      },
    },
  });
  if (!e) return err(c, 404, 'not_found');

  return ok(c, {
    enrollment: {
      id: e.id,
      tenantId: e.tenantId,
      status: e.status,
      enrolledAt: e.enrolledAt.toISOString(),
      completedAt: e.completedAt?.toISOString() ?? null,
      droppedAt: e.droppedAt?.toISOString() ?? null,
      noShow: e.noShow,
      certUrl: e.certUrl,
      certGeneratedAt: e.certGeneratedAt?.toISOString() ?? null,
      certificateId: e.certificateId,
      reminderSent48h: e.reminderSent48h,
      reminderSent2h: e.reminderSent2h,
    },
    program: {
      id: e.program.id,
      titleEn: e.program.titleEn,
      funder: e.program.funder,
      county: e.program.county,
      locationName: e.program.locationName,
      startDate: e.program.startDate.toISOString().slice(0, 10),
      endDate: e.program.endDate.toISOString().slice(0, 10),
      certName: e.program.certName,
    },
    worker: {
      id: e.worker.id,
      email: e.worker.email,
      phone: e.worker.phone,
      preferredLang: e.worker.preferredLang,
      firstName: e.worker.workerProfile?.firstName ?? null,
      lastName: e.worker.workerProfile?.lastName ?? null,
      county: e.worker.workerProfile?.county ?? null,
    },
  });
});

// ─── compliance ─────────────────────────────────────────────────────────────

const listComplianceQuery = z
  .object({
    search: z.string().min(1).max(200).optional(),
    status: z.enum(['ok', 'warn', 'fail']).optional(),
    category: z.string().max(100).optional(),
    employerId: z.string().uuid().optional(),
    tenantId: z.string().uuid().optional(),
    limit: z.coerce.number().int().min(1).max(500).default(100),
  })
  .strict();

adminWorkRoutes.get(
  '/compliance/items',
  validate('query', listComplianceQuery),
  async (c) => {
    const q = c.var.body;
    const where: Record<string, unknown> = {};
    if (q.status) where['status'] = q.status;
    if (q.category) where['category'] = q.category;
    if (q.employerId) where['employerId'] = q.employerId;
    if (q.tenantId) where['tenantId'] = q.tenantId;
    if (q.search) {
      where['OR'] = [
        { label: { contains: q.search, mode: 'insensitive' } },
        { itemKey: { contains: q.search } },
        { details: { contains: q.search, mode: 'insensitive' } },
      ];
    }

    const items = await c.var.db.complianceItem.findMany({
      where,
      orderBy: [{ status: 'desc' }, { dueAt: 'asc' }],
      take: q.limit,
    });

    return ok(c, {
      items: items.map((i) => ({
        id: i.id,
        tenantId: i.tenantId,
        employerId: i.employerId,
        category: i.category,
        itemKey: i.itemKey,
        label: i.label,
        status: i.status,
        details: i.details,
        evidenceUrl: i.evidenceUrl,
        dueAt: i.dueAt?.toISOString() ?? null,
        resolvedAt: i.resolvedAt?.toISOString() ?? null,
      })),
    });
  },
);

adminWorkRoutes.get('/compliance/scoreboard', async (c) => {
  const yesterday = new Date(Date.now() - 86_400_000);
  const snapshots = await c.var.db.complianceScoreSnapshot.findMany({
    orderBy: [{ snapshotDate: 'desc' }],
    take: 200,
  });

  const latestByEmployer = new Map<string, (typeof snapshots)[number]>();
  for (const s of snapshots) {
    if (!latestByEmployer.has(s.employerProfileId)) {
      latestByEmployer.set(s.employerProfileId, s);
    }
  }

  const employerIds = Array.from(latestByEmployer.keys());
  const employers = employerIds.length
    ? await c.var.db.employerProfile.findMany({
        where: { id: { in: employerIds } },
        select: { id: true, legalName: true, tenantId: true },
      })
    : [];
  const empMap = new Map(employers.map((e) => [e.id, e]));

  return ok(c, {
    asOf: yesterday.toISOString().slice(0, 10),
    rows: Array.from(latestByEmployer.values())
      .map((s) => {
        const emp = empMap.get(s.employerProfileId);
        return {
          employerId: s.employerProfileId,
          employerName: emp?.legalName ?? '—',
          tenantId: emp?.tenantId ?? s.tenantId,
          snapshotDate: s.snapshotDate.toISOString().slice(0, 10),
          score: s.score,
          okCount: s.okCount,
          warnCount: s.warnCount,
          failCount: s.failCount,
        };
      })
      .sort((a, b) => a.score - b.score),
  });
});
