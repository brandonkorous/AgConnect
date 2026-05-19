import { Hono } from 'hono';
import { ok, err, validate } from '@agconn/api-client/server';
import { AppStatus, dbClients, JobStatus, UserRole } from '@agconn/db';
import {
    InboxQuery,
    TransitionBody,
    BulkTransitionBody,
    NoteBody,
    SendMessageBody,
    canUseFeature,
    countSkillMatches,
} from '@agconn/schemas';
import { enqueueSms } from '@agconn/sms';
import {
    requireAuth,
    requireActiveEmployer,
    requireEmployerPermission,
    requireTenant,
    type AuthVars,
} from '../../middleware/authContext.js';
import type { AuditCtxVars } from '../../middleware/audit.js';

export const employerInboxRoutes = new Hono<{ Variables: AuthVars & AuditCtxVars }>();
employerInboxRoutes.use('*', requireAuth('employer'));
employerInboxRoutes.use('*', requireActiveEmployer);
employerInboxRoutes.use('*', requireTenant);

employerInboxRoutes.get(
    '/inbox',
    requireEmployerPermission('applicants.read'),
    validate('query', InboxQuery),
    async (c) => {
    const employerId = c.var.employerId!;
    const tenantId = c.var.tenantId!;
    const q = c.var.body;

    const cursor = q.cursor ? decodeCursor(q.cursor) : null;

    const rows = await c.var.db.application.findMany({
        where: {
            tenantId,
            deletedAt: null,
            job: { employerId, deletedAt: null },
            ...(q.status ? { status: q.status as AppStatus } : {}),
            ...(q.jobId ? { jobId: q.jobId } : {}),
            ...(cursor
                ? {
                    OR: [
                        { appliedAt: { lt: cursor.appliedAt } },
                        { appliedAt: cursor.appliedAt, id: { lt: cursor.id } },
                    ],
                }
                : {}),
        },
        orderBy: [{ appliedAt: 'desc' }, { id: 'desc' }],
        take: q.limit + 1,
        include: {
            job: { select: { id: true, titleEn: true, titleEs: true, county: true, seoSlug: true, skills: true } },
            worker: {
                include: {
                    workerProfile: {
                        select: { firstName: true, lastName: true, county: true, skills: true, certifications: true },
                    },
                },
            },
        },
    });

    const slice = rows.slice(0, q.limit);
    const hasMore = rows.length > q.limit;
    const last = slice[slice.length - 1];
    const nextCursor =
        hasMore && last
            ? Buffer.from(`${last.appliedAt.toISOString()}|${last.id}`).toString('base64url')
            : null;

    return ok(c, {
        applications: slice.map(shapeApplicationCard),
        nextCursor,
        unreadCount: 0,
    });
    },
);

export const employerJobApplicantsRoute = new Hono<{ Variables: AuthVars & AuditCtxVars }>();
employerJobApplicantsRoute.use('*', requireAuth('employer'));
employerJobApplicantsRoute.use('*', requireActiveEmployer);
employerJobApplicantsRoute.use('*', requireTenant);

employerJobApplicantsRoute.get(
    '/:jobId/applicants',
    requireEmployerPermission('applicants.read'),
    async (c) => {
    const employerId = c.var.employerId!;
    const jobId = c.req.param('jobId');
    const job = await c.var.db.jobPosting.findFirst({
        where: { id: jobId, employerId, deletedAt: null },
    });
    if (!job) return err(c, 404, 'not_found');

    const rows = await c.var.db.application.findMany({
        where: { jobId, deletedAt: null, status: { not: AppStatus.withdrawn } },
        orderBy: [{ appliedAt: 'desc' }],
        include: {
            job: { select: { id: true, titleEn: true, titleEs: true, county: true, seoSlug: true, skills: true } },
            worker: {
                include: {
                    workerProfile: {
                        select: { firstName: true, lastName: true, county: true, skills: true, certifications: true },
                    },
                },
            },
        },
    });

    const cards = rows.map(shapeApplicationCard);
    const rejectedCount = await c.var.db.application.count({
        where: { jobId, status: AppStatus.rejected, deletedAt: null },
    });

    return ok(c, {
        columns: {
            applied: cards.filter((a) => a.status === 'applied'),
            reviewed: cards.filter((a) => a.status === 'reviewed'),
            hired: cards.filter((a) => a.status === 'hired'),
        },
        rejectedCount,
    });
    },
);

