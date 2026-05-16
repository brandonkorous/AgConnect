import { Hono } from 'hono';
import { ok, err, validate } from '@agconn/api-client/server';
import { dbClients, LicenseType, UserRole, VerificationAction, type Tx } from '@agconn/db';
import {
  EmployerOnboardingBody,
  PatchEmployerBody,
  type EmployerProfile,
} from '@agconn/schemas';
import {
  requireAuth,
  requireRole,
  requireTenant,
  requireEmployerPermission,
  type AuthVars,
} from '../../middleware/authContext.js';
import type { AuditCtxVars } from '../../middleware/audit.js';
import { enqueueEmployerEmail } from '@agconn/email';
import { enqueueFlcVerify } from '@agconn/flc-verify';
import { shapeEmployer, verificationStatus } from '../shared.js';
import { seedDefaultComplianceItems, seedInitialPayrollPeriod } from './seed-defaults.js';

export const employerOnboardingRoutes = new Hono<{ Variables: AuthVars & AuditCtxVars }>();
employerOnboardingRoutes.use('*', requireAuth('employer'));
// Onboarding is the bootstrap that *creates* the employer + the first owner
// membership, so it is gated by the coarse user role (set at sign-up), not by
// requireActiveEmployer — there is no membership yet on POST /.
employerOnboardingRoutes.use('*', requireRole('employer'));
// requireTenant is applied only to routes that read/mutate an existing tenant.
// POST / is reachable when c.var.tenantId is still null.

class AlreadyOnboarded extends Error {}

