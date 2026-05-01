import { Hono } from 'hono';
import { ok, err } from '@agconn/api-client/server';
import { AppStatus, JobStatus, UserRole } from '@agconn/db';
import { requireAuth, requireRole, requireTenant, type AuthVars } from '../middleware/authContext';
import type { AuditCtxVars } from '../middleware/audit';

export const meInvitationsRoutes = new Hono<{ Variables: AuthVars & AuditCtxVars }>();
meInvitationsRoutes.use('*', requireAuth);
meInvitationsRoutes.use('*', requireRole('worker'));
meInvitationsRoutes.use('*', requireTenant);

meInvitationsRoutes.get('/', async (c) => {
  const userId = c.var.userId;
  const rows = await c.var.db.workerInvitation.findMany({
    where: { workerId: userId, declinedAt: null, expiredAt: null, acceptedAt: null },
    orderBy: { createdAt: 'desc' },
    include: {
      employer: { select: { legalName: true, dbaName: true } },
      job: {
        select: {
          id: true,
          titleEn: true,
          titleEs: true,
          county: true,
          wageMin: true,
          wageMax: true,
          seoSlug: true,
        },
      },
    },
  });

  return ok(c, {
    invitations: rows.map((r) => ({
      id: r.id,
      message: r.message,
      createdAt: r.createdAt.toISOString(),
      employerName: r.employer.dbaName ?? r.employer.legalName,
      job: {
        id: r.job.id,
        titleEn: r.job.titleEn,
        titleEs: r.job.titleEs,
        county: r.job.county,
        wageMin: Number(r.job.wageMin.toString()),
        wageMax: Number(r.job.wageMax.toString()),
        seoSlug: r.job.seoSlug,
      },
    })),
  });
});

meInvitationsRoutes.post('/:id/accept', async (c) => {
  const userId = c.var.userId;
  const tenantId = c.var.tenantId!;
  const id = c.req.param('id');

  const result = await c.var.db.$transaction(async (tx) => {
    const invitation = await tx.workerInvitation.findFirst({
      where: { id, workerId: userId, acceptedAt: null, declinedAt: null, expiredAt: null },
      include: { job: true },
    });
    if (!invitation) return { kind: 'not_found' as const };
    if (invitation.job.status !== JobStatus.active) {
      return { kind: 'job_not_active' as const };
    }

    const existingApp = await tx.application.findFirst({
      where: { jobId: invitation.jobId, workerId: userId, deletedAt: null },
    });
    if (existingApp) return { kind: 'already_applied' as const };

    const profile = await tx.workerProfile.findUnique({ where: { id: userId } });

    const application = await tx.application.create({
      data: {
        tenantId,
        jobId: invitation.jobId,
        workerId: userId,
        status: AppStatus.applied,
        countyAtApply: profile?.county ?? null,
        skillsAtApply: profile?.skills ?? [],
      },
    });

    await tx.applicationEvent.create({
      data: {
        tenantId,
        applicationId: application.id,
        fromStatus: null,
        toStatus: AppStatus.applied,
        actorUserId: userId,
        actorRole: UserRole.worker,
        metadata: { invitationId: id },
      },
    });

    await tx.workerInvitation.update({
      where: { id },
      data: { acceptedAt: new Date() },
    });

    return { kind: 'ok' as const, applicationId: application.id };
  });

  if (result.kind === 'not_found') return err(c, 404, 'not_found');
  if (result.kind === 'job_not_active') return err(c, 422, 'validation_failed', 'job_not_active');
  if (result.kind === 'already_applied') return err(c, 409, 'conflict', 'already_applied');

  await c.var.audit.log({
    action: 'worker.application.submitted',
    resourceId: result.applicationId,
    metadata: { jobId: '', employerId: '' },
  });

  return ok(c, { ok: true, applicationId: result.applicationId });
});

meInvitationsRoutes.post('/:id/decline', async (c) => {
  const userId = c.var.userId;
  const id = c.req.param('id');

  const updated = await c.var.db.workerInvitation.updateMany({
    where: { id, workerId: userId, acceptedAt: null, declinedAt: null, expiredAt: null },
    data: { declinedAt: new Date() },
  });
  if (updated.count === 0) return err(c, 404, 'not_found');

  return ok(c, { ok: true });
});
