import { Hono } from 'hono';
import { ok, err, validate } from '@agconn/api-client/server';
import { LicenseType, VerificationAction, type Tx } from '@agconn/db';
import {
  EmployerOnboardingBody,
  PatchEmployerBody,
  type EmployerProfile,
} from '@agconn/schemas';
import { requireAuth, requireRole, requireTenant, type AuthVars } from '../../middleware/authContext';
import type { AuditCtxVars } from '../../middleware/audit';
import { enqueueEmployerEmail } from '@agconn/email';
import { shapeEmployer, verificationStatus } from '../shared';

export const employerOnboardingRoutes = new Hono<{ Variables: AuthVars & AuditCtxVars }>();
employerOnboardingRoutes.use('*', requireAuth);
employerOnboardingRoutes.use('*', requireRole('employer'));
employerOnboardingRoutes.use('*', requireTenant);

employerOnboardingRoutes.post('/', validate('json', EmployerOnboardingBody), async (c) => {
  const userId = c.var.userId;
  const tenantId = c.var.tenantId!;
  const body = c.var.body;

  const existing = await c.var.db.employerProfile.findUnique({ where: { userId } });
  if (existing) {
    return err(c, 409, 'conflict', 'already_onboarded');
  }

  const profile = await c.var.db.$transaction(async (tx) => {
    const created = await tx.employerProfile.create({
      data: {
        userId,
        tenantId,
        legalName: body.legalName,
        dbaName: body.dbaName ?? null,
        licenseType: body.licenseType as LicenseType,
        ein: body.ein ?? null,
        flcLicenseNum: body.flcLicenseNum ?? null,
        dolMspaNum: body.dolMspaNum ?? null,
        county: body.county ?? null,
        contactEmail: body.contactEmail ?? null,
        contactPhone: body.contactPhone ?? null,
        seoSlug: generateEmployerSlug(body.legalName, body.dbaName),
      },
    });

    await tx.verificationLog.create({
      data: {
        tenantId,
        employerId: created.id,
        action: VerificationAction.submitted,
        actorUserId: userId,
        payload: {
          licenseType: body.licenseType,
          flcLicenseNum: body.flcLicenseNum ?? null,
          ein: body.ein ?? null,
        },
      },
    });

    await tx.user.update({ where: { id: userId }, data: { onboarded: true } });

    return created;
  });

  await c.var.audit.log({
    action: 'employer.flc.submitted',
    resourceId: profile.id,
    metadata: { licenseNumber: body.flcLicenseNum ?? body.ein ?? '' },
  });

  await enqueueEmployerEmail({
    template: 'employer.flc_pending',
    employerId: profile.id,
    tenantId,
    to: body.contactEmail ?? null,
    locale: 'en',
    vars: { legalName: profile.legalName },
    idempotencyKey: `verify-pending-${profile.id}`,
  });

  return ok(c, {
    employer: shapeEmployer(profile),
    status: 'pending',
  } satisfies { employer: EmployerProfile; status: 'pending' });
});

employerOnboardingRoutes.patch('/', validate('json', PatchEmployerBody), async (c) => {
  const userId = c.var.userId;
  const body = c.var.body;
  const profile = await c.var.db.employerProfile.findUnique({ where: { userId } });
  if (!profile) return err(c, 404, 'not_found');

  const licenseChanged = body.flcLicenseNum && body.flcLicenseNum !== profile.flcLicenseNum;

  const updated = await c.var.db.$transaction(async (tx) => {
    const next = await tx.employerProfile.update({
      where: { id: profile.id },
      data: {
        legalName: body.legalName ?? undefined,
        dbaName: body.dbaName === null ? null : body.dbaName ?? undefined,
        flcLicenseNum: body.flcLicenseNum ?? undefined,
        dolMspaNum: body.dolMspaNum === null ? null : body.dolMspaNum ?? undefined,
        ein: body.ein ?? undefined,
        county: body.county ?? undefined,
        contactEmail:
          body.contactEmail === null ? null : body.contactEmail ?? undefined,
        contactPhone:
          body.contactPhone === null ? null : body.contactPhone ?? undefined,
        ...(licenseChanged
          ? {
              flcVerifiedAt: null,
              rejectedAt: null,
              rejectionReason: null,
              verifiedBy: null,
            }
          : {}),
      },
    });

    if (licenseChanged) {
      await tx.verificationLog.create({
        data: {
          tenantId: profile.tenantId,
          employerId: profile.id,
          action: VerificationAction.submitted,
          actorUserId: userId,
          notes: 'License number changed — re-verification required.',
          payload: {
            licenseType: profile.licenseType,
            flcLicenseNum: body.flcLicenseNum,
          },
        },
      });
    }

    return next;
  });

  if (licenseChanged) {
    await enqueueEmployerEmail({
      template: 'employer.flc_pending',
      employerId: profile.id,
      tenantId: profile.tenantId,
      to: updated.contactEmail,
      locale: 'en',
      vars: { legalName: updated.legalName },
      idempotencyKey: `verify-pending-${profile.id}-${updated.updatedAt.toISOString()}`,
    });
  }

  if (licenseChanged) {
    await c.var.audit.log({
      action: 'employer.flc.submitted',
      resourceId: profile.id,
      metadata: { licenseNumber: body.flcLicenseNum ?? '' },
    });
  }

  return ok(c, { employer: shapeEmployer(updated) });
});

employerOnboardingRoutes.get('/me', async (c) => {
  const userId = c.var.userId;
  const profile = await c.var.db.employerProfile.findUnique({ where: { userId } });
  if (!profile) return err(c, 404, 'not_found');

  return ok(c, {
    employer: shapeEmployer(profile),
    verificationStatus: verificationStatus(profile),
    rejectionReason: profile.rejectionReason,
  });
});

function generateEmployerSlug(legalName: string, dbaName: string | undefined): string {
  const base = (dbaName ?? legalName)
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .slice(0, 60);
  const suffix = Math.random().toString(36).slice(2, 8);
  return `${base || 'employer'}-${suffix}`;
}

// Type re-export so the routes file is a leaf for the API surface.
export type { Tx };