employerOnboardingRoutes.post('/', validate('json', EmployerOnboardingBody), async (c) => {
  const userId = c.var.userId;
  const body = c.var.body;

  // Cross-domain bootstrap (tenants x users x employer_profiles x
  // employer_contacts x roles x verification_logs x compliance_items x
  // payroll_periods). Routed through the shared pool so the employer pool
  // isn't held while we seed compliance and billing rows.
  let profile;
  try {
    profile = await dbClients.shared.$transaction(async (tx) => {
      // Elevate to 'admin' for the bootstrapping writes: 'authenticated' has
      // no INSERT policy on tenants and no UPDATE policy on users.
      await tx.$executeRawUnsafe(`SET LOCAL app.role = 'admin'`);

      // Idempotency: a user already on an owner roster row has onboarded.
      const existing = await tx.employerContact.findFirst({
        where: { userId, role: { key: 'owner' }, deletedAt: null },
      });
      if (existing) throw new AlreadyOnboarded();

      let tenantId = c.var.tenantId;
      if (!tenantId) {
        const tenant = await tx.tenant.create({
          data: {
            slug: generateTenantSlug(body.legalName),
            name: body.dbaName?.trim() || body.legalName,
          },
        });
        tenantId = tenant.id;
      }

      await tx.user.update({
        where: { id: userId },
        data: { tenantId, role: UserRole.employer, onboarded: true },
      });

      const ownerRole = await tx.role.findFirst({
        where: { tenantId: null, key: 'owner', deletedAt: null },
      });
      if (!ownerRole) throw new Error('owner role missing from catalog');

      await tx.$executeRaw`SELECT set_config('app.tenant_id', ${tenantId}, true)`;
      await tx.$executeRawUnsafe(`SET LOCAL app.role = 'authenticated'`);

      const created = await tx.employerProfile.create({
        data: {
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
          participatesInH2a: body.participatesInH2a ?? false,
          streetAddress: body.address.streetAddress,
          city: body.address.city,
          stateCode: body.address.stateCode,
          postalCode: body.address.postalCode,
          addressLat: body.address.addressLat,
          addressLng: body.address.addressLng,
          mapboxId: body.address.mapboxId ?? null,
          seoSlug: generateEmployerSlug(body.legalName, body.dbaName),
        },
      });

      // The owner is a roster row; owner_contact_id mirrors it (reassignable).
      const owner = await tx.employerContact.create({
        data: {
          tenantId,
          employerId: created.id,
          userId,
          email: body.contactEmail ?? null,
          name: body.dbaName?.trim() || body.legalName,
          phone: body.contactPhone ?? '',
          roleId: ownerRole.id,
          acceptedAt: new Date(),
        },
      });

      const withOwner = await tx.employerProfile.update({
        where: { id: created.id },
        data: { ownerContactId: owner.id },
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

      await seedDefaultComplianceItems(tx, tenantId, created.id);
      await seedInitialPayrollPeriod(tx, tenantId, created.id);

      return withOwner;
    });
  } catch (e) {
    if (e instanceof AlreadyOnboarded) {
      return err(c, 409, 'conflict', 'already_onboarded');
    }
    throw e;
  }

  await c.var.audit.log({
    action: 'employer.flc.submitted',
    resourceId: profile.id,
    metadata: { licenseNumber: body.flcLicenseNum ?? body.ein ?? '' },
  });

  await enqueueEmployerEmail({
    template: 'employer.flc_pending',
    employerId: profile.id,
    tenantId: profile.tenantId,
    to: body.contactEmail ?? null,
    locale: 'en',
    vars: { legalName: profile.legalName },
    idempotencyKey: `verify-pending-${profile.id}`,
  });

  if (profile.licenseType === LicenseType.flc && profile.flcLicenseNum) {
    try {
      await enqueueFlcVerify({
        employerId: profile.id,
        tenantId: profile.tenantId,
        reason: 'onboarding',
      });
    } catch (e) {
      // Auto-verify is best-effort on the request path. The nightly sweep
      // picks this employer up if the enqueue failed — do not fail
      // onboarding because of it.
      console.error('[employer.onboarding] FLC verify enqueue failed', {
        employerId: profile.id,
        err: e instanceof Error ? e.message : String(e),
      });
    }
  }

  return ok(c, {
    employer: shapeEmployer(profile),
    status: 'pending',
  } satisfies { employer: EmployerProfile; status: 'pending' });
});

employerOnboardingRoutes.patch(
  '/',
  requireTenant,
  requireEmployerPermission('flc.write'),
  validate('json', PatchEmployerBody),
  async (c) => {
    const userId = c.var.userId;
    const employerId = c.var.employerId;
    const body = c.var.body;
    if (!employerId) return err(c, 404, 'not_found');
    const profile = await c.var.db.employerProfile.findUnique({ where: { id: employerId } });
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
          participatesInH2a: body.participatesInH2a ?? undefined,
          ...(body.address
            ? {
                streetAddress: body.address.streetAddress,
                city: body.address.city,
                stateCode: body.address.stateCode,
                postalCode: body.address.postalCode,
                addressLat: body.address.addressLat,
                addressLng: body.address.addressLng,
                mapboxId: body.address.mapboxId ?? null,
              }
            : {}),
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

      await c.var.audit.log({
        action: 'employer.flc.submitted',
        resourceId: profile.id,
        metadata: { licenseNumber: body.flcLicenseNum ?? '' },
      });

      if (updated.licenseType === LicenseType.flc && updated.flcLicenseNum) {
        try {
          await enqueueFlcVerify({
            employerId: updated.id,
            tenantId: updated.tenantId,
            reason: 'license_changed',
            jobKey: `flc-verify-${updated.id}-${updated.updatedAt.toISOString()}`,
          });
        } catch (e) {
          console.error('[employer.patch] FLC verify enqueue failed', {
            employerId: updated.id,
            err: e instanceof Error ? e.message : String(e),
          });
        }
      }
    }

    return ok(c, { employer: shapeEmployer(updated) });
  },
);

employerOnboardingRoutes.get('/me', requireTenant, async (c) => {
  const employerId = c.var.employerId;
  if (!employerId) return err(c, 404, 'not_found');
  const profile = await c.var.db.employerProfile.findUnique({ where: { id: employerId } });
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

function generateTenantSlug(legalName: string): string {
  const base = legalName
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .slice(0, 40);
  const suffix = Math.random().toString(36).slice(2, 8);
  return `${base || 'tenant'}-${suffix}`;
}

// Type re-export so the routes file is a leaf for the API surface.
export type { Tx };
