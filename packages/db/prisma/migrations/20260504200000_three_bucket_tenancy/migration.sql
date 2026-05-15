-- =============================================================================
-- AGCONN — Three-bucket tenancy model
-- =============================================================================
--
-- Reshapes data isolation from "every table tenant-scoped" to three buckets:
--
--   1. Employer-private (tenant-scoped):  applications, payroll, compliance,
--      messages, crews, shifts, employer_profiles, billing_events, ...
--
--   2. Worker-owned (platform-level, no tenant): worker_profiles,
--      saved_searches, search_views.
--
--   3. Marketplace (cross-tenant readable when published): job_postings,
--      training_programs.
--
-- Hiring records (Bucket 4) span the boundary: tenant-scoped from the
-- employer side, worker-self-accessible via worker_id / participant_id.
--
-- Roles:
--   - admin          — full bypass; ops/migrations/seeds.
--   - service        — background workers (sms-worker, email-worker, etc.).
--                       Pin app.tenant_id explicitly when targeting a tenant.
--   - webhook        — narrow cross-tenant access (resend webhook).
--   - authenticated  — interactive user. May or may not have app.tenant_id
--                       set: workers don't, employers do.
--   - anonymous      — landing/public marketplace pre-auth. No tenant_id,
--                       no user_id. Only marketplace SELECT and waitlist
--                       INSERT permitted.
--
-- See docs/00-foundation/01-multi-tenancy/ for the full model.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. Drop policies that reference tenant_id columns we're about to drop on
--    worker-owned (Bucket 2) tables. Worker profiles are platform-level;
--    employers do not read them directly. The search_views insert policy
--    used to scope by tenant_id; replace it with a worker-self check below.
-- ---------------------------------------------------------------------------

DROP POLICY IF EXISTS "worker_profiles_employer_read" ON "worker_profiles";
DROP POLICY IF EXISTS "search_views_insert_authenticated" ON "search_views";

-- ---------------------------------------------------------------------------
-- 2. Drop tenant_id from worker-owned (Bucket 2) tables.
-- ---------------------------------------------------------------------------

ALTER TABLE "worker_profiles" DROP CONSTRAINT IF EXISTS "worker_profiles_tenant_id_fkey";
DROP INDEX IF EXISTS "worker_profiles_tenant_id_idx";
ALTER TABLE "worker_profiles" DROP COLUMN IF EXISTS "tenant_id";

ALTER TABLE "saved_searches" DROP CONSTRAINT IF EXISTS "saved_searches_tenant_id_fkey";
DROP INDEX IF EXISTS "saved_searches_tenant_id_idx";
ALTER TABLE "saved_searches" DROP COLUMN IF EXISTS "tenant_id";

ALTER TABLE "search_views" DROP CONSTRAINT IF EXISTS "search_views_tenant_id_fkey";
DROP INDEX IF EXISTS "search_views_tenant_created_idx";
ALTER TABLE "search_views" DROP COLUMN IF EXISTS "tenant_id";
CREATE INDEX IF NOT EXISTS "search_views_worker_id_created_at_idx" ON "search_views"("worker_id", "created_at");

-- Replace the dropped tenant-scoped insert with a worker-self insert.
-- Workers log their own searches; the row's worker_id must match the
-- authenticated user. NULL worker_id is allowed (anonymous browse) only
-- via the service or admin policies.
CREATE POLICY "search_views_self_insert" ON "search_views"
    FOR INSERT
    WITH CHECK (
        current_setting('app.role', true) = 'authenticated'
        AND worker_id = current_setting('app.user_id', true)
    );

-- ---------------------------------------------------------------------------
-- 3. Marketplace policy on job_postings.
--    Replace the tenant-scoped read with a cross-tenant marketplace read.
--    Authenticated users (workers + employers) and anonymous visitors all
--    see active, non-deleted postings regardless of tenant_id.
--    Employer manage policy stays unchanged below this block.
-- ---------------------------------------------------------------------------

DROP POLICY IF EXISTS "job_postings_tenant_read_active" ON "job_postings";

CREATE POLICY "job_postings_marketplace_read" ON "job_postings"
    FOR SELECT
    USING (
        current_setting('app.role', true) IN ('authenticated', 'anonymous', 'service')
        AND status = 'active'
        AND deleted_at IS NULL
    );

-- ---------------------------------------------------------------------------
-- 4. Marketplace policy on training_programs (same shape as job_postings).
-- ---------------------------------------------------------------------------

DROP POLICY IF EXISTS "training_programs_tenant_read_listed" ON "training_programs";

CREATE POLICY "training_programs_marketplace_read" ON "training_programs"
    FOR SELECT
    USING (
        current_setting('app.role', true) IN ('authenticated', 'anonymous', 'service')
        AND status IN ('active', 'full')
        AND deleted_at IS NULL
    );

-- ---------------------------------------------------------------------------
-- 5. Anonymous waitlist insert.
--    Replaces the service-with-public-tenant pattern. Anonymous visitors
--    insert with tenant_id NULL; admin tools may later attach to a tenant.
-- ---------------------------------------------------------------------------

DROP POLICY IF EXISTS "waitlist_service" ON "waitlist";

ALTER TABLE "waitlist" ALTER COLUMN "tenant_id" DROP NOT NULL;

CREATE POLICY "waitlist_anonymous_insert" ON "waitlist"
    FOR INSERT
    WITH CHECK (
        current_setting('app.role', true) = 'anonymous'
        AND tenant_id IS NULL
    );

CREATE POLICY "waitlist_service" ON "waitlist"
    AS PERMISSIVE FOR ALL
    USING (
        current_setting('app.role', true) = 'service'
        AND (tenant_id IS NULL OR tenant_id = current_setting('app.tenant_id', true)::uuid)
    )
    WITH CHECK (
        current_setting('app.role', true) = 'service'
        AND (tenant_id IS NULL OR tenant_id = current_setting('app.tenant_id', true)::uuid)
    );

-- ---------------------------------------------------------------------------
-- 6. Tenant SELECT — let an authenticated user read their own tenant
--    (used by GET /v1/me/tenant). Employers/training-org members only;
--    workers have tenant_id NULL and won't match.
-- ---------------------------------------------------------------------------

DROP POLICY IF EXISTS "tenants_service_select" ON "tenants";

CREATE POLICY "tenants_self_select" ON "tenants"
    FOR SELECT
    USING (
        current_setting('app.role', true) = 'authenticated'
        AND id::text = current_setting('app.tenant_id', true)
    );

-- ---------------------------------------------------------------------------
-- 7. Drop the public-tenant seed and the is_public column.
--    The "public tenant" concept is gone. Anonymous reads have no tenant
--    context; marketplace policies cover what they can see.
-- ---------------------------------------------------------------------------

DELETE FROM "tenants" WHERE "id" = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';

ALTER TABLE "tenants" DROP COLUMN IF EXISTS "is_public";

-- ---------------------------------------------------------------------------
-- 8. users.tenant_id stays nullable (already is). Workers always have it
--    NULL; employers/training-org members have it set at onboarding. No
--    schema change here — confirming the contract for posterity.
-- ---------------------------------------------------------------------------

-- (no-op — assertion only)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'tenant_id' AND is_nullable = 'YES'
  ) THEN
    RAISE EXCEPTION 'users.tenant_id must be nullable in the three-bucket model';
  END IF;
END $$;
