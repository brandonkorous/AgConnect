import { Hono } from 'hono';
import { ok, err, validate } from '@agconn/api-client/server';
import {
  County,
  EnrollmentStatus,
  Funder,
  ProgramStatus,
  type Tx,
} from '@agconn/db';
import { CreateProgramBody, TrainingQuery, UpdateEnrollmentBody } from '@agconn/schemas';
import { requireAuth, requireRole, type AuthVars } from '../middleware/authContext';
import type { AuditCtxVars } from '../middleware/audit';

// Worker-facing training browse/enroll routes.
export const trainingRoutes = new Hono<{ Variables: AuthVars & AuditCtxVars }>();

trainingRoutes.use('*', requireAuth);

function decodeCursor(s: string): { startDate: Date; id: string } | null {
  try {
    const decoded = Buffer.from(s, 'base64url').toString('utf8');
    const [iso, id] = decoded.split('|');
    if (!iso || !id) return null;
    return { startDate: new Date(iso), id };
  } catch {
    return null;
  }
}

function encodeCursor(cur: { startDate: Date; id: string }): string {
  return Buffer.from(`${cur.startDate.toISOString()}|${cur.id}`).toString('base64url');
}

trainingRoutes.get('/', validate('query', TrainingQuery), async (c) => {
  const q = c.var.body;
  const tenantId = c.var.tenantId;
  if (!tenantId) return err(c, 403, 'no_tenant');

  const limit = q.limit;
  const cursor = q.cursor ? decodeCursor(q.cursor) : null;
  const counties = q.county?.length ? (q.county as County[]) : null;
  const funders = q.funder?.length ? (q.funder as Funder[]) : null;

  const where = {
    tenantId,
    deletedAt: null,
    status: q.hasCapacity
      ? { in: [ProgramStatus.active] }
      : { in: [ProgramStatus.active, ProgramStatus.full] },
    ...(counties ? { county: { in: counties } } : {}),
    ...(funders ? { funder: { in: funders } } : {}),
    ...(q.topics?.length ? { topics: { hasSome: q.topics } } : {}),
    ...(q.startBefore ? { startDate: { lte: new Date(q.startBefore) } } : {}),
    ...(q.startAfter ? { startDate: { gte: new Date(q.startAfter) } } : {}),
    ...(q.q
      ? {
          OR: [
            { titleEn: { contains: q.q, mode: 'insensitive' as const } },
            { titleEs: { contains: q.q, mode: 'insensitive' as const } },
          ],
        }
      : {}),
    ...(cursor
      ? {
          OR: [
            { startDate: { gt: cursor.startDate } },
            { startDate: cursor.startDate, id: { gt: cursor.id } },
          ],
        }
      : {}),
  };

  const rows = await c.var.db.trainingProgram.findMany({
    where,
    orderBy: [{ startDate: 'asc' }, { id: 'asc' }],
    take: limit + 1,
  });

  const slice = rows.slice(0, limit);
  const hasMore = rows.length > limit;
  const last = slice[slice.length - 1];
  const nextCursor =
    hasMore && last ? encodeCursor({ startDate: last.startDate, id: last.id }) : null;

  return ok(c, {
    programs: slice.map(shapeProgramCard),
    nextCursor,
  });
});

trainingRoutes.get('/:slug', async (c) => {
  const tenantId = c.var.tenantId;
  if (!tenantId) return err(c, 403, 'no_tenant');
  const slug = c.req.param('slug');
  const program = await c.var.db.trainingProgram.findFirst({
    where: { tenantId, seoSlug: slug, deletedAt: null },
    include: { org: true },
  });
  if (!program) return err(c, 404, 'not_found');

  const enrollment = await c.var.db.enrollment.findFirst({
    where: { programId: program.id, workerId: c.var.userId, deletedAt: null },
  });

  return ok(c, {
    program: {
      ...shapeProgramCard(program),
      descriptionEn: program.descriptionEn,
      descriptionEs: program.descriptionEs,
      locationName: program.locationName,
      locationAddress: program.locationAddress,
      sessionTimes: program.sessionTimes,
      orgName: program.org?.email ?? 'Training organization',
      orgEmail: program.org?.email ?? null,
    },
    enrollment: enrollment ? shapeEnrollment(enrollment) : null,
    spotsLeft: Math.max(0, program.capacity - program.enrolledCount),
  });
});