export const employerApplicationsRoutes = new Hono<{ Variables: AuthVars & AuditCtxVars }>();
employerApplicationsRoutes.use('*', requireAuth('employer'));
employerApplicationsRoutes.use('*', requireActiveEmployer);
employerApplicationsRoutes.use('*', requireTenant);

employerApplicationsRoutes.get(
    '/:id',
    requireEmployerPermission('applicants.read'),
    async (c) => {
    const employerId = c.var.employerId!;
    const id = c.req.param('id');

    const app = await c.var.db.application.findFirst({
        where: { id, deletedAt: null, job: { employerId } },
        include: {
            job: true,
            worker: {
                include: { workerProfile: true },
            },
            events: { orderBy: { createdAt: 'asc' } },
        },
    });
    if (!app) return err(c, 404, 'not_found');

    const profile = app.worker.workerProfile;

    return ok(c, {
        application: {
            id: app.id,
            status: app.status,
            workerNote: app.workerNote,
            employerNote: app.employerNote,
            rejectionReason: app.rejectionReason,
            rejectionReasonText: app.rejectionReasonText,
            wageOffered: app.wageOffered ? Number(app.wageOffered.toString()) : null,
            appliedAt: app.appliedAt.toISOString(),
            reviewedAt: app.reviewedAt?.toISOString() ?? null,
            hiredAt: app.hiredAt?.toISOString() ?? null,
            rejectedAt: app.rejectedAt?.toISOString() ?? null,
            startDate: app.startDate ? app.startDate.toISOString().slice(0, 10) : null,
        },
        job: {
            id: app.job.id,
            titleEn: app.job.titleEn,
            titleEs: app.job.titleEs,
            county: app.job.county,
            wageMin: Number(app.job.wageMin.toString()),
            wageMax: Number(app.job.wageMax.toString()),
            seoSlug: app.job.seoSlug,
        },
        worker: {
            id: app.worker.id,
            firstName: profile?.firstName ?? '',
            lastName: profile?.lastName ?? '',
            phone: app.worker.phone,
            email: app.worker.email,
            county: profile?.county ?? null,
            zipCode: profile?.zipCode ?? null,
            skills: profile?.skills ?? [],
            certifications: certsFromJson(profile?.certifications),
            availability: profile?.availability ?? {},
        },
        events: app.events.map((e) => ({
            id: e.id,
            fromStatus: e.fromStatus,
            toStatus: e.toStatus,
            actorRole: e.actorRole,
            metadata: e.metadata as Record<string, unknown>,
            createdAt: e.createdAt.toISOString(),
        })),
    });
    },
);

