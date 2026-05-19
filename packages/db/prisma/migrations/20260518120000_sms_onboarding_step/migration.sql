-- Phase 3 SMS micro-onboarding state (identity remediation).
-- Two nullable columns on users; no backfill, no RLS change (existing
-- users_* policies cover them). Wrapped in an explicit transaction because
-- prisma migrate is not transactional in this project — a partial apply
-- would leave the schema half-migrated.
BEGIN;

ALTER TABLE "users" ADD COLUMN "sms_onboarding_step" TEXT;
ALTER TABLE "users" ADD COLUMN "sms_onboarding_draft" JSONB;

COMMIT;