trainingRoutes.post('/:id/enroll', requireRole('worker'), async (c) => {
  const userId = c.var.userId;
  const tenantId = c.var.tenantId;
  if (!tenantId) return err(c, 403, 'no_tenant');

  const profile = await c.var.db.workerProfile.findUnique({ where: { id: userId } });
  if (!profile?.onboardedAt) return err(c, 403, 'forbidden', 'not_onboarded');

  const programId = c.req.param('id');

  const program = await c.var.db.trainingProgram.findFirst({
    where: { id: programId, tenantId, deletedAt: null },
  });
  if (!program) return err(c, 404, 'not_found', 'program_not_found');
  if (program.status !== ProgramStatus.active) {
    return err(c, 422, 'validation_failed', 'program_not_active');
  }

  const dup = await c.var.db.enrollment.findFirst({
    where: { programId, workerId: userId, deletedAt: null },
  });
  if (dup) return err(c, 409, 'conflict', 'already_enrolled');

  // Atomic capacity check + decrement.
  const updateResult = await c.var.db.$executeRaw`
    UPDATE "training_programs"
    SET "enrolled_count" = "enrolled_count" + 1,
        "status" = CASE WHEN "enrolled_count" + 1 >= "capacity" THEN 'full'::"ProgramStatus" ELSE "status" END,
        "updated_at" = NOW()
    WHERE "id" = ${programId}::uuid
      AND "enrolled_count" < "capacity"
      AND "status" = 'active'`;

  if (updateResult === 0) {
    return err(c, 409, 'conflict', 'program_full');
  }

  const enrollment = await c.var.db.enrollment.create({
    data: {
      tenantId,
      programId,
      workerId: userId,
      status: EnrollmentStatus.enrolled,
    },
  });

  await c.var.audit.log({
    action: 'training.enrollment.created',
    resourceId: enrollment.id,
    metadata: { programId, workerId: userId },
  });

  // TODO: enqueue SMS + email (`training.enrolled`).

  const refreshed = await c.var.db.trainingProgram.findUnique({ where: { id: programId } });
  return ok(c, {
    enrollment: shapeEnrollment(enrollment),
    program: refreshed ? shapeProgramCard(refreshed) : null,
  });
});

trainingRoutes.post('/:id/unenroll', requireRole('worker'), async (c) => {
  const userId = c.var.userId;
  const programId = c.req.param('id');

  const enrollment = await c.var.db.enrollment.findFirst({
    where: { programId, workerId: userId, deletedAt: null },
  });
  if (!enrollment) return err(c, 404, 'not_found');
  if (enrollment.status !== EnrollmentStatus.enrolled) {
    return err(c, 422, 'validation_failed', 'cannot_unenroll_at_status');
  }

  await c.var.db.enrollment.update({
    where: { id: enrollment.id },
    data: { status: EnrollmentStatus.dropped, droppedAt: new Date() },
  });

  await c.var.db.$executeRaw`
    UPDATE "training_programs"
    SET "enrolled_count" = GREATEST("enrolled_count" - 1, 0),
        "status" = CASE WHEN "status" = 'full' THEN 'active'::"ProgramStatus" ELSE "status" END,
        "updated_at" = NOW()
    WHERE "id" = ${programId}::uuid`;

  await c.var.audit.log({
    action: 'training.enrollment.created',
    resourceId: enrollment.id,
    metadata: { programId, workerId: userId },
  });

  return ok(c, { ok: true });
});

