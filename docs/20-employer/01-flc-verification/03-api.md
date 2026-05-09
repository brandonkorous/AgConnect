# 01 — FLC Verification: API

## Employer-facing

### POST /v1/employer/onboarding

Called after employer signs up via Clerk magic link. Creates `employer_profiles` row.

```ts
const EmployerOnboardingBody = z.object({
  legalName: z.string().min(2).max(120),                              // legal entity name (Stripe, 1099, MSA, DLSE comparison)
  dbaName: z.string().min(2).max(120).optional(),                     // public-facing name if different from legal
  licenseType: z.enum(['grower', 'flc', 'labor_contractor']),
  ein: z.string().regex(/^\d{2}-\d{7}$/).optional(),                  // grower
  flcLicenseNum: z.string().regex(/^[A-Z0-9-]{4,20}$/).optional(),    // FLC
  dolMspaNum: z.string().optional(),
  county: CountyEnum.optional(),
  contactEmail: z.string().email().optional(),
  contactPhone: z.string().optional(),
}).strict()
  .refine((b) => b.licenseType !== 'flc' || b.flcLicenseNum, 'flc_license_required')
  .refine((b) => b.licenseType !== 'grower' || (b.ein && b.county), 'grower_fields_required');
```

Server:

1. Insert `employer_profiles` row with `flcVerifiedAt = null`.
2. Insert `verification_log` row with action `submitted`.
3. Send `flc_pending` email (informational: "We'll verify within 1 business day").
4. **For FLCs with a license number:** enqueue a `flc.verify` job to pg-boss (`reason: 'onboarding'`). The flc-verifier worker picks it up within seconds and runs the DLSE + MSPA checks. Failure to enqueue is logged but does not fail onboarding — the nightly sweep will pick the employer up.

Response: `{ employer: EmployerProfile, status: 'pending' }`.

The response shape always returns `flcVerifiedAt: null` initially. Clients should poll `GET /v1/employer/me` (or wait for the dashboard refresh) to see the auto-verify outcome — typical end-to-end is 5–15 seconds for the happy path.

### GET /v1/employer/me

Returns current employer profile + verification status. The profile shape now includes the auto-check snapshot fields:

```ts
flcVerifiedAt: string | null;          // ISO 8601, set when DLSE returned Active
flcLastCheckedAt: string | null;       // ISO 8601, last auto-check attempt
flcCheckStatus: 'active' | 'expired' | 'not_found' | 'suspended' | 'error' | 'captcha_blocked' | 'not_applicable' | null;
flcExpiresAt: string | null;           // YYYY-MM-DD, DLSE expiration
flcLegalNameOnRecord: string | null;   // DLSE official legal name
mspaVerifiedAt: string | null;
mspaExpiresAt: string | null;
mspaAuthHousing: boolean | null;
mspaAuthTransport: boolean | null;
mspaAuthDriving: boolean | null;
```

### PATCH /v1/employer/me

Update business details. Triggers re-verification if license number changes:

- If `flcLicenseNum` changes → reset `flcVerifiedAt = null`, log `submitted` action, send pending email, enqueue `flc.verify` (`reason: 'license_changed'`).

## Admin-facing

All under `/admin/v1/employers/*`. Requires `userRole === 'admin'`.

### GET /admin/v1/employers/pending

