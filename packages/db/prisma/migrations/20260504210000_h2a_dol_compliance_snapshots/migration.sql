-- =============================================================================
-- AGCONN — H-2A flag, DOL inspection tracking, compliance score snapshots
-- =============================================================================
--
-- Adds the H-2A program participant flag, DOL inspection columns, and the
-- compliance_score_snapshots table. Originally applied out-of-band via
-- packages/db/scripts/sql/add_h2a_dol_score_snapshots.sql. Converted to a
-- proper migration so a `prisma migrate reset` re-applies it.
-- =============================================================================

-- 1. InspectionResult enum.
DO $$ BEGIN
  CREATE TYPE "InspectionResult" AS ENUM ('pass', 'fail', 'pending');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 2. EmployerProfile new columns.
ALTER TABLE "employer_profiles"
  ADD COLUMN IF NOT EXISTS "participates_in_h2a" BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE "employer_profiles"
  ADD COLUMN IF NOT EXISTS "dol_last_inspection_at" TIMESTAMP(3);

ALTER TABLE "employer_profiles"
  ADD COLUMN IF NOT EXISTS "dol_last_inspection_result" "InspectionResult";

-- 3. ComplianceScoreSnapshot table.
CREATE TABLE IF NOT EXISTS "compliance_score_snapshots" (
  "id"                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "tenant_id"             UUID NOT NULL,
  "employer_profile_id"   UUID NOT NULL,
  "snapshot_date"         DATE NOT NULL,
  "score"                 INTEGER NOT NULL,
  "ok_count"              INTEGER NOT NULL DEFAULT 0,
  "warn_count"            INTEGER NOT NULL DEFAULT 0,
  "fail_count"            INTEGER NOT NULL DEFAULT 0,
  "created_at"            TIMESTAMP(3) NOT NULL DEFAULT now(),
  CONSTRAINT "compliance_score_snapshots_employer_date_unique"
    UNIQUE ("employer_profile_id", "snapshot_date"),
  CONSTRAINT "compliance_score_snapshots_tenant_fkey"
    FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id"),
  CONSTRAINT "compliance_score_snapshots_employer_fkey"
    FOREIGN KEY ("employer_profile_id") REFERENCES "employer_profiles"("id")
);

CREATE INDEX IF NOT EXISTS "compliance_score_snapshots_tenant_idx"
  ON "compliance_score_snapshots" ("tenant_id");

CREATE INDEX IF NOT EXISTS "compliance_score_snapshots_employer_date_idx"
  ON "compliance_score_snapshots" ("employer_profile_id", "snapshot_date");