employerApplicationsRoutes.post(
    '/:id/transition',
    requireEmployerPermission('applicants.write'),
    validate('json', TransitionBody),
    async (c) => {
        const userId = c.var.userId;
        const employerId = c.var.employerId!;
        const tenantId = c.var.tenantId!;
        const id = c.req.param('id');
        const body = c.var.body;

        // Cross-domain transaction (applications × application_events × job_postings
        // hire counter). Routed through the shared pool.
        const result = await dbClients.shared.$transaction(async (tx) => {
            const app = await tx.application.findFirst({
                where: { id, deletedAt: null, job: { employerId } },
                include: { job: true },
            });
            if (!app) return { kind: 'not_found' as const };

            if (!validTransition(app.status, body.toStatus)) {
                return { kind: 'invalid_transition' as const, from: app.status };
            }

            const now = new Date();
            const data: Record<string, unknown> = { status: body.toStatus };
            if (body.toStatus === 'reviewed') {
                data.reviewedAt = now;
                if ('note' in body && body.note !== undefined) data.employerNote = body.note;
            } else if (body.toStatus === 'hired') {
                data.hiredAt = now;
                data.wageOffered = body.wageOffered;
                data.startDate = new Date(body.startDate);
                if (body.note !== undefined) data.employerNote = body.note;
            } else if (body.toStatus === 'rejected') {
                data.rejectedAt = now;
                if (body.rejectionReason) data.rejectionReason = body.rejectionReason;
                if (body.rejectionReasonText) data.rejectionReasonText = body.rejectionReasonText;
            }

            const updated = await tx.application.update({ where: { id }, data });

            await tx.applicationEvent.create({
                data: {
                    tenantId,
                    applicationId: id,
                    fromStatus: app.status,
                    toStatus: body.toStatus as AppStatus,
                    actorUserId: userId,
                    actorRole: UserRole.employer,
                    metadata:
                        body.toStatus === 'rejected'
                            ? { rejectionReason: body.rejectionReason ?? 'unspecified' }
                            : body.toStatus === 'hired'
                                ? { wageOffered: body.wageOffered, startDate: body.startDate }
                                : {},
                },
            });

            // Hire counter + auto-fill the posting if at capacity.
            if (body.toStatus === 'hired') {
                const newCount = app.job.hireCount + 1;
                await tx.jobPosting.update({
                    where: { id: app.job.id },
                    data: {
                        hireCount: newCount,
                        ...(newCount >= app.job.positionsTotal
                            ? { status: JobStatus.filled, filledAt: now }
                            : {}),
                    },
                });
            }

            return {
                kind: 'ok' as const,
                app: updated,
                prevStatus: app.status,
                job: app.job,
                workerId: app.workerId,
            };
        });

        if (result.kind === 'not_found') return err(c, 404, 'not_found');
        if (result.kind === 'invalid_transition') {
            return err(c, 422, 'validation_failed', 'invalid_transition');
        }

        await c.var.audit.log({
            action: body.toStatus === 'hired' ? 'application.hired' : 'application.status.changed',
            resourceId: id,
            metadata:
                body.toStatus === 'hired'
                    ? {
                        jobId: result.app.jobId,
                        employerId,
                        startDate: result.app.startDate?.toISOString() ?? '',
                    }
                    : {
                        fromStatus: result.prevStatus,
                        toStatus: body.toStatus,
                        jobId: result.app.jobId,
                    },
        });

        try {
            const employerProfile = await c.var.db.employerProfile.findUnique({
                where: { id: employerId },
            });
            // Free-tier employers don't get applicant SMS — the kanban transition
            // writes its event row but skips the Twilio enqueue. Workers still get
            // platform-triggered SMS (job alerts, training reminders, auth) since
            // those aren't tied to any specific employer's plan.
            if (employerProfile && canUseFeature(employerProfile.plan, 'applicantSms')) {
                const employerName = employerProfile.legalName;
                const jobTitle = result.job.titleEn;
                if (body.toStatus === 'reviewed') {
                    await enqueueSms({
                        tenantId,
                        userId: result.workerId,
                        template: 'application.reviewed',
                        vars: { jobTitle, employer: employerName },
                        jobKey: `app-${id}-reviewed`,
                    });
                } else if (body.toStatus === 'hired') {
                    await enqueueSms({
                        tenantId,
                        userId: result.workerId,
                        template: 'application.hired',
                        vars: {
                            jobTitle,
                            employer: employerName,
                            startDate: body.startDate,
                        },
                        jobKey: `app-${id}-hired`,
                    });
                } else if (body.toStatus === 'rejected') {
                    await enqueueSms({
                        tenantId,
                        userId: result.workerId,
                        template: 'application.rejected',
                        vars: { jobTitle, employer: employerName },
                        jobKey: `app-${id}-rejected`,
                    });
                }
            }
        } catch (e) {
            console.error('[employer.applications.transition] SMS enqueue failed', {
                applicationId: id,
                toStatus: body.toStatus,
                err: e instanceof Error ? e.message : String(e),
            });
        }

        return ok(c, {
            application: {
                id: result.app.id,
                status: result.app.status,
                wageOffered: result.app.wageOffered ? Number(result.app.wageOffered.toString()) : null,
            },
        });
    },
);

