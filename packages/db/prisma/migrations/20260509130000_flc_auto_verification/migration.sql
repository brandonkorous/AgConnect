-- =============================================================================
-- AGCONN — Automated FLC verification (CA DIR/DLSE + DOL MSPA)
-- =============================================================================
--
-- Backs the marketing claim that AGCONN checks every Farm Labor Contractor
-- license against the California DIR/DLSE registry on signup and re-verifies
-- nightly. Two registries, two architectures:
--
--   1. CA DIR/DLSE — server-side HTTP scrape of the Salesforce Visualforce
--      search at cadir.my.salesforce-sites.com/RegistrationSearch. Per-employer
--      job, runs on signup + nightly sweep. Result columns live on
--      employer_profiles directly.
--
--   2. DOL MSPA — bulk dataset sync from data.gov, ingested into a local
--      reference table. Per-employer "verification" is then a SQL lookup,
--      not an outbound HTTP call. The dataset only contains *active*
--      certificates, so absence === not registered.
--
-- The existing manual admin verify/reject/re-verify endpoints stay as the
-- fail-soft fallback when DLSE is unreachable, returns a CAPTCHA challenge,
-- or reports an unexpected status.
--
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. New enum: FlcCheckStatus — outcome of the most recent DLSE check.
-- ---------------------------------------------------------------------------

CREATE TYPE "FlcCheckStatus" AS ENUM (
  'active',
  'expired',
  'not_found',
  'suspended',
  'error',
  'captcha_blocked',
  'not_applicable'
);

-- ---------------------------------------------------------------------------
-- 2. Extend VerificationAction enum with the auto-verification transitions.
--    Postgres cannot drop enum values without a table rewrite, so additions
--    are append-only by convention.
-- ---------------------------------------------------------------------------

ALTER TYPE "VerificationAction" ADD VALUE IF NOT EXISTS 'auto_verify_started';
ALTER TYPE "VerificationAction" ADD VALUE IF NOT EXISTS 'auto_verify_succeeded';
ALTER TYPE "VerificationAction" ADD VALUE IF NOT EXISTS 'auto_verify_failed';
ALTER TYPE "VerificationAction" ADD VALUE IF NOT EXISTS 'mspa_match_found';
ALTER TYPE "VerificationAction" ADD VALUE IF NOT EXISTS 'mspa_match_missing';

-- ---------------------------------------------------------------------------
-- 3. employer_profiles: snapshot of last DLSE + MSPA check.
-- ---------------------------------------------------------------------------

ALTER TABLE "employer_profiles"
  ADD COLUMN "flc_last_checked_at"        TIMESTAMP(3),
  ADD COLUMN "flc_check_status"           "FlcCheckStatus",
  ADD COLUMN "flc_expires_at"             DATE,
  ADD COLUMN "flc_legal_name_on_record"   TEXT,
  ADD COLUMN "mspa_verified_at"           TIMESTAMP(3),
  ADD COLUMN "mspa_expires_at"            DATE,
  ADD COLUMN "mspa_auth_housing"          BOOLEAN,
  ADD COLUMN "mspa_auth_transport"        BOOLEAN,
  ADD COLUMN "mspa_auth_driving"          BOOLEAN;

-- The nightly sweep orders by flc_last_checked_at NULLS FIRST so the index
-- needs to be sorted that way to be useful.
CREATE INDEX "employer_profiles_flc_last_checked_at_idx"
  ON "employer_profiles" ("flc_last_checked_at");

-- ---------------------------------------------------------------------------
-- 4. mspa_flc_registry — local cache of the federal MSPA FLC dataset.
--
--    Platform-level reference data. No tenant_id — every tenant reads the
--    same source of truth. The DOL publishes only currently-active
--    certificates; rows that disappear from a refresh get soft-deleted via
--    removed_at so we can detect lapses without losing history.
-- ---------------------------------------------------------------------------

CREATE TABLE "mspa_flc_registry" (
  "id"                 UUID         NOT NULL DEFAULT gen_random_uuid(),
  "certificate_number" TEXT         NOT NULL,
  "legal_name"         TEXT         NOT NULL,
  "street_address"     TEXT,
  "city"               TEXT,
  "state_code"         TEXT,
  "postal_code"        TEXT,
  "expiration_date"    DATE         NOT NULL,
  "auth_housing"       BOOLEAN      NOT NULL DEFAULT false,
  "auth_transport"     BOOLEAN      NOT NULL DEFAULT false,
  "auth_driving"       BOOLEAN      NOT NULL DEFAULT false,
  "synced_at"          TIMESTAMP(3) NOT NULL DEFAULT NOW(),
  "removed_at"         TIMESTAMP(3),
  CONSTRAINT "mspa_flc_registry_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "mspa_flc_registry_certificate_number_key"
  ON "mspa_flc_registry" ("certificate_number");
CREATE INDEX "mspa_flc_registry_legal_name_idx"
  ON "mspa_flc_registry" ("legal_name");
CREATE INDEX "mspa_flc_registry_synced_at_idx"
  ON "mspa_flc_registry" ("synced_at");

-- ---------------------------------------------------------------------------
-- 5. mspa_sync_run — observability for the nightly bulk sync.
-- ---------------------------------------------------------------------------

CREATE TABLE "mspa_sync_run" (
  "id"                 UUID         NOT NULL DEFAULT gen_random_uuid(),
  "started_at"         TIMESTAMP(3) NOT NULL DEFAULT NOW(),
  "finished_at"        TIMESTAMP(3),
  "status"             TEXT         NOT NULL DEFAULT 'running',
  "rows_added"         INTEGER      NOT NULL DEFAULT 0,
  "rows_updated"       INTEGER      NOT NULL DEFAULT 0,
  "rows_removed"       INTEGER      NOT NULL DEFAULT 0,
  "source_url"         TEXT,
  "source_updated_at"  TIMESTAMP(3),
  "error_message"      TEXT,
  CONSTRAINT "mspa_sync_run_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "mspa_sync_run_started_at_idx"
  ON "mspa_sync_run" ("started_at");

-- ---------------------------------------------------------------------------
-- 6. RLS — both new tables are platform-level. The flc-verifier worker writes
--    them under role='service'; everyone else reads them as reference data.
-- ---------------------------------------------------------------------------

ALTER TABLE "mspa_flc_registry" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "mspa_sync_run"     ENABLE ROW LEVEL SECURITY;

CREATE POLICY "mspa_flc_registry_read"    ON "mspa_flc_registry"
  AS PERMISSIVE FOR SELECT
  USING (true);

CREATE POLICY "mspa_flc_registry_service" ON "mspa_flc_registry"
  AS PERMISSIVE FOR ALL
  USING      (current_setting('app.role', true) IN ('service', 'admin'))
  WITH CHECK (current_setting('app.role', true) IN ('service', 'admin'));

CREATE POLICY "mspa_sync_run_admin_read"  ON "mspa_sync_run"
  AS PERMISSIVE FOR SELECT
  USING (current_setting('app.role', true) IN ('service', 'admin'));

CREATE POLICY "mspa_sync_run_service"     ON "mspa_sync_run"
  AS PERMISSIVE FOR ALL
  USING      (current_setting('app.role', true) IN ('service', 'admin'))
  WITH CHECK (current_setting('app.role', true) IN ('service', 'admin'));