// Worker enrollments list (under /v1/me/enrollments — mounted separately).
export const enrollmentsRoutes = new Hono<{ Variables: AuthVars & AuditCtxVars }>();
enrollmentsRoutes.use('*', requireAuth);
enrollmentsRoutes.use('*', requireRole('worker'));

enrollmentsRoutes.get('/', async (c) => {
  const userId = c.var.userId;
  const status = c.req.query('status') as 'upcoming' | 'completed' | 'dropped' | undefined;

  const now = new Date();
  let where: Record<string, unknown>;
  if (status === 'upcoming') {
    where = {
      workerId: userId,
      status: EnrollmentStatus.enrolled,
      deletedAt: null,
      program: { startDate: { gte: now } },
    };
  } else if (status === 'completed') {
    where = { workerId: userId, status: EnrollmentStatus.completed, deletedAt: null };
  } else if (status === 'dropped') {
    where = { workerId: userId, status: EnrollmentStatus.dropped, deletedAt: null };
  } else {
    where = { workerId: userId, deletedAt: null };
  }

  const rows = await c.var.db.enrollment.findMany({
    where: where as never,
    orderBy: { enrolledAt: 'desc' },
    include: { program: true },
  });

  return ok(c, {
    enrollments: rows.map((e) => ({
      ...shapeEnrollment(e),
      program: shapeProgramCard(e.program),
    })),
  });
});

// Org-side: create program + manage roster + mark completion.
export const orgTrainingRoutes = new Hono<{ Variables: AuthVars & AuditCtxVars }>();
orgTrainingRoutes.use('*', requireAuth);
orgTrainingRoutes.use('*', requireRole('training_org'));

orgTrainingRoutes.post('/training', validate('json', CreateProgramBody), async (c) => {
  const tenantId = c.var.tenantId;
  if (!tenantId) return err(c, 403, 'no_tenant');
  const body = c.var.body;
  const slug = `${slugify(body.titleEn)}-${randomSuffix()}`;

  const program = await c.var.db.trainingProgram.create({
    data: {
      tenantId,
      orgId: c.var.userId,
      titleEn: body.titleEn,
      titleEs: body.titleEs,
      summaryEn: body.summaryEn ?? null,
      summaryEs: body.summaryEs ?? null,
      descriptionEn: body.descriptionEn,
      descriptionEs: body.descriptionEs,
      funder: body.funder as Funder,
      county: body.county as County,
      locationName: body.locationName,
      locationAddress: body.locationAddress,
      capacity: body.capacity,
      startDate: new Date(body.startDate),
      endDate: new Date(body.endDate),
      sessionTimes: body.sessionTimes as object,
      topics: body.topics,
      certName: body.certName ?? null,
      seoSlug: slug,
      status: ProgramStatus.draft,
    },
  });

  await c.var.audit.log({
    action: 'training.enrollment.created',
    resourceId: program.id,
    metadata: { programId: program.id, workerId: 'system_create' },
  });

  return ok(c, shapeProgramCard(program));
});

orgTrainingRoutes.post('/training/:id/publish', async (c) => {
  const id = c.req.param('id');
  const program = await c.var.db.trainingProgram.findFirst({
    where: { id, orgId: c.var.userId, deletedAt: null },
  });
  if (!program) return err(c, 404, 'not_found');
  if (program.status !== ProgramStatus.draft) {
    return err(c, 422, 'validation_failed', 'program_not_draft');
  }
  const updated = await c.var.db.trainingProgram.update({
    where: { id },
    data: { status: ProgramStatus.active },
  });
  return ok(c, shapeProgramCard(updated));
});