employerApplicationsRoutes.post(
    '/bulk-transition',
    requireEmployerPermission('applicants.write'),
    validate('json', BulkTransitionBody),
    async (c) => {
        const userId = c.var.userId;
        const employerId = c.var.employerId!;
        const tenantId = c.var.tenantId!;
        const body = c.var.body;

        const succeeded: string[] = [];
        const failed: Array<{ id: string; error: string }> = [];
        const notifications: Array<{ id: string; workerId: string; jobTitle: string }> = [];

        for (const id of body.applicationIds) {
            try {
                await c.var.db.$transaction(async (tx) => {
                    const app = await tx.application.findFirst({
                        where: { id, deletedAt: null, job: { employerId } },
                        include: { job: { select: { titleEn: true } } },
                    });
                    if (!app) {
                        failed.push({ id, error: 'not_found' });
                        return;
                    }
                    if (!validTransition(app.status, body.toStatus)) {
                        failed.push({ id, error: 'invalid_transition' });
                        return;
                    }
                    const now = new Date();
                    const data: Record<string, unknown> = { status: body.toStatus };
                    if (body.toStatus === 'reviewed') data.reviewedAt = now;
                    else if (body.toStatus === 'rejected') {
                        data.rejectedAt = now;
                        if (body.rejectionReason) data.rejectionReason = body.rejectionReason;
                    }
                    await tx.application.update({ where: { id }, data });
                    await tx.applicationEvent.create({
                        data: {
                            tenantId,
                            applicationId: id,
                            fromStatus: app.status,
                            toStatus: body.toStatus as AppStatus,
                            actorUserId: userId,
                            actorRole: UserRole.employer,
                            metadata: {
                                bulk: true,
                                ...(body.toStatus === 'rejected'
                                    ? { rejectionReason: body.rejectionReason ?? 'unspecified' }
                                    : {}),
                            },
                        },
                    });
                    succeeded.push(id);
                    notifications.push({
                        id,
                        workerId: app.workerId,
                        jobTitle: app.job.titleEn,
                    });
                });
            } catch {
                failed.push({ id, error: 'internal' });
            }
        }

        if (
            notifications.length > 0 &&
            (body.toStatus === 'reviewed' || body.toStatus === 'rejected')
        ) {
            try {
                const employerProfile = await c.var.db.employerProfile.findUnique({
                    where: { id: employerId },
                });
                // See single-transition handler — free tier skips Twilio.
                if (!employerProfile || !canUseFeature(employerProfile.plan, 'applicantSms')) {
                    return ok(c, { succeeded, failed });
                }
                const employerName = employerProfile.legalName;
                const template =
                    body.toStatus === 'reviewed'
                        ? ('application.reviewed' as const)
                        : ('application.rejected' as const);
                for (const n of notifications) {
                    try {
                        await enqueueSms({
                            tenantId,
                            userId: n.workerId,
                            template,
                            vars: { jobTitle: n.jobTitle, employer: employerName },
                            jobKey: `app-${n.id}-${body.toStatus}`,
                        });
                    } catch (e) {
                        console.error(
                            '[employer.applications.bulk-transition] SMS enqueue failed',
                            {
                                applicationId: n.id,
                                toStatus: body.toStatus,
                                err: e instanceof Error ? e.message : String(e),
                            },
                        );
                    }
                }
            } catch (e) {
                console.error(
                    '[employer.applications.bulk-transition] employer lookup failed',
                    { err: e instanceof Error ? e.message : String(e) },
                );
            }
        }

        return ok(c, { succeeded, failed });
    },
);

