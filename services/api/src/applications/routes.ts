import { Hono } from 'hono';
import { z } from 'zod';
import { ok, err, validate } from '@agconn/api-client/server';
import { AppStatus, JobStatus, UserRole, type Tx } from '@agconn/db';
import { ApplicationsQuery } from '@agconn/schemas';
import { enqueueSms } from '@agconn/sms';
import { requireAuth, requireRole, type AuthVars } from '../middleware/authContext.js';
import type { AuditCtxVars } from '../middleware/audit.js';

export const applicationsRoutes = new Hono<{ Variables: AuthVars & AuditCtxVars }>();

applicationsRoutes.use('*', requireAuth('applications'));
applicationsRoutes.use('*', requireRole('worker'));

// Worker apply — POST /v1/jobs/:jobId/apply (mounted under /v1/jobs but
// scoped to worker role and lives in this domain).
export const jobApplyRoute = new Hono<{ Variables: AuthVars & AuditCtxVars }>();
jobApplyRoute.use('*', requireAuth('applications'));
jobApplyRoute.use('*', requireRole('worker'));

jobApplyRoute.post('/:jobId/apply', async (c) => {
    const userId = c.var.userId;
    const jobId = c.req.param('jobId');

    const job = await c.var.db.jobPosting.findFirst({
        where: { id: jobId, deletedAt: null },
    });
    if (!job) return err(c, 404, 'not_found', 'job_not_found');
    if (job.status !== JobStatus.active) {
        return err(c, 422, 'validation_failed', 'job_not_active');
    }

    const tenantId = job.tenantId;

    // Workers can apply with whatever profile data they've already shared. We
    // never gate on onboardedAt — the audience is farmworkers who often arrive
    // via SMS OTP with only a verified phone, and the dignified default is to
    // let them express interest immediately. The employer's applicant card
    // surfaces missing fields; that's the right place to nudge, not here.
    // Auto-create a stub worker_profile if one doesn't exist so the FK and the
    // skills/county snapshots have somewhere to land.
    let profile = await c.var.db.workerProfile.findUnique({ where: { id: userId } });
    if (!profile) {
        let firstName = '';
        let lastName = '';
        try {
            const cu = await c.get('clerk').users.getUser(userId);
            firstName = cu.firstName ?? '';
            lastName = cu.lastName ?? '';
        } catch {
            /* Clerk lookup is best-effort — proceed with empty names. */
        }
        profile = await c.var.db.workerProfile.create({
            data: {
                id: userId,
                firstName,
                lastName,
            },
        });
    }

    const existing = await c.var.db.application.findFirst({
        where: { jobId, workerId: userId, deletedAt: null },
    });
    if (existing) return err(c, 409, 'conflict', 'already_applied');

    const created = await c.var.db.application.create({
        data: {
            tenantId,
            jobId,
            workerId: userId,
            status: AppStatus.applied,
            countyAtApply: profile.county,
            skillsAtApply: profile.skills,
        },
    });
    await c.var.db.applicationEvent.create({
        data: {
            tenantId,
            applicationId: created.id,
            fromStatus: null,
            toStatus: AppStatus.applied,
            actorUserId: userId,
            actorRole: UserRole.worker,
            metadata: {},
        },
    });

    await c.var.audit.log({
        action: 'worker.application.submitted',
        resourceId: created.id,
        metadata: { jobId, employerId: job.employerId },
    });

    try {
        const employerProfile = await c.var.db.employerProfile.findUnique({
            where: { userId: job.employerId },
        });
        await enqueueSms({
            tenantId,
            userId,
            template: 'application.applied',
            vars: {
                jobTitle: job.titleEn,
                employer: employerProfile?.legalName ?? 'AGCONN employer',
            },
        });
    } catch (e) {
        console.error('[applications] application.applied SMS enqueue failed', {
            applicationId: created.id,
            err: e instanceof Error ? e.message : String(e),
        });
    }

    return ok(c, { application: shapeApplication(created) });
});

applicationsRoutes.get('/', validate('query', ApplicationsQuery), async (c) => {
    const q = c.var.body;
    const limit = q.limit;
    const cursor = q.cursor ? decodeCursor(q.cursor) : null;

    let statusFilter: AppStatus[] | undefined;
    if (q.status === 'active') statusFilter = [AppStatus.applied, AppStatus.reviewed];
    else if (q.status === 'hired') statusFilter = [AppStatus.hired];
    else if (q.status === 'closed') statusFilter = [AppStatus.rejected, AppStatus.withdrawn];

    const where = {
        workerId: c.var.userId,
        deletedAt: null,
        ...(statusFilter ? { status: { in: statusFilter } } : {}),
        ...(cursor
            ? {
                OR: [
                    { appliedAt: { lt: cursor.appliedAt } },
                    { appliedAt: cursor.appliedAt, id: { lt: cursor.id } },
                ],
            }
            : {}),
    };

    const rows = await c.var.db.application.findMany({
        where,
        orderBy: [{ appliedAt: 'desc' }, { id: 'desc' }],
        take: limit + 1,
        include: { job: { include: { employer: { include: { employerProfile: true } } } } },
    });

    const slice = rows.slice(0, limit);
    const hasMore = rows.length > limit;
    const last = slice[slice.length - 1];
    const nextCursor =
        hasMore && last ? encodeCursor({ appliedAt: last.appliedAt, id: last.id }) : null;

    return ok(c, {
        applications: slice.map((a) => ({
            ...shapeApplication(a),
            job: {
                id: a.job.id,
                seoSlug: a.job.seoSlug,
                titleEn: a.job.titleEn,
                titleEs: a.job.titleEs,
                county: a.job.county,
                wageMin: Number(a.job.wageMin.toString()),
                wageMax: Number(a.job.wageMax.toString()),
                startDate: a.job.startDate.toISOString().slice(0, 10),
                employerName: a.job.employer?.employerProfile?.legalName ?? 'AGCONN employer',
            },
        })),
        nextCursor,
    });
});

