import { Hono } from 'hono';
import { ok, err, validate } from '@agconn/api-client/server';
import { VerificationAction } from '@agconn/db';
import {
  VerifyEmployerBody,
  RejectEmployerBody,
} from '@agconn/schemas';
import {
  requireAuth,
  requireAdmin,
  requirePermission,
  type AuthVars,
} from '../../middleware/authContext.js';
import type { AuditCtxVars } from '../../middleware/audit.js';
import { enqueueEmployerEmail } from '@agconn/email';
import { enqueueFlcVerify } from '@agconn/flc-verify';
import { LicenseType } from '@agconn/db';
import { shapeEmployer } from '../../employer/shared.js';

export const adminEmployersRoutes = new Hono<{ Variables: AuthVars & AuditCtxVars }>();
adminEmployersRoutes.use('*', requireAuth('admin'));
adminEmployersRoutes.use('*', requireAdmin);

adminEmployersRoutes.get('/pending', async (c) => {
  const rows = await c.var.db.employerProfile.findMany({
    where: {
      flcVerifiedAt: null,
      rejectedAt: null,
      deletedAt: null,
      licenseType: { not: null },
    },
    orderBy: { createdAt: 'asc' },
    take: 100,
  });
  const now = Date.now();
  return ok(c, {
    employers: rows.map((p) => ({
      ...shapeEmployer(p),
      submittedAt: p.createdAt.toISOString(),
      daysWaiting: Math.floor((now - p.createdAt.getTime()) / 86_400_000),
    })),
  });
});

adminEmployersRoutes.get('/:id', async (c) => {
  const id = c.req.param('id');
  const employer = await c.var.db.employerProfile.findUnique({ where: { id } });
  if (!employer) return err(c, 404, 'not_found');
  const log = await c.var.db.verificationLog.findMany({
    where: { employerId: id },
    orderBy: { createdAt: 'desc' },
  });
  return ok(c, {
    employer: shapeEmployer(employer),
    log: log.map((l) => ({
      id: l.id,
      action: l.action,
      actorUserId: l.actorUserId,
      notes: l.notes,
      payload: l.payload,
      createdAt: l.createdAt.toISOString(),
    })),
  });
});

adminEmployersRoutes.post(
  '/:id/verify',
  requirePermission('employers.verify'),
  validate('json', VerifyEmployerBody),
  async (c) => {
    const id = c.req.param('id');
    const adminId = c.var.userId;
    const body = c.var.body;

    const employer = await c.var.db.employerProfile.findUnique({ where: { id } });
    if (!employer) return err(c, 404, 'not_found');
    if (employer.flcVerifiedAt) return err(c, 409, 'conflict', 'already_verified');

    const updated = await c.var.db.$transaction(async (tx) => {
      const next = await tx.employerProfile.update({
        where: { id },
        data: {
          flcVerifiedAt: new Date(),
          verifiedBy: adminId,
          rejectedAt: null,
          rejectionReason: null,
        },
      });
      await tx.verificationLog.create({
        data: {
          tenantId: employer.tenantId,
          employerId: id,
          action: VerificationAction.approved,
          actorUserId: adminId,
          notes: body.notes ?? null,
          payload: body.payload ?? {},
        },
      });
      return next;
    });

    await c.var.audit.log({
      action: 'employer.flc.verified',
      resourceId: id,
      metadata: { licenseNumber: employer.flcLicenseNum ?? '', verifiedBy: adminId },
    });

    if (employer.contactEmail) {
      await enqueueEmployerEmail({
        template: 'employer.flc_verified',
        employerId: id,
        tenantId: employer.tenantId,
        to: employer.contactEmail,
        locale: 'en',
        vars: { legalName: employer.legalName, plan: employer.plan },
        idempotencyKey: `verify-approved-${id}`,
      });
    }

    return ok(c, { employer: shapeEmployer(updated) });
  },
);

