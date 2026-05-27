import { Hono } from 'hono';
import { ok, err, validate } from '@agconn/api-client/server';
import {
    County,
    EnrollmentStatus,
    Funder,
    ProgramStatus,
    type Tx,
} from '@agconn/db';
import {
    BulkUpdateEnrollmentsBody,
    CancelProgramBody,
    CreateProgramBody,
    TrainingQuery,
    UpdateEnrollmentBody,
    UpdateProgramBody,
} from '@agconn/schemas';
import { enqueueSms } from '@agconn/sms';
import { requireAuth, requireRole, type AuthVars } from '../middleware/authContext.js';
import type { AuditCtxVars } from '../middleware/audit.js';

// Worker-facing training browse/enroll routes.
export const trainingRoutes = new Hono<{ Variables: AuthVars & AuditCtxVars }>();

trainingRoutes.use('*', requireAuth('training'));

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

    const limit = q.limit;
    const cursor = q.cursor ? decodeCursor(q.cursor) : null;
    const counties = q.county?.length ? (q.county as County[]) : null;
    const funders = q.funder?.length ? (q.funder as Funder[]) : null;

    const where = {
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
    const slug = c.req.param('slug');
    const program = await c.var.db.trainingProgram.findFirst({
        where: { seoSlug: slug, deletedAt: null },
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

    const profile = await c.var.db.workerProfile.findUnique({ where: { id: userId } });
    if (!profile?.onboardedAt) return err(c, 403, 'forbidden', 'not_onboarded');

    const programId = c.req.param('id');

    const program = await c.var.db.trainingProgram.findFirst({
        where: { id: programId, deletedAt: null },
    });
    if (!program) return err(c, 404, 'not_found', 'program_not_found');
    const tenantId = program.tenantId;
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

    try {
        await enqueueSms({
            tenantId,
            userId,
            template: 'training.enrolled',
            vars: {
                programTitle: program.titleEn,
                startDate: program.startDate.toISOString().slice(0, 10),
                location: program.locationName ?? `${program.county} County`,
            },
        });
        // Schedule the 48h reminder. The 2h reminder is fired by the scheduler
        // cron, which scans enrollments and computes the trigger time off the
        // program's session schedule rather than the bulk start date.
        const reminder48h = new Date(program.startDate.getTime() - 48 * 60 * 60 * 1000);
        if (reminder48h.getTime() > Date.now()) {
            await enqueueSms({
                tenantId,
                userId,
                template: 'training.reminder.48h',
                vars: {
                    programTitle: program.titleEn,
                    startDate: program.startDate.toISOString().slice(0, 10),
                    startTime:
                        (Array.isArray(program.sessionTimes) && program.sessionTimes[0]
                            ? String((program.sessionTimes[0] as { startTime?: string }).startTime ?? '')
                            : '') || '9:00 AM',
                    location: program.locationName ?? `${program.county} County`,
                },
                scheduledFor: reminder48h.toISOString(),
                jobKey: `training.reminder.48h-${enrollment.id}`,
            });
        }
    } catch (e) {
        console.error('[training] enroll SMS enqueue failed', {
            enrollmentId: enrollment.id,
            err: e instanceof Error ? e.message : String(e),
        });
    }

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

    try {
        const program = await c.var.db.trainingProgram.findUnique({ where: { id: programId } });
        if (program) {
            await enqueueSms({
                tenantId: program.tenantId,
                userId,
                template: 'training.unenrolled',
                vars: { programTitle: program.titleEn },
            });
        }
    } catch (e) {
        console.error('[training] unenroll SMS enqueue failed', {
            enrollmentId: enrollment.id,
            err: e instanceof Error ? e.message : String(e),
        });
    }

    return ok(c, { ok: true });
});

// Worker enrollments list (under /v1/me/enrollments — mounted separately).
export const enrollmentsRoutes = new Hono<{ Variables: AuthVars & AuditCtxVars }>();
enrollmentsRoutes.use('*', requireAuth('training'));
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
orgTrainingRoutes.use('*', requireAuth('training'));
orgTrainingRoutes.use('*', requireRole('training_org'));

orgTrainingRoutes.get('/training', async (c) => {
    const tenantId = c.var.tenantId;
    if (!tenantId) return err(c, 403, 'no_tenant');
    const rows = await c.var.db.trainingProgram.findMany({
        where: { tenantId, orgId: c.var.userId, deletedAt: null },
        orderBy: [{ startDate: 'desc' }, { id: 'desc' }],
        take: 100,
    });
    return ok(c, { programs: rows.map(shapeProgramCard) });
});

orgTrainingRoutes.get('/training/:id', async (c) => {
    const id = c.req.param('id');
    const program = await c.var.db.trainingProgram.findFirst({
        where: { id, orgId: c.var.userId, deletedAt: null },
    });
    if (!program) return err(c, 404, 'not_found');
    return ok(c, {
        program: {
            ...shapeProgramCard(program),
            descriptionEn: program.descriptionEn,
            descriptionEs: program.descriptionEs,
            locationName: program.locationName,
            locationAddress: program.locationAddress,
            sessionTimes: program.sessionTimes,
        },
    });
});

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

orgTrainingRoutes.patch(
    '/training/:id',
    validate('json', UpdateProgramBody),
    async (c) => {
        const id = c.req.param('id');
        const body = c.var.body;
        const program = await c.var.db.trainingProgram.findFirst({
            where: { id, orgId: c.var.userId, deletedAt: null },
        });
        if (!program) return err(c, 404, 'not_found');
        if (
            program.status === ProgramStatus.canceled ||
            program.status === ProgramStatus.closed
        ) {
            return err(c, 422, 'validation_failed', 'program_not_editable');
        }

        const data: Record<string, unknown> = {};
        const fields: string[] = [];
        if (body.descriptionEn !== undefined) {
            data.descriptionEn = body.descriptionEn;
            fields.push('descriptionEn');
        }
        if (body.descriptionEs !== undefined) {
            data.descriptionEs = body.descriptionEs;
            fields.push('descriptionEs');
        }
        if (body.sessionTimes !== undefined) {
            data.sessionTimes = body.sessionTimes as object;
            fields.push('sessionTimes');
        }
        if (body.locationName !== undefined) {
            data.locationName = body.locationName;
            fields.push('locationName');
        }
        if (body.locationAddress !== undefined) {
            data.locationAddress = body.locationAddress;
            fields.push('locationAddress');
        }

        const updated = await c.var.db.trainingProgram.update({
            where: { id },
            data: data as never,
        });

        await c.var.audit.log({
            action: 'training.program.updated',
            resourceId: id,
            metadata: { programId: id, fields },
        });

        return ok(c, shapeProgramCard(updated));
    },
);

orgTrainingRoutes.post(
    '/training/:id/cancel',
    validate('json', CancelProgramBody),
    async (c) => {
        const id = c.req.param('id');
        const body = c.var.body;
        const program = await c.var.db.trainingProgram.findFirst({
            where: { id, orgId: c.var.userId, deletedAt: null },
        });
        if (!program) return err(c, 404, 'not_found');
        if (program.status === ProgramStatus.canceled) {
            return err(c, 422, 'validation_failed', 'program_already_canceled');
        }

        const enrolled = await c.var.db.enrollment.findMany({
            where: {
                programId: id,
                status: EnrollmentStatus.enrolled,
                deletedAt: null,
            },
            select: { id: true, workerId: true, tenantId: true },
        });

        await c.var.db.trainingProgram.update({
            where: { id },
            data: { status: ProgramStatus.canceled },
        });

        await c.var.audit.log({
            action: 'training.program.canceled',
            resourceId: id,
            metadata: {
                programId: id,
                enrolledCount: enrolled.length,
                reason: body.reason ?? '',
            },
        });

        const startDate = program.startDate.toISOString().slice(0, 10);
        for (const e of enrolled) {
            try {
                await enqueueSms({
                    tenantId: e.tenantId,
                    userId: e.workerId,
                    template: 'training.canceled',
                    vars: { programTitle: program.titleEn, startDate },
                    jobKey: `training.canceled-${id}-${e.workerId}`,
                });
            } catch (smsErr) {
                console.error('[training] cancel broadcast SMS enqueue failed', {
                    programId: id,
                    workerId: e.workerId,
                    err: smsErr instanceof Error ? smsErr.message : String(smsErr),
                });
            }
        }

        return ok(c, { ok: true, notified: enrolled.length });
    },
);

orgTrainingRoutes.patch(
    '/training/:id/enrollments',
    validate('json', BulkUpdateEnrollmentsBody),
    async (c) => {
        const id = c.req.param('id');
        const body = c.var.body;
        const program = await c.var.db.trainingProgram.findFirst({
            where: { id, orgId: c.var.userId, deletedAt: null },
        });
        if (!program) return err(c, 404, 'not_found');

        const enrollments = await c.var.db.enrollment.findMany({
            where: {
                id: { in: body.enrollmentIds },
                programId: id,
                deletedAt: null,
            },
            select: { id: true },
        });
        if (enrollments.length !== body.enrollmentIds.length) {
            return err(c, 422, 'validation_failed', 'unknown_enrollments');
        }

        const targetStatus =
            body.status === 'completed'
                ? EnrollmentStatus.completed
                : EnrollmentStatus.dropped;
        const stampField = body.status === 'completed' ? 'completedAt' : 'droppedAt';

        await c.var.db.enrollment.updateMany({
            where: { id: { in: body.enrollmentIds } },
            data: {
                status: targetStatus,
                [stampField]: new Date(),
                ...(body.noShow !== undefined ? { noShow: body.noShow } : {}),
            } as never,
        });

        await c.var.audit.log({
            action: 'training.enrollments.bulk_updated',
            resourceId: id,
            metadata: {
                programId: id,
                enrollmentIds: body.enrollmentIds,
                status: body.status,
                noShow: body.noShow ?? false,
            },
        });

        return ok(c, { ok: true, updated: enrollments.length });
    },
);

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

            // Hand off to services/cert-generator. The placeholder certificateId
            // stamped above is replaced when the cert PDF lands and the row gets
            // certUrl + a freshly minted cert id.
            try {
                const { getCertGeneratorBoss, CERT_GENERATOR_QUEUE } = await import(
                    './cert-queue.js'
                );
                const boss = await getCertGeneratorBoss();
                await boss.send(
                    CERT_GENERATOR_QUEUE,
                    { enrollmentId: updated.id, tenantId: enrollment.tenantId },
                    {
                        singletonKey: `enrollment.completed-${updated.id}`,
                        singletonSeconds: 60 * 60,
                    },
                );
            } catch (e) {
                console.error('[training] cert generator enqueue failed', {
                    enrollmentId: updated.id,
                    err: e instanceof Error ? e.message : String(e),
                });
            }
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