employerApplicationsRoutes.post(
    '/:id/message',
    requireEmployerPermission('applicants.write'),
    validate('json', SendMessageBody),
    async (c) => {
        const userId = c.var.userId;
        const employerId = c.var.employerId!;
        const tenantId = c.var.tenantId!;
        const id = c.req.param('id');
        const body = c.var.body;

        const app = await c.var.db.application.findFirst({
            where: { id, deletedAt: null, job: { employerId } },
            include: {
                worker: { include: { workerProfile: { select: { firstName: true, lastName: true } } } },
                job: { select: { titleEn: true } },
            },
        });
        if (!app) return err(c, 404, 'not_found');

        // Cross-domain transaction (applications context × conversations × messages).
        // Routed through the shared pool.
        const result = await dbClients.shared.$transaction(async (tx) => {
            const existing = await tx.conversation.findFirst({
                where: {
                    tenantId,
                    employerId,
                    isGroup: false,
                    deletedAt: null,
                    participants: { some: { userId: app.workerId, leftAt: null } },
                },
            });

            const conversation =
                existing ??
                (await tx.conversation.create({
                    data: {
                        tenantId,
                        employerId,
                        title:
                            `${app.worker.workerProfile?.firstName ?? ''} ${app.worker.workerProfile?.lastName ?? ''}`.trim() ||
                            app.job.titleEn,
                        isGroup: false,
                        channel: body.channel ?? 'app',
                    },
                }));

            if (!existing) {
                await tx.conversationParticipant.createMany({
                    data: [
                        { tenantId, conversationId: conversation.id, userId },
                        { tenantId, conversationId: conversation.id, userId: app.workerId },
                    ],
                });
            }

            const msg = await tx.message.create({
                data: {
                    tenantId,
                    conversationId: conversation.id,
                    senderUserId: userId,
                    body: body.body,
                    channel: body.channel ?? conversation.channel,
                },
            });
            await tx.conversation.update({
                where: { id: conversation.id },
                data: { lastMessageAt: msg.createdAt },
            });
            await tx.conversationParticipant.updateMany({
                where: { conversationId: conversation.id, userId: { not: userId }, leftAt: null },
                data: { unreadCount: { increment: 1 } },
            });
            return { conversation, msg };
        });

        await c.var.audit.log({
            action: 'employer.message.sent',
            resourceId: result.msg.id,
            metadata: {
                conversationId: result.conversation.id,
                channel: result.msg.channel,
                applicationId: id,
            },
        });

        return ok(c, {
            message: {
                id: result.msg.id,
                conversationId: result.conversation.id,
                senderUserId: result.msg.senderUserId,
                body: result.msg.body,
                channel: result.msg.channel,
                direction: result.msg.direction,
                createdAt: result.msg.createdAt.toISOString(),
            },
        });
    },
);

employerApplicationsRoutes.post(
    '/:id/note',
    requireEmployerPermission('applicants.write'),
    validate('json', NoteBody),
    async (c) => {
    const employerId = c.var.employerId!;
    const id = c.req.param('id');
    const body = c.var.body;

    const existing = await c.var.db.application.findFirst({
        where: { id, deletedAt: null, job: { employerId } },
    });
    if (!existing) return err(c, 404, 'not_found');

    await c.var.db.application.update({
        where: { id },
        data: { employerNote: body.note },
    });

    return ok(c, { ok: true });
    },
);

// Helpers ------------------------------------------------------------------

function validTransition(from: AppStatus, to: 'reviewed' | 'hired' | 'rejected'): boolean {
    if (from === AppStatus.withdrawn || from === AppStatus.hired || from === AppStatus.rejected) {
        return false;
    }
    if (to === 'reviewed') return from === AppStatus.applied;
    if (to === 'hired') return from === AppStatus.applied || from === AppStatus.reviewed;
    if (to === 'rejected') return from === AppStatus.applied || from === AppStatus.reviewed;
    return false;
}

function shapeApplicationCard(a: {
    id: string;
    status: AppStatus;
    appliedAt: Date;
    job: { id: string; titleEn: string; titleEs: string; county: string; seoSlug: string | null; skills: string[] };
    worker: {
        id: string;
        workerProfile: {
            firstName: string;
            lastName: string;
            county: string | null;
            skills: string[];
            certifications: unknown;
        } | null;
    };
}) {
    const wp = a.worker.workerProfile;
    const skillMatches = wp ? countSkillMatches(a.job.skills, wp.skills) : 0;
    return {
        id: a.id,
        status: a.status,
        appliedAt: a.appliedAt.toISOString(),
        job: {
            id: a.job.id,
            titleEn: a.job.titleEn,
            titleEs: a.job.titleEs,
            county: a.job.county,
            seoSlug: a.job.seoSlug,
        },
        worker: {
            id: a.worker.id,
            firstName: wp?.firstName ?? '',
            lastInitial: (wp?.lastName ?? '').slice(0, 1).toUpperCase(),
            county: wp?.county ?? null,
            skills: wp?.skills ?? [],
            skillsMatchCount: skillMatches,
            certifications: certsFromJson(wp?.certifications),
        },
        unread: false,
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