List employer profiles awaiting verification. Each row now includes the auto-check snapshot fields so the admin can see *why* a row is pending (e.g., DLSE returned `not_found`, vs. a brand-new signup that hasn't been auto-checked yet).

```ts
const PendingResponse = z.object({
  employers: z.array(EmployerProfileSchema.extend({
    submittedAt: z.string().datetime(),
    daysWaiting: z.number(),
  })),
});
```

### POST /admin/v1/employers/:id/recheck

Force a fresh auto-verify pass. Useful when an admin wants to retry a `captcha_blocked` or `error` case without waiting for the nightly sweep, or after the employer has fixed a typo in their license number.

```ts
// no body
```

Returns `{ enqueued: true }`. The actual check completes asynchronously — the admin polls the detail endpoint to see the new snapshot. Returns `422 recheck_only_supports_flc` for grower employers, `422 no_license_number_on_profile` if the FLC license field is empty.

### POST /admin/v1/employers/:id/verify

Manual approve. Used as the fail-soft fallback when DLSE returned an error or CAPTCHA challenge and the admin verified via another channel.

```ts
const VerifyBody = z.object({
  notes: z.string().max(2000).optional(),
  payload: z.object({
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

Manual reject with a reason.

```ts
const RejectBody = z.object({
  reason: z.string().min(20).max(2000),
  internalNotes: z.string().max(2000).optional(),
});
```

### POST /admin/v1/employers/:id/re-verify

Re-verify after the employer updates their license info. Same shape as `verify`. Sets `flcVerifiedAt = now()`, clears any rejection.

## Job-publish gate enforcement

In [02-job-postings/03-api.md](../02-job-postings/03-api.md) `POST /v1/employer/jobs/:id/publish`:

```ts
const employer = await tx.employerProfile.findUnique({ where: { id: c.get('userId') } });
if (!employer.flcVerifiedAt) throw new HTTPException(403, { message: 'employer_not_verified' });
```

## Worker: services/flc-verifier

Three pg-boss queues, one process, one Deployment.

### `flc.verify` (per-employer)

```ts
type FlcVerifyJob = {
  employerId: string;
  tenantId: string;
  reason: 'onboarding' | 'license_changed' | 'nightly_sweep' | 'admin_requested';
};
```

Handler steps:

1. Load employer, short-circuit if not FLC or no license number (writes `flcCheckStatus = not_applicable` so the sweep doesn't keep retrying).
2. Write `auto_verify_started` audit row.
3. Run DLSE check (`src/dlse.ts`):
   - GET the search form; parse out the dynamic Visualforce ViewState + j_id field-name prefix.
   - POST a search for `selectedRecordType=Farm Labor Contractor`, the user's license number, `selectedStatus=ALL`.
   - Parse the result table. Match the row whose registration number equals the searched value.
   - Return one of: `active | expired | suspended | not_found | captcha_blocked | error`.
4. Run MSPA lookup (`src/mspa-lookup.ts`):
   - If employer.dolMspaNum is set, look up by certificate number directly.
   - Otherwise prefix-match on legal name (with business-suffix stripping). Conservative — false positives on common names would auto-stamp the wrong record.
5. In a single transaction:
   - Update `employer_profiles` snapshot fields.
   - If DLSE returned `active` and `flcVerifiedAt` was previously null, promote it to `now()` with `verifiedBy = 'system:flc-verifier'`.
   - Write `auto_verify_succeeded` or `auto_verify_failed` audit row.
   - Write `mspa_match_found` or `mspa_match_missing` audit row.

Retry: pg-boss `retryLimit: 3`, exponential backoff. Singleton key `flc-verify-{employerId}` with 1h dedup window.

### `flc.sweep` (cron, daily at 04:00 UTC)

```ts
async function runFlcSweep() {
  const cutoff = new Date(Date.now() - 24h);
  const due = await prisma.employerProfile.findMany({
    where: {
      licenseType: 'flc',
      deletedAt: null,
      flcLicenseNum: { not: null },
      OR: [{ flcLastCheckedAt: null }, { flcLastCheckedAt: { lt: cutoff } }],
    },
    take: 500,
  });
  for (const e of due) {
    await enqueueFlcVerify({
      employerId: e.id,
      tenantId: e.tenantId,
      reason: 'nightly_sweep',
      jobKey: `flc-verify-${e.id}-${todayISO()}`,  // bypass per-hour dedup
    });
  }
}
```

### `flc.mspa.sync` (cron, daily at 04:30 UTC)

```ts
async function runMspaSync() {
  // 1. data.gov package_show API → discover the current resource URL
  // 2. Compare last_modified to the last completed sync; skip if unchanged.
  // 3. Download CSV, parse rows, upsert into mspa_flc_registry.
  // 4. Soft-delete rows that disappeared from the file (set removedAt = now()).
  // 5. Persist counts to mspa_sync_run for observability.
}
```

If the parser returns zero rows, the sync **fails** rather than nuking the table — almost certainly a parser regression.

## Errors

| code | http | when |
|---|---|---|
| `flc_license_required` | 422 | FLC employer without license |
| `grower_fields_required` | 422 | grower missing EIN or county |
| `employer_not_verified` | 403 | publish before verification |
| `already_verified` | 409 | verify on already-verified |
| `not_admin` | 403 | non-admin hitting `/admin/v1/employers/*` |
| `recheck_only_supports_flc` | 422 | `/recheck` called for grower |
| `no_license_number_on_profile` | 422 | `/recheck` called when license field is empty |
