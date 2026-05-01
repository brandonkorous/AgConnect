-- Employer domain: FLC verification, job posting state extension, applicant
-- review (employer-side fields on applications), worker search log + invitations,
-- subscription billing event log. Adds permissions array to users.
-- See docs/20-employer/* for the contracts.

-- ============================================================================
-- Enums
-- ============================================================================
CREATE TYPE "LicenseType"        AS ENUM ('grower', 'flc', 'labor_contractor');
CREATE TYPE "EmployerPlanTier"   AS ENUM ('free', 'pro', 'enterprise');
CREATE TYPE "PlanInterval"       AS ENUM ('monthly', 'yearly');
CREATE TYPE "VerificationAction" AS ENUM ('submitted', 'approved', 'rejected', 're_verified', 'expired');
CREATE TYPE "RejectionReason"    AS ENUM ('not_qualified', 'too_far', 'position_filled', 'no_response', 'other');

-- ============================================================================
-- users.permissions — fine-grained scopes within role
-- ============================================================================
ALTER TABLE "users"
    ADD COLUMN "permissions" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];

-- ============================================================================
-- employer_profiles — extend with verification, plan, Stripe state
-- ============================================================================
ALTER TABLE "employer_profiles"
    ADD COLUMN "dba_name"                  TEXT,
    ADD COLUMN "contact_phone"             TEXT,
    ADD COLUMN "license_type"              "LicenseType",
    ADD COLUMN "ein"                       TEXT,
    ADD COLUMN "flc_license_num"           TEXT,
    ADD COLUMN "dol_mspa_num"              TEXT,
    ADD COLUMN "county"                    "County",
    ADD COLUMN "flc_verified_at"           TIMESTAMP(3),
    ADD COLUMN "verified_by"               TEXT,
    ADD COLUMN "rejected_at"               TIMESTAMP(3),
    ADD COLUMN "rejection_reason"          TEXT,
    ADD COLUMN "signature_name"            TEXT,
    ADD COLUMN "signature_title"           TEXT,
    ADD COLUMN "signature_image_url"       TEXT,
    ADD COLUMN "stripe_customer"           TEXT,
    ADD COLUMN "stripe_sub_id"             TEXT,
    ADD COLUMN "plan"                      "EmployerPlanTier" NOT NULL DEFAULT 'free',
    ADD COLUMN "plan_interval"             "PlanInterval",
    ADD COLUMN "plan_current_period_end"   TIMESTAMP(3),
    ADD COLUMN "plan_cancel_at_period_end" BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN "seo_slug"                  TEXT,
    ADD COLUMN "deleted_at"                TIMESTAMP(3);

-- Backstop: FLC employers must have a license number once licenseType is set.
ALTER TABLE "employer_profiles"
    ADD CONSTRAINT "employer_flc_license_required"
    CHECK (
        license_type IS NULL
        OR license_type <> 'flc'
        OR (flc_license_num IS NOT NULL AND length(trim(flc_license_num)) > 0)
    );

-- Backstop: growers must have an EIN + county once licenseType is set to grower.
ALTER TABLE "employer_profiles"
    ADD CONSTRAINT "employer_grower_fields_required"
    CHECK (
        license_type IS NULL
        OR license_type <> 'grower'
        OR (ein IS NOT NULL AND county IS NOT NULL)
    );

-- Yearly plan implies an interval; free plan must have null interval.
ALTER TABLE "employer_profiles"
    ADD CONSTRAINT "employer_plan_interval_consistency"
    CHECK (
        (plan = 'free'  AND plan_interval IS NULL)
     OR (plan <> 'free' AND plan_interval IS NOT NULL)
    );

CREATE UNIQUE INDEX "employer_profiles_stripe_customer_key" ON "employer_profiles"("stripe_customer");
CREATE UNIQUE INDEX "employer_profiles_seo_slug_key"        ON "employer_profiles"("seo_slug");
CREATE INDEX "employer_profiles_flc_verified_at_idx"        ON "employer_profiles"("flc_verified_at");
CREATE INDEX "employer_profiles_license_type_idx"           ON "employer_profiles"("license_type");

-- ============================================================================
-- job_postings — extend with hire tracking + closed/filled state
-- ============================================================================
ALTER TABLE "job_postings"
    ADD COLUMN "positions_total" INTEGER NOT NULL DEFAULT 1,
    ADD COLUMN "hire_count"      INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN "filled_at"       TIMESTAMP(3),
    ADD COLUMN "closed_at"       TIMESTAMP(3);

-- seo_slug must be nullable so drafts have no slug; flipped to NOT NULL
-- on publish via app logic. Slug is still UNIQUE (treats NULL as distinct).
ALTER TABLE "job_postings"
    ALTER COLUMN "seo_slug" DROP NOT NULL;

ALTER TABLE "job_postings"
    ADD CONSTRAINT "job_postings_title_en_present"   CHECK (length(trim(title_en)) > 0),
    ADD CONSTRAINT "job_postings_title_es_present"   CHECK (length(trim(title_es)) > 0),
    ADD CONSTRAINT "job_postings_desc_en_present"    CHECK (length(trim(description_en)) >= 20),
    ADD CONSTRAINT "job_postings_desc_es_present"    CHECK (length(trim(description_es)) >= 20),
    ADD CONSTRAINT "job_postings_wage_order"         CHECK (wage_min <= wage_max),
    ADD CONSTRAINT "job_postings_date_order"         CHECK (end_date IS NULL OR end_date >= start_date),
    ADD CONSTRAINT "job_postings_positions_positive" CHECK (positions_total >= 1),
    ADD CONSTRAINT "job_postings_slug_when_active"   CHECK (
        (status = 'draft' AND seo_slug IS NULL)
     OR (status <> 'draft' AND seo_slug IS NOT NULL)
    );

CREATE INDEX "job_postings_employer_status_idx" ON "job_postings"("employer_id", "status");

-- ============================================================================
-- applications — employer-side fields
-- ============================================================================
ALTER TABLE "applications"
    ADD COLUMN "employer_note"          VARCHAR(2000),
    ADD COLUMN "rejection_reason"       "RejectionReason",
    ADD COLUMN "rejection_reason_text"  VARCHAR(500);

-- ============================================================================
-- verification_log — audit trail for FLC / grower verification state changes
-- ============================================================================
CREATE TABLE "verification_log" (
    "id"            UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenant_id"     UUID NOT NULL,
    "employer_id"   UUID NOT NULL,
    "action"        "VerificationAction" NOT NULL,
    "actor_user_id" TEXT NOT NULL,
    "notes"         TEXT,
    "payload"       JSONB NOT NULL DEFAULT '{}'::jsonb,
    "created_at"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT verification_log_pkey PRIMARY KEY ("id"),
    CONSTRAINT verification_log_tenant_fk   FOREIGN KEY ("tenant_id")   REFERENCES "tenants"("id")            ON DELETE RESTRICT,
    CONSTRAINT verification_log_employer_fk FOREIGN KEY ("employer_id") REFERENCES "employer_profiles"("id")  ON DELETE CASCADE
);

CREATE INDEX "verification_log_tenant_id_idx"            ON "verification_log"("tenant_id");
CREATE INDEX "verification_log_employer_id_created_idx"  ON "verification_log"("employer_id", "created_at");

-- ============================================================================
-- worker_search_log — analytics + future rate-limit basis
-- ============================================================================
CREATE TABLE "worker_search_log" (
    "id"           UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenant_id"    UUID NOT NULL,
    "employer_id"  UUID NOT NULL,
    "filters"      JSONB NOT NULL,
    "result_count" INTEGER NOT NULL,
    "created_at"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT worker_search_log_pkey PRIMARY KEY ("id"),
    CONSTRAINT worker_search_log_tenant_fk   FOREIGN KEY ("tenant_id")   REFERENCES "tenants"("id")           ON DELETE RESTRICT,
    CONSTRAINT worker_search_log_employer_fk FOREIGN KEY ("employer_id") REFERENCES "employer_profiles"("id") ON DELETE CASCADE
);

CREATE INDEX "worker_search_log_tenant_created_idx"  ON "worker_search_log"("tenant_id", "created_at");
CREATE INDEX "worker_search_log_employer_created_idx" ON "worker_search_log"("employer_id", "created_at");

-- ============================================================================
-- worker_invitations — Pro+ employer invites a worker to apply
-- ============================================================================
CREATE TABLE "worker_invitations" (
    "id"           UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenant_id"    UUID NOT NULL,
    "employer_id"  UUID NOT NULL,
    "worker_id"    TEXT NOT NULL,
    "job_id"       UUID NOT NULL,
    "message"      VARCHAR(500),
    "accepted_at"  TIMESTAMP(3),
    "declined_at"  TIMESTAMP(3),
    "expired_at"   TIMESTAMP(3),
    "created_at"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT worker_invitations_pkey PRIMARY KEY ("id"),
    CONSTRAINT worker_invitations_tenant_fk   FOREIGN KEY ("tenant_id")   REFERENCES "tenants"("id")           ON DELETE RESTRICT,
    CONSTRAINT worker_invitations_employer_fk FOREIGN KEY ("employer_id") REFERENCES "employer_profiles"("id") ON DELETE CASCADE,
    CONSTRAINT worker_invitations_worker_fk   FOREIGN KEY ("worker_id")   REFERENCES "users"("id")             ON DELETE CASCADE,
    CONSTRAINT worker_invitations_job_fk      FOREIGN KEY ("job_id")      REFERENCES "job_postings"("id")      ON DELETE CASCADE,
    CONSTRAINT worker_invitations_unique UNIQUE ("employer_id", "worker_id", "job_id")
);

CREATE INDEX "worker_invitations_tenant_id_idx" ON "worker_invitations"("tenant_id");
CREATE INDEX "worker_invitations_worker_id_idx" ON "worker_invitations"("worker_id");

-- ============================================================================
-- billing_events — append-only Stripe webhook event log
-- ============================================================================
CREATE TABLE "billing_events" (
    "id"               UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenant_id"        UUID NOT NULL,
    "employer_id"      UUID NOT NULL,
    "event_type"       TEXT NOT NULL,
    "stripe_event_id"  TEXT NOT NULL,
    "payload"          JSONB NOT NULL,
    "processed_at"     TIMESTAMP(3),
    "error_msg"        TEXT,
    "created_at"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT billing_events_pkey PRIMARY KEY ("id"),
    CONSTRAINT billing_events_tenant_fk   FOREIGN KEY ("tenant_id")   REFERENCES "tenants"("id")           ON DELETE RESTRICT,
    CONSTRAINT billing_events_employer_fk FOREIGN KEY ("employer_id") REFERENCES "employer_profiles"("id") ON DELETE CASCADE
);

CREATE UNIQUE INDEX "billing_events_stripe_event_id_key" ON "billing_events"("stripe_event_id");
CREATE INDEX "billing_events_tenant_id_idx"              ON "billing_events"("tenant_id");
CREATE INDEX "billing_events_employer_created_idx"       ON "billing_events"("employer_id", "created_at");

-- ============================================================================
-- RLS policies — every new table follows admin / service / authenticated trio.
-- See packages/db/prisma/migrations/20260430140000_worker_domain/migration.sql
-- for the canonical pattern (current_setting('app.role') in {admin, service,
-- webhook, authenticated}).
-- ============================================================================

-- verification_log: admin reads everything, employers see their own log,
-- service writes during admin verification.
ALTER TABLE "verification_log" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "verification_log" FORCE  ROW LEVEL SECURITY;

CREATE POLICY "verification_log_admin" ON "verification_log"
    USING (current_setting('app.role', true) = 'admin')
    WITH CHECK (current_setting('app.role', true) = 'admin');

CREATE POLICY "verification_log_service" ON "verification_log"
    USING (current_setting('app.role', true) IN ('service', 'webhook'))
    WITH CHECK (current_setting('app.role', true) IN ('service', 'webhook'));

CREATE POLICY "verification_log_self_employer" ON "verification_log"
    FOR SELECT
    USING (
        current_setting('app.role', true) = 'authenticated'
        AND tenant_id = current_setting('app.tenant_id', true)::uuid
        AND EXISTS (
            SELECT 1 FROM "employer_profiles" ep
            WHERE ep.id = verification_log.employer_id
              AND ep.user_id = current_setting('app.user_id', true)
        )
    );

-- worker_search_log: admin + service write; employers see their own searches.
ALTER TABLE "worker_search_log" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "worker_search_log" FORCE  ROW LEVEL SECURITY;

CREATE POLICY "worker_search_log_admin" ON "worker_search_log"
    USING (current_setting('app.role', true) = 'admin')
    WITH CHECK (current_setting('app.role', true) = 'admin');

CREATE POLICY "worker_search_log_service" ON "worker_search_log"
    USING (current_setting('app.role', true) IN ('service', 'webhook'))
    WITH CHECK (current_setting('app.role', true) IN ('service', 'webhook'));

CREATE POLICY "worker_search_log_self_employer" ON "worker_search_log"
    USING (
        current_setting('app.role', true) = 'authenticated'
        AND tenant_id = current_setting('app.tenant_id', true)::uuid
        AND EXISTS (
            SELECT 1 FROM "employer_profiles" ep
            WHERE ep.id = worker_search_log.employer_id
              AND ep.user_id = current_setting('app.user_id', true)
        )
    )
    WITH CHECK (
        current_setting('app.role', true) = 'authenticated'
        AND tenant_id = current_setting('app.tenant_id', true)::uuid
        AND EXISTS (
            SELECT 1 FROM "employer_profiles" ep
            WHERE ep.id = worker_search_log.employer_id
              AND ep.user_id = current_setting('app.user_id', true)
        )
    );

-- worker_invitations: admin reads all; employer sees own; worker sees own.
ALTER TABLE "worker_invitations" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "worker_invitations" FORCE  ROW LEVEL SECURITY;

CREATE POLICY "worker_invitations_admin" ON "worker_invitations"
    USING (current_setting('app.role', true) = 'admin')
    WITH CHECK (current_setting('app.role', true) = 'admin');

CREATE POLICY "worker_invitations_service" ON "worker_invitations"
    USING (current_setting('app.role', true) IN ('service', 'webhook'))
    WITH CHECK (current_setting('app.role', true) IN ('service', 'webhook'));

CREATE POLICY "worker_invitations_self_employer" ON "worker_invitations"
    USING (
        current_setting('app.role', true) = 'authenticated'
        AND tenant_id = current_setting('app.tenant_id', true)::uuid
        AND EXISTS (
            SELECT 1 FROM "employer_profiles" ep
            WHERE ep.id = worker_invitations.employer_id
              AND ep.user_id = current_setting('app.user_id', true)
        )
    )
    WITH CHECK (
        current_setting('app.role', true) = 'authenticated'
        AND tenant_id = current_setting('app.tenant_id', true)::uuid
        AND EXISTS (
            SELECT 1 FROM "employer_profiles" ep
            WHERE ep.id = worker_invitations.employer_id
              AND ep.user_id = current_setting('app.user_id', true)
        )
    );

CREATE POLICY "worker_invitations_self_worker" ON "worker_invitations"
    USING (
        current_setting('app.role', true) = 'authenticated'
        AND worker_id = current_setting('app.user_id', true)
    )
    WITH CHECK (
        current_setting('app.role', true) = 'authenticated'
        AND worker_id = current_setting('app.user_id', true)
    );

-- billing_events: admin reads all; employer reads own; service writes from webhook handler.
ALTER TABLE "billing_events" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "billing_events" FORCE  ROW LEVEL SECURITY;

CREATE POLICY "billing_events_admin" ON "billing_events"
    USING (current_setting('app.role', true) = 'admin')
    WITH CHECK (current_setting('app.role', true) = 'admin');

CREATE POLICY "billing_events_service" ON "billing_events"
    USING (current_setting('app.role', true) IN ('service', 'webhook'))
    WITH CHECK (current_setting('app.role', true) IN ('service', 'webhook'));

CREATE POLICY "billing_events_self_employer" ON "billing_events"
    FOR SELECT
    USING (
        current_setting('app.role', true) = 'authenticated'
        AND tenant_id = current_setting('app.tenant_id', true)::uuid
        AND EXISTS (
            SELECT 1 FROM "employer_profiles" ep
            WHERE ep.id = billing_events.employer_id
              AND ep.user_id = current_setting('app.user_id', true)
        )
    );