adminEmployersRoutes.post(
  '/:id/reject',
  requirePermission('employers.reject'),
  validate('json', RejectEmployerBody),
  async (c) => {
    const id = c.req.param('id');
    const adminId = c.var.userId;
    const body = c.var.body;

    const employer = await c.var.db.employerProfile.findUnique({ where: { id } });
    if (!employer) return err(c, 404, 'not_found');

    const now = new Date();
    const updated = await c.var.db.$transaction(async (tx) => {
      const next = await tx.employerProfile.update({
        where: { id },
        data: {
          rejectedAt: now,
          rejectionReason: body.reason,
          flcVerifiedAt: null,
          verifiedBy: null,
        },
      });
      await tx.verificationLog.create({
        data: {
          tenantId: employer.tenantId,
          employerId: id,
          action: VerificationAction.rejected,
          actorUserId: adminId,
          notes: body.internalNotes ?? null,
          payload: { reason: body.reason },
        },
      });
      return next;
    });

    await c.var.audit.log({
      action: 'employer.flc.rejected',
      resourceId: id,
      metadata: { licenseNumber: employer.flcLicenseNum ?? '', reason: body.reason },
    });

    if (employer.contactEmail) {
      await enqueueEmployerEmail({
        template: 'employer.flc_rejected',
        employerId: id,
        tenantId: employer.tenantId,
        to: employer.contactEmail,
        locale: 'en',
        vars: { reason: body.reason },
        idempotencyKey: `verify-rejected-${id}-${now.toISOString()}`,
      });
    }

    return ok(c, { employer: shapeEmployer(updated) });
  },
);

// Trigger an immediate auto-verify pass against DLSE + MSPA for one employer.
// Useful when an admin wants to retry a captcha_blocked / error case without
// waiting for the nightly sweep.
adminEmployersRoutes.post(
  '/:id/recheck',
  requirePermission('employers.verify'),
  async (c) => {
    const id = c.req.param('id');
    const employer = await c.var.db.employerProfile.findUnique({ where: { id } });
    if (!employer) return err(c, 404, 'not_found');
    if (employer.licenseType !== LicenseType.flc) {
      return err(c, 422, 'invalid', 'recheck_only_supports_flc');
    }
    if (!employer.flcLicenseNum) {
      return err(c, 422, 'invalid', 'no_license_number_on_profile');
    }
    await enqueueFlcVerify({
      employerId: id,
      tenantId: employer.tenantId,
      reason: 'admin_requested',
      jobKey: `flc-verify-${id}-admin-${Date.now()}`,
    });
    return ok(c, { enqueued: true });
  },
);

adminEmployersRoutes.post(
  '/:id/re-verify',
  requirePermission('employers.verify'),
  validate('json', VerifyEmployerBody),
  async (c) => {
    const id = c.req.param('id');
    const adminId = c.var.userId;
    const body = c.var.body;

    const employer = await c.var.db.employerProfile.findUnique({ where: { id } });
    if (!employer) return err(c, 404, 'not_found');

    const updated = await c.var.db.$transaction(async (tx) => {
      const next = await tx.employerProfile.update({
        where: { id },
        data: {
          flcVerifiedAt: new Date(),
          verifiedBy: adminId,
          rejectedAt: null,
          rejectionReason: null,
        },
      });
      await tx.verificationLog.create({
        data: {
          tenantId: employer.tenantId,
          employerId: id,
          action: VerificationAction.re_verified,
          actorUserId: adminId,
          notes: body.notes ?? null,
          payload: body.payload ?? {},
        },
      });
      return next;
    });

    await c.var.audit.log({
      action: 'employer.flc.verified',
      resourceId: id,
      metadata: { licenseNumber: employer.flcLicenseNum ?? '', verifiedBy: adminId },
    });

    if (employer.contactEmail) {
      await enqueueEmployerEmail({
        template: 'employer.flc_verified',
        employerId: id,
        tenantId: employer.tenantId,
        to: employer.contactEmail,
        locale: 'en',
        vars: { legalName: employer.legalName, plan: employer.plan },
        idempotencyKey: `verify-reapproved-${id}-${updated.updatedAt.toISOString()}`,
      });
    }

    return ok(c, { employer: shapeEmployer(updated) });
  },
);
