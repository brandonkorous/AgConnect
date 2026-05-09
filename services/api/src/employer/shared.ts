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
    streetAddress: p.streetAddress,
    city: p.city,
    stateCode: p.stateCode,
    postalCode: p.postalCode,
    addressLat: p.addressLat ? Number(p.addressLat) : null,
    addressLng: p.addressLng ? Number(p.addressLng) : null,
    mapboxId: p.mapboxId,
    flcVerifiedAt: p.flcVerifiedAt?.toISOString() ?? null,
    flcLastCheckedAt: p.flcLastCheckedAt?.toISOString() ?? null,
    flcCheckStatus: p.flcCheckStatus,
    flcExpiresAt: p.flcExpiresAt ? p.flcExpiresAt.toISOString().slice(0, 10) : null,
    flcLegalNameOnRecord: p.flcLegalNameOnRecord,
    mspaVerifiedAt: p.mspaVerifiedAt?.toISOString() ?? null,
    mspaExpiresAt: p.mspaExpiresAt ? p.mspaExpiresAt.toISOString().slice(0, 10) : null,
    mspaAuthHousing: p.mspaAuthHousing,
    mspaAuthTransport: p.mspaAuthTransport,
    mspaAuthDriving: p.mspaAuthDriving,
    rejectedAt: p.rejectedAt?.toISOString() ?? null,
    rejectionReason: p.rejectionReason,
    participatesInH2a: p.participatesInH2a,
    dolLastInspectionAt: p.dolLastInspectionAt?.toISOString() ?? null,
    dolLastInspectionResult: p.dolLastInspectionResult,
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
