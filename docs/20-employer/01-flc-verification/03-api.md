# 01 — FLC Verification: API

## Employer-facing

### POST /v1/employer/onboarding

Called after employer signs up via Clerk magic link. Creates `employer_profiles` row.

```ts
const EmployerOnboardingBody = z.object({
  businessName: z.string().min(2).max(120),
  licenseType: z.enum(['grower', 'flc', 'labor_contractor']),
  ein: z.string().regex(/^\d{2}-\d{7}$/).optional(),       // grower
  flcLicenseNum: z.string().regex(/^[A-Z0-9-]{4,20}$/).optional(),     // FLC
  dolMspaNum: z.string().optional(),
  county: CountyEnum.optional(),
  contactPhone: z.string().optional(),
}).strict()
  .refine((b) => b.licenseType !== 'flc' || b.flcLicenseNum, 'flc_license_required')
  .refine((b) => b.licenseType !== 'grower' || (b.ein && b.county), 'grower_fields_required');
```

Server:

1. Insert `employer_profiles` row with `flcVerifiedAt = null`.
2. Insert `verification_log` row with action `submitted`.
3. Send `flc_pending` email (informational: "We'll verify within 1 business day").

Response: `{ employer: EmployerProfile, status: 'pending' }`.

### GET /v1/employer/me

Returns current employer profile + verification status.

```ts
const EmployerMeResponse = z.object({
  employer: EmployerProfileSchema,
  verificationStatus: z.enum(['pending', 'verified', 'rejected']),
  rejectionReason: z.string().nullable(),
});
```

### PATCH /v1/employer/me

Update business details. Triggers re-verification if license number changes:

- If `flcLicenseNum` changes → reset `flcVerifiedAt = null`, log `submitted` action, send pending email.
- Other fields can be updated freely.

## Admin-facing

All under `/admin/v1/employers/*`. Requires `userRole === 'admin'`.

### GET /admin/v1/employers/pending

List employer profiles awaiting verification.

```ts
const PendingResponse = z.object({
  employers: z.array(EmployerProfileSchema.extend({
    submittedAt: z.string().datetime(),
    daysWaiting: z.number(),
  })),
});
```

### POST /admin/v1/employers/:id/verify

Admin marks an employer as verified.

```ts
const VerifyBody = z.object({
  notes: z.string().max(2000).optional(),         // admin's notes about how they verified
  payload: z.object({                              // structured proof
    dlseLicenseStatus: z.enum(['active', 'expired', 'unknown']).optional(),
    dlseLicenseNum: z.string().optional(),
    dlseExpiresAt: z.string().date().optional(),
    sosBusinessId: z.string().optional(),
    sosStatus: z.string().optional(),
  }).optional(),
});
```

Server:

1. Update `employer_profiles.flcVerifiedAt = now()`, `verifiedBy = adminUserId`.
2. Insert `verification_log` row with action `approved`.
3. Send `flc_verified` email to employer.
4. Return updated employer.

### POST /admin/v1/employers/:id/reject

Admin rejects with a reason.

```ts
const RejectBody = z.object({
  reason: z.string().min(20).max(2000),           // human-readable, sent to employer
  internalNotes: z.string().max(2000).optional(),  // admin-only, not sent
});
```

Server:

1. Update `rejectedAt = now()`, `rejectionReason = body.reason`.
2. Insert `verification_log` action `rejected`.
3. Send `flc_rejected` email with the reason.

### POST /admin/v1/employers/:id/re-verify

Re-verify after the employer updates their license info.

Same shape as `verify`. Sets `flcVerifiedAt = now()`, clears any rejection.

## Job-publish gate enforcement

In [02-job-postings/03-api.md](../02-job-postings/03-api.md) `POST /v1/employer/jobs/:id/publish`:

```ts
const employer = await tx.employerProfile.findUnique({ where: { id: c.get('userId') } });
if (!employer.flcVerifiedAt) throw new HTTPException(403, { message: 'employer_not_verified' });
```

## DLSE scraper (Phase 2)

Out of scope for MVP. Sketch:

```ts
// packages/dlse-scraper/src/index.ts
import { chromium } from 'playwright';

export async function checkFlcLicense(licenseNum: string) {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto('https://permits.dir.ca.gov/...');
  await page.fill('#license_num', licenseNum);
  await page.click('#submit');
  await page.waitForSelector('.result');
  const status = await page.textContent('.status');
  const expiresAt = await page.textContent('.expires');
  await browser.close();
  return { status, expiresAt };
}
```

Run nightly via pg-boss cron. Auto-marks `flcVerifiedAt` for matches; flags expired licenses for admin review.

## Errors

| code | http | when |
|---|---|---|
| `flc_license_required` | 422 | FLC employer without license |
| `grower_fields_required` | 422 | grower missing EIN or county |
| `employer_not_verified` | 403 | publish before verification |
| `already_verified` | 409 | verify on already-verified |
| `not_admin` | 403 | non-admin hitting `/admin/v1/employers/*` |
