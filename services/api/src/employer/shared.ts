import type { EmployerProfile as DbEmployerProfile } from '@agconn/db';
import type {
  EmployerProfile,
  VerificationStatus,
} from '@agconn/schemas';

export function shapeEmployer(p: DbEmployerProfile): EmployerProfile {
  return {
    id: p.id,
    userId: p.userId,
    tenantId: p.tenantId,
    legalName: p.legalName,
    dbaName: p.dbaName,
    displayName: p.dbaName ?? p.legalName,
    contactEmail: p.contactEmail,
    contactPhone: p.contactPhone,
    licenseType: p.licenseType,
    ein: p.ein,
    flcLicenseNum: p.flcLicenseNum,
    dolMspaNum: p.dolMspaNum,
    county: p.county,
    flcVerifiedAt: p.flcVerifiedAt?.toISOString() ?? null,
    rejectedAt: p.rejectedAt?.toISOString() ?? null,
    rejectionReason: p.rejectionReason,
    plan: p.plan,
    planInterval: p.planInterval,
    planCurrentPeriodEnd: p.planCurrentPeriodEnd?.toISOString() ?? null,
    planCancelAtPeriodEnd: p.planCancelAtPeriodEnd,
    seoSlug: p.seoSlug,
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
  };
}

export function verificationStatus(p: DbEmployerProfile): VerificationStatus {
  if (p.flcVerifiedAt) return 'verified';
  if (p.rejectedAt) return 'rejected';
  return 'pending';
}

export function isVerified(p: DbEmployerProfile): boolean {
  return Boolean(p.flcVerifiedAt) && !p.deletedAt;
}
