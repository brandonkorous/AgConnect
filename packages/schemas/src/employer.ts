import { z } from 'zod';
import { AddressInputSchema } from './address.js';
import { CountyEnum } from './common.js';
import { EmployerPlanTierEnum, PlanIntervalEnum } from './plans.js';

export const LicenseTypeEnum = z.enum(['grower', 'flc', 'labor_contractor']);
export type LicenseType = z.infer<typeof LicenseTypeEnum>;

export const VerificationStatusEnum = z.enum(['pending', 'verified', 'rejected']);
export type VerificationStatus = z.infer<typeof VerificationStatusEnum>;

export const FlcCheckStatusEnum = z.enum([
  'active',
  'expired',
  'not_found',
  'suspended',
  'error',
  'captcha_blocked',
  'not_applicable',
]);
export type FlcCheckStatus = z.infer<typeof FlcCheckStatusEnum>;

const flcLicenseRegex = /^[A-Z0-9-]{4,20}$/;
const einRegex = /^\d{2}-\d{7}$/;

export const EmployerOnboardingBody = z
  .object({
    legalName: z.string().min(2).max(120),
    dbaName: z.string().min(2).max(120).optional(),
    licenseType: LicenseTypeEnum,
    ein: z.string().regex(einRegex, 'ein_format').optional(),
    flcLicenseNum: z.string().regex(flcLicenseRegex, 'flc_license_format').optional(),
    dolMspaNum: z.string().max(40).optional(),
    county: CountyEnum.optional(),
    contactEmail: z.string().email().max(255).optional(),
    contactPhone: z.string().max(20).optional(),
    participatesInH2a: z.boolean().optional(),
    address: AddressInputSchema,
  })
  .strict()
  .refine(
    (b) => b.licenseType !== 'flc' || Boolean(b.flcLicenseNum),
    { message: 'flc_license_required', path: ['flcLicenseNum'] },
  )
  .refine(
    (b) => b.licenseType !== 'grower' || (Boolean(b.ein) && Boolean(b.county)),
    { message: 'grower_fields_required', path: ['ein'] },
  );
export type EmployerOnboardingBody = z.infer<typeof EmployerOnboardingBody>;

export const PatchEmployerBody = z
  .object({
    legalName: z.string().min(2).max(120).optional(),
    dbaName: z.string().min(2).max(120).nullable().optional(),
    flcLicenseNum: z.string().regex(flcLicenseRegex, 'flc_license_format').optional(),
    dolMspaNum: z.string().max(40).nullable().optional(),
    ein: z.string().regex(einRegex, 'ein_format').optional(),
    county: CountyEnum.optional(),
    contactEmail: z.string().email().max(255).nullable().optional(),
    contactPhone: z.string().max(20).nullable().optional(),
    participatesInH2a: z.boolean().optional(),
    address: AddressInputSchema.optional(),
  })
  .strict();
export type PatchEmployerBody = z.infer<typeof PatchEmployerBody>;

export const EmployerProfileSchema = z.object({
  id: z.string().uuid(),
  ownerContactId: z.string().uuid().nullable(),
  tenantId: z.string().uuid(),
  legalName: z.string(),
  dbaName: z.string().nullable(),
  displayName: z.string(),                                // dbaName ?? legalName, computed by API
  contactEmail: z.string().nullable(),
  contactPhone: z.string().nullable(),
  licenseType: LicenseTypeEnum.nullable(),
  ein: z.string().nullable(),
  flcLicenseNum: z.string().nullable(),
  dolMspaNum: z.string().nullable(),
  county: CountyEnum.nullable(),
  streetAddress: z.string().nullable(),
  city: z.string().nullable(),
  stateCode: z.string().nullable(),
  postalCode: z.string().nullable(),
  addressLat: z.number().nullable(),
  addressLng: z.number().nullable(),
  mapboxId: z.string().nullable(),
  flcVerifiedAt: z.string().datetime().nullable(),
  flcLastCheckedAt: z.string().datetime().nullable(),
  flcCheckStatus: FlcCheckStatusEnum.nullable(),
  flcExpiresAt: z.string().date().nullable(),
  flcLegalNameOnRecord: z.string().nullable(),
  mspaVerifiedAt: z.string().datetime().nullable(),
  mspaExpiresAt: z.string().date().nullable(),
  mspaAuthHousing: z.boolean().nullable(),
  mspaAuthTransport: z.boolean().nullable(),
  mspaAuthDriving: z.boolean().nullable(),
  rejectedAt: z.string().datetime().nullable(),
  rejectionReason: z.string().nullable(),
  participatesInH2a: z.boolean(),
  dolLastInspectionAt: z.string().datetime().nullable(),
  dolLastInspectionResult: z.enum(['pass', 'fail', 'pending']).nullable(),
  plan: EmployerPlanTierEnum,
  planInterval: PlanIntervalEnum.nullable(),
  planCurrentPeriodEnd: z.string().datetime().nullable(),
  planCancelAtPeriodEnd: z.boolean(),
  seoSlug: z.string().nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
export type EmployerProfile = z.infer<typeof EmployerProfileSchema>;

export const EmployerMeResponse = z.object({
  employer: EmployerProfileSchema,
  verificationStatus: VerificationStatusEnum,
  rejectionReason: z.string().nullable(),
});

// Admin endpoints --------------------------------------------------------

export const VerifyEmployerBody = z
  .object({
    notes: z.string().max(2000).optional(),
    payload: z
      .object({
        dlseLicenseStatus: z.enum(['active', 'expired', 'unknown']).optional(),
        dlseLicenseNum: z.string().optional(),
        dlseExpiresAt: z.string().date().optional(),
        sosBusinessId: z.string().optional(),
        sosStatus: z.string().optional(),
      })
      .strict()
      .optional(),
  })
  .strict();

export const RejectEmployerBody = z
  .object({
    reason: z.string().min(20).max(2000),
    internalNotes: z.string().max(2000).optional(),
  })
  .strict();

export const PendingEmployersResponse = z.object({
  employers: z.array(
    EmployerProfileSchema.extend({
      submittedAt: z.string().datetime(),
      daysWaiting: z.number().int(),
    }),
  ),
});
