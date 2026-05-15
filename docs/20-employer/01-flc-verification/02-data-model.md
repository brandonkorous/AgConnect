# 01 — FLC Verification: Data Model

## employer_profiles (extends from kickoff §5.1)

```prisma
model EmployerProfile {
  id                    String           @id @default(uuid()) @db.Uuid
  userId                String           @unique                       @map("user_id")
  tenantId              String           @db.Uuid                      @map("tenant_id")
  clerkOrgId            String?          @unique                       @map("clerk_org_id")
  legalName             String                                          @map("legal_name")    // Stripe customer, 1099, MSA, DLSE comparison
  dbaName               String?                                         @map("dba_name")      // public-facing if different from legal
  contactEmail          String?                                         @map("contact_email")
  licenseType           LicenseType                                     @map("license_type")
  ein                   String?                                                                // grower EIN
  flcLicenseNum         String?                                         @map("flc_license_num")
  dolMspaNum            String?                                         @map("dol_mspa_num")  // federal DOL MSPA registration; optional self-report
  county                County?                                                                // primary county for grower verification

  // ── Verification state (manual + auto) ─────────────────────────────────────
  flcVerifiedAt         DateTime?                                       @map("flc_verified_at")            // promoted to "verified" badge
  flcLastCheckedAt      DateTime?                                       @map("flc_last_checked_at")        // last DLSE auto-check attempt
  flcCheckStatus        FlcCheckStatus?                                 @map("flc_check_status")           // outcome of last DLSE check
  flcExpiresAt          DateTime?        @db.Date                       @map("flc_expires_at")             // DLSE expiration on record
  flcLegalNameOnRecord  String?                                         @map("flc_legal_name_on_record")   // DLSE official legal name
  mspaVerifiedAt        DateTime?                                       @map("mspa_verified_at")           // last successful MSPA registry match
  mspaExpiresAt         DateTime?        @db.Date                       @map("mspa_expires_at")
  mspaAuthHousing       Boolean?                                        @map("mspa_auth_housing")          // authorized to house workers
  mspaAuthTransport     Boolean?                                        @map("mspa_auth_transport")        // authorized to transport workers
  mspaAuthDriving       Boolean?                                        @map("mspa_auth_driving")          // authorized to drive transport vehicles
  verifiedBy            String?                                         @map("verified_by")                // admin user id OR 'system:flc-verifier'
  rejectedAt            DateTime?                                       @map("rejected_at")
  rejectionReason       String?                                         @map("rejection_reason")

  // ... signature, plan, billing, address, etc.

  @@index([flcVerifiedAt])
  @@index([flcLastCheckedAt])
}

enum FlcCheckStatus {
  active
  expired
  not_found
  suspended
  error
  captcha_blocked
  not_applicable     // grower or non-FLC license type
}
```

**Display rule:** the public-facing employer name is `dbaName ?? legalName`. The legal name is used for Stripe customer creation, 1099/tax docs, and the DLSE comparison during verification. Verified-badge tooltip surfaces both: `"AGCONN verified — legal entity: {legalName}"`.

`flcVerifiedAt` is promoted automatically by the worker the first time DLSE returns `Active` for the registered license number. Once promoted, it stays set even if a later check returns an error — the snapshot fields tell the admin what happened, but a transient DLSE outage doesn't strip the badge.

## verification_log (audit)

```prisma
model VerificationLog {
  id              String   @id @default(uuid()) @db.Uuid
  tenantId        String   @db.Uuid              @map("tenant_id")
  employerId      String   @db.Uuid              @map("employer_id")
  action          VerificationAction
  actorUserId     String   @map("actor_user_id")  // 'system:flc-verifier' for auto-attempts
  notes           String?
  payload         Json     @default("{}")
  createdAt       DateTime @default(now())       @map("created_at")
}

enum VerificationAction {
  submitted
  approved
  rejected
  re_verified
  expired
  auto_verify_started      // worker picked up a flc.verify job
  auto_verify_succeeded    // DLSE returned Active; flcVerifiedAt promoted (or kept)
  auto_verify_failed       // any non-active outcome (not_found / expired / suspended / error / captcha_blocked)
  mspa_match_found         // MSPA registry lookup matched
  mspa_match_missing       // MSPA registry lookup missed (employer not in latest sync)
}
```

Every auto-verify attempt writes three rows: `auto_verify_started`, then `auto_verify_succeeded`/`failed`, then `mspa_match_found`/`missing`. The DLSE result payload includes the parsed legal name, expiration date, and full address; the MSPA payload includes the certificate number and authorization flags.

## mspa_flc_registry (platform-level reference data)