applicationsRoutes.get('/:id', async (c) => {
    const id = c.req.param('id');
    const app = await c.var.db.application.findFirst({
        where: { id, workerId: c.var.userId, deletedAt: null },
        include: {
            job: { include: { employer: { include: { employerProfile: true } } } },
            events: { orderBy: { createdAt: 'asc' } },
        },
    });
    if (!app) return err(c, 404, 'not_found');

    return ok(c, {
        application: shapeApplication(app),
        job: {
            id: app.job.id,
            seoSlug: app.job.seoSlug,
            titleEn: app.job.titleEn,
            titleEs: app.job.titleEs,
            descriptionEn: app.job.descriptionEn,
            descriptionEs: app.job.descriptionEs,
            county: app.job.county,
            wageMin: Number(app.job.wageMin.toString()),
            wageMax: Number(app.job.wageMax.toString()),
            startDate: app.job.startDate.toISOString().slice(0, 10),
            endDate: app.job.endDate?.toISOString().slice(0, 10) ?? null,
            status: app.job.status,
        },
        events: app.events.map((e) => ({
            id: e.id,
            fromStatus: e.fromStatus,
            toStatus: e.toStatus,
            actorRole: e.actorRole,
            metadata: e.metadata,
            createdAt: e.createdAt.toISOString(),
        })),
        employer: {
            id: app.job.employerId,
            name: app.job.employer?.employerProfile?.legalName ?? 'AGCONN employer',
            phone: app.job.employer?.phone ?? null,
            email: app.job.employer?.email ?? null,
        },
    });
});

applicationsRoutes.post('/:id/withdraw', async (c) => {
    const id = c.req.param('id');
    const app = await c.var.db.application.findFirst({
        where: { id, workerId: c.var.userId, deletedAt: null },
    });
    if (!app) return err(c, 404, 'not_found');
    if (app.status !== AppStatus.applied && app.status !== AppStatus.reviewed) {
        return err(c, 422, 'validation_failed', 'cannot_withdraw_at_status');
    }

    const updated = await c.var.db.application.update({
        where: { id },
        data: { status: AppStatus.withdrawn, withdrawnAt: new Date() },
    });
    await c.var.db.applicationEvent.create({
        data: {
            tenantId: app.tenantId,
            applicationId: app.id,
            fromStatus: app.status,
            toStatus: AppStatus.withdrawn,
            actorUserId: c.var.userId,
            actorRole: UserRole.worker,
            metadata: {},
        },
    });

    await c.var.audit.log({
        action: 'worker.application.withdrawn',
        resourceId: app.id,
        metadata: { jobId: app.jobId, reason: 'worker_initiated' },
    });

    try {
        const job = await c.var.db.jobPosting.findUnique({
            where: { id: app.jobId },
            include: { employer: { include: { employerProfile: true } } },
        });
        if (job) {
            await enqueueSms({
                tenantId: app.tenantId,
                userId: c.var.userId,
                template: 'application.withdrawn',
                vars: {
                    jobTitle: job.titleEn,
                    employer: job.employer?.employerProfile?.legalName ?? 'AGCONN employer',
                },
            });
        }
    } catch (e) {
        console.error('[applications] application.withdrawn SMS enqueue failed', {
            applicationId: app.id,
            err: e instanceof Error ? e.message : String(e),
        });
    }

    return ok(c, { application: shapeApplication(updated) });
});

function shapeApplication(a: {
    id: string;
    status: AppStatus;
    wageOffered: { toString: () => string } | null;
    workerNote: string | null;
    appliedAt: Date;
    reviewedAt: Date | null;
    hiredAt: Date | null;
    rejectedAt: Date | null;
    withdrawnAt: Date | null;
    startDate: Date | null;
    countyAtApply: string | null;
    skillsAtApply: string[];
    createdAt: Date;
    updatedAt: Date;
}) {
    return {
        id: a.id,
        status: a.status,
        wageOffered: a.wageOffered ? Number(a.wageOffered.toString()) : null,
        workerNote: a.workerNote,
        appliedAt: a.appliedAt.toISOString(),
        reviewedAt: a.reviewedAt?.toISOString() ?? null,
        hiredAt: a.hiredAt?.toISOString() ?? null,
        rejectedAt: a.rejectedAt?.toISOString() ?? null,
        withdrawnAt: a.withdrawnAt?.toISOString() ?? null,
        startDate: a.startDate?.toISOString().slice(0, 10) ?? null,
        countyAtApply: a.countyAtApply,
        skillsAtApply: a.skillsAtApply,
        createdAt: a.createdAt.toISOString(),
        updatedAt: a.updatedAt.toISOString(),
    };
}

function encodeCursor(cur: { appliedAt: Date; id: string }): string {
    return Buffer.from(`${cur.appliedAt.toISOString()}|${cur.id}`).toString('base64url');
}

function decodeCursor(s: string): { appliedAt: Date; id: string } | null {
    try {
        const decoded = Buffer.from(s, 'base64url').toString('utf8');
        const [iso, id] = decoded.split('|');
        if (!iso || !id) return null;
        return { appliedAt: new Date(iso), id };
    } catch {
        return null;
    }
}

// Unused but kept exported for parity.
export type _Tx = Tx;
const _unused = z; // ensure z import not flagged
void _unused;