orgTrainingRoutes.get('/training/:id/roster', async (c) => {
  const id = c.req.param('id');
  const program = await c.var.db.trainingProgram.findFirst({
    where: { id, orgId: c.var.userId, deletedAt: null },
  });
  if (!program) return err(c, 404, 'not_found');
  const rows = await c.var.db.enrollment.findMany({
    where: { programId: id, deletedAt: null },
    include: { worker: { include: { workerProfile: true } } },
    orderBy: { enrolledAt: 'asc' },
  });
  return ok(c, {
    enrollments: rows.map((e) => ({
      ...shapeEnrollment(e),
      workerName: e.worker.workerProfile
        ? `${e.worker.workerProfile.firstName} ${e.worker.workerProfile.lastName}`.trim()
        : 'Worker',
      workerPhone: e.worker.phone ?? null,
      workerEmail: e.worker.email ?? null,
    })),
  });
});

orgTrainingRoutes.patch(
  '/enrollments/:id',
  validate('json', UpdateEnrollmentBody),
  async (c) => {
    const id = c.req.param('id');
    const body = c.var.body;
    const enrollment = await c.var.db.enrollment.findFirst({
      where: { id, deletedAt: null },
      include: { program: true },
    });
    if (!enrollment || enrollment.program.orgId !== c.var.userId) {
      return err(c, 404, 'not_found');
    }

    const data: Record<string, unknown> = {
      noShow: body.noShow ?? undefined,
    };
    if (body.status === 'completed') {
      data.status = EnrollmentStatus.completed;
      data.completedAt = new Date();
      // TODO: enqueue cert generation; for now stamp a placeholder certificateId
      // so the wallet can render an entry until 08-certificate-generation lands.
      data.certificateId = `AC-${new Date().getFullYear()}-${randomSuffix(7)}`;
    } else if (body.status === 'dropped') {
      data.status = EnrollmentStatus.dropped;
      data.droppedAt = new Date();
    }

    const updated = await c.var.db.enrollment.update({
      where: { id },
      data: data as never,
    });

    if (body.status === 'completed') {
      await c.var.audit.log({
        action: 'training.completion.recorded',
        resourceId: updated.id,
        metadata: {
          programId: enrollment.programId,
          workerId: enrollment.workerId,
          hoursCompleted: 0,
        },
      });
    }

    return ok(c, shapeEnrollment(updated));
  },
);

// Helpers ------------------------------------------------------------------

function shapeProgramCard(p: {
  id: string;
  seoSlug: string;
  titleEn: string;
  titleEs: string;
  summaryEn: string | null;
  summaryEs: string | null;
  funder: Funder;
  county: County;
  capacity: number;
  enrolledCount: number;
  startDate: Date;
  endDate: Date;
  topics: string[];
  status: ProgramStatus;
  certName: string | null;
}) {
  return {
    id: p.id,
    seoSlug: p.seoSlug,
    titleEn: p.titleEn,
    titleEs: p.titleEs,
    summaryEn: p.summaryEn,
    summaryEs: p.summaryEs,
    funder: p.funder,
    county: p.county,
    capacity: p.capacity,
    enrolledCount: p.enrolledCount,
    startDate: p.startDate.toISOString(),
    endDate: p.endDate.toISOString(),
    topics: p.topics,
    status: p.status,
    certName: p.certName,
  };
}

function shapeEnrollment(e: {
  id: string;
  programId: string;
  status: EnrollmentStatus;
  enrolledAt: Date;
  completedAt: Date | null;
  droppedAt: Date | null;
  certUrl: string | null;
  certificateId: string | null;
  noShow: boolean;
}) {
  return {
    id: e.id,
    programId: e.programId,
    status: e.status,
    enrolledAt: e.enrolledAt.toISOString(),
    completedAt: e.completedAt?.toISOString() ?? null,
    droppedAt: e.droppedAt?.toISOString() ?? null,
    certUrl: e.certUrl,
    certificateId: e.certificateId,
    noShow: e.noShow,
  };
}

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 60);
}

function randomSuffix(len = 6): string {
  return Math.random().toString(36).slice(2, 2 + len).toUpperCase();
}

export type _Tx = Tx;
