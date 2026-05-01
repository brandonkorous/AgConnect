# 01 — FLC Verification: Data Model

## employer_profiles (extends from kickoff §5.1)

```prisma
model EmployerProfile {
  id                    String           @id @default(uuid()) @db.Uuid
  userId                String           @unique                       @map("user_id")        // FK → User.id (Clerk userId)
  tenantId              String           @db.Uuid                      @map("tenant_id")
  clerkOrgId            String?          @unique                       @map("clerk_org_id")
  legalName             String                                          @map("legal_name")    // legal entity — Stripe customer, 1099, MSA
  dbaName               String?                                         @map("dba_name")      // doing-business-as / public-facing if different from legal
  contactEmail          String?                                         @map("contact_email")
  licenseType           LicenseType                                     @map("license_type")
  ein                   String?                                                                // employer ID number for grower verification
  flcLicenseNum         String?                                         @map("flc_license_num")
  dolMspaNum            String?                                         @map("dol_mspa_num")  // federal DOL MSPA registration number; optional
  county                County?                                                                // primary county for grower verification
  flcVerifiedAt         DateTime?                                       @map("flc_verified_at")
  verifiedBy            String?          @db.Uuid                       @map("verified_by")   // admin user id
  rejectedAt            DateTime?                                       @map("rejected_at")
  rejectionReason       String?                                         @map("rejection_reason")
  signatureName         String?                                         @map("signature_name")  // for cert signing (training orgs share table)
  signatureTitle        String?                                         @map("signature_title")
  signatureImageUrl     String?                                         @map("signature_image_url")
  stripeCustomer        String?                                         @map("stripe_customer")
  stripeSubId           String?                                         @map("stripe_sub_id")
  plan                  EmployerPlanTier @default(free)
  planInterval          PlanInterval?                                   @map("plan_interval")
  planCurrentPeriodEnd  DateTime?                                       @map("plan_current_period_end")
  planCancelAtPeriodEnd Boolean          @default(false)                @map("plan_cancel_at_period_end")
  seoSlug               String           @unique                        @map("seo_slug")
  createdAt             DateTime         @default(now())                @map("created_at")
  updatedAt             DateTime         @updatedAt                     @map("updated_at")
  deletedAt             DateTime?                                       @map("deleted_at")

  user                  User             @relation(fields: [userId], references: [id])

  @@index([tenantId])
  @@index([flcVerifiedAt])
  @@index([licenseType])
  @@index([stripeCustomer])
  @@map("employer_profiles")
}

enum LicenseType      { grower flc labor_contractor }
enum EmployerPlanTier { free pro enterprise }
enum PlanInterval    { monthly yearly }
```

**Display rule:** the public-facing employer name is `dbaName ?? legalName`. The legal name is used for Stripe customer creation, 1099/tax docs, and the DLSE comparison during FLC verification. Verified-badge tooltip surfaces both: `"AgConn verified — legal entity: {legalName}"`.

`flcVerifiedAt` doubles as the verification timestamp for both growers and FLCs (poorly named — could rename to `verifiedAt` post-MVP).

> **Inferred:** Plan tier as enum + env-resolved Stripe price IDs is intentional for MVP. The feature matrix lives in `packages/schemas/src/plans.ts` (compile-time type-safe). Extract to a `plans` table when custom Enterprise contracts, per-tenant pricing, or live A/B price tests arrive — billing event payloads in `billing_events` already let us reconstruct any plan transition history.

## verification_log (audit)

```prisma
model VerificationLog {
  id              String   @id @default(uuid()) @db.Uuid
  tenantId        String   @db.Uuid              @map("tenant_id")
  employerId      String   @db.Uuid              @map("employer_id")
  action          VerificationAction
  actorUserId     String   @db.Uuid              @map("actor_user_id")
  notes           String?
  payload         Json     @default("{}")        // license details checked, links visited
  createdAt       DateTime @default(now())       @map("created_at")

  @@index([tenantId])
  @@index([employerId, createdAt])
  @@map("verification_log")
}

enum VerificationAction { submitted approved rejected re_verified expired }
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

## Indexes

- `employer_profiles(flcVerifiedAt)` — list verified employers
- `employer_profiles(seoSlug)` unique — public profile URL
- `employer_profiles(stripeCustomer)` — webhook lookup (created when first checkout starts)
- `verification_log(employerId, createdAt)` — audit lookup