Local cache of the federal DOL/WHD MSPA Farm Labor Contractor registry. Synced nightly from `catalog.data.gov/dataset/registered-farm-labor-contractor-listing-5cd50`. No `tenant_id` — every tenant reads the same source of truth.

```prisma
model MspaFlcRegistry {
  id                String   @id @default(uuid()) @db.Uuid
  certificateNumber String   @unique @map("certificate_number")
  legalName         String   @map("legal_name")
  streetAddress     String?  @map("street_address")
  city              String?
  stateCode         String?  @map("state_code")
  postalCode        String?  @map("postal_code")
  expirationDate    DateTime @db.Date @map("expiration_date")
  authHousing       Boolean  @default(false) @map("auth_housing")
  authTransport     Boolean  @default(false) @map("auth_transport")
  authDriving       Boolean  @default(false) @map("auth_driving")
  syncedAt          DateTime @default(now()) @map("synced_at")
  removedAt         DateTime?                @map("removed_at")  // soft-delete when row disappears from upstream
}
```

**Why bulk sync over scrape:** WHD only publishes *active* certificates. A row's absence in the latest sync means the cert lapsed/was revoked. We soft-delete (set `removedAt`) so we keep history but the per-employer lookup excludes them.

## mspa_sync_run (observability)

One-row-per-sync-attempt. Lets the admin surface "data freshness" and lets us alert when the nightly sync fails.

```prisma
model MspaSyncRun {
  id              String   @id @default(uuid()) @db.Uuid
  startedAt       DateTime @default(now()) @map("started_at")
  finishedAt      DateTime?                 @map("finished_at")
  status          String   @default("running")  // running | completed | skipped_unchanged | failed
  rowsAdded       Int      @default(0) @map("rows_added")
  rowsUpdated     Int      @default(0) @map("rows_updated")
  rowsRemoved     Int      @default(0) @map("rows_removed")
  sourceUrl       String?                  @map("source_url")
  sourceUpdatedAt DateTime?                @map("source_updated_at")
  errorMessage    String?                  @map("error_message")
}
```

## Job-publish gate

`job_postings` rows are NOT directly tied to verification — the API layer enforces the gate at publish time:

```ts
// In job-postings publish endpoint
if (employer.licenseType === 'flc' && !employer.flcVerifiedAt) {
  throw new HTTPException(403, { message: 'employer_not_verified' });
}
```

CHECK constraint as backstop:

```sql
ALTER TABLE job_postings ADD CONSTRAINT job_publish_requires_verification
  CHECK (
    status != 'active' OR EXISTS (
      SELECT 1 FROM employer_profiles ep
      WHERE ep.id = job_postings.employer_id
      AND ep.flc_verified_at IS NOT NULL
    )
  );
```

> **Inferred:** The CHECK references another table — Postgres CHECK constraints CAN'T do this directly (they must be column-only). Implement as a trigger or rely on application-layer enforcement plus an integrity-check job. For MVP: application-layer plus tests; add trigger if drift observed.

## RLS

`employer_profiles`:

- Self-read for owner (employer + their org members).
- Public read for verified profiles only (for the public employer profile page):

```sql
CREATE POLICY ep_public_read ON employer_profiles
  FOR SELECT
  USING (flc_verified_at IS NOT NULL AND deleted_at IS NULL);

CREATE POLICY ep_self ON employer_profiles
  FOR ALL
  USING (
    user_id = current_setting('app.user_id', true)
    OR (
      clerk_org_id IS NOT NULL
      AND clerk_org_id = current_setting('app.org_id', true)
    )
  );

CREATE POLICY ep_admin ON employer_profiles
  USING (current_setting('app.role', true) = 'admin');
```

`verification_log`: admin-only read; insert via admin API.

`mspa_flc_registry`: world-read (it's public reference data); writes restricted to `app.role IN ('service', 'admin')` — only the flc-verifier worker writes.

`mspa_sync_run`: read + write restricted to `service` and `admin` roles.

## Indexes

- `employer_profiles(flcVerifiedAt)` — list verified employers
- `employer_profiles(flcLastCheckedAt)` — nightly sweep ordering (`NULLS FIRST` semantics)
- `employer_profiles(seoSlug)` unique — public profile URL
- `employer_profiles(stripeCustomer)` — webhook lookup
- `verification_log(employerId, createdAt)` — audit lookup
- `mspa_flc_registry(certificateNumber)` unique — direct lookup
- `mspa_flc_registry(legalName)` — fuzzy lookup fallback
- `mspa_flc_registry(syncedAt)` — sync-freshness queries
- `mspa_sync_run(startedAt)` — admin freshness display
