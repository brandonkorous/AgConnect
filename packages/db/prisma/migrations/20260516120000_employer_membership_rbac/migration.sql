-- Employer multi-user + role-based membership.
--
--   1. roles            — platform-managed permission-bundle catalog
--                         (tenant_id NULL = global default; the only mode
--                         used today, per-tenant overrides reserved).
--   2. employer_contacts — becomes the membership roster: user_id set => a
--                         platform member scoped by role; null => SMS-only
--                         contact. Adds email + invite lifecycle columns and
--                         replaces the free-text `role` with role_id.
--   3. employer_profiles — ownership moves to a reassignable owner_contact_id
--                         (FK -> employer_contacts); legacy user_id dropped.
--
-- Keep the seed permission arrays in sync with
-- packages/schemas/src/permissions.ts SEED_ROLE_BUNDLES.
-- See docs/00-foundation/02-auth/02-data-model.md.

-- ============================================================================
-- roles
-- ============================================================================
CREATE TABLE "roles" (
    "id"              UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    "tenant_id"       UUID         NULL,
    "key"             TEXT         NOT NULL,
    "permissions"     TEXT[]       NOT NULL DEFAULT ARRAY[]::TEXT[],
    "scope_qualifier" TEXT         NULL,
    "created_at"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at"      TIMESTAMP(3) NOT NULL,
    "deleted_at"      TIMESTAMP(3) NULL,

    CONSTRAINT "roles_tenant_fk"
        FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE
);

-- Two NULLs are distinct in a UNIQUE — partial indexes give the global slot
-- (tenant_id IS NULL) and any future per-tenant override one row per key.
CREATE UNIQUE INDEX "roles_key_platform_uq"
    ON "roles" ("key") WHERE "tenant_id" IS NULL;
CREATE UNIQUE INDEX "roles_key_tenant_uq"
    ON "roles" ("key", "tenant_id") WHERE "tenant_id" IS NOT NULL;
CREATE INDEX "roles_tenant_id_key_idx" ON "roles" ("tenant_id", "key");

-- RLS: global rows readable by any authenticated user / service in any
-- tenant; only admin mutates the catalog.
ALTER TABLE "roles" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "roles" FORCE  ROW LEVEL SECURITY;

CREATE POLICY "roles_admin" ON "roles"
    USING (current_setting('app.role', true) = 'admin')
    WITH CHECK (current_setting('app.role', true) = 'admin');

CREATE POLICY "roles_service" ON "roles"
    FOR SELECT
    USING (
        current_setting('app.role', true) IN ('service', 'webhook')
        AND (tenant_id IS NULL OR tenant_id = current_setting('app.tenant_id', true)::uuid)
    );

CREATE POLICY "roles_tenant_read" ON "roles"
    FOR SELECT
    USING (
        current_setting('app.role', true) = 'authenticated'
        AND (tenant_id IS NULL OR tenant_id = current_setting('app.tenant_id', true)::uuid)
    );

INSERT INTO "roles" ("tenant_id","key","permissions","scope_qualifier","updated_at") VALUES
  (NULL, 'owner',      ARRAY['*']::TEXT[], NULL, CURRENT_TIMESTAMP),
  (NULL, 'manager',    ARRAY['jobs.read','jobs.write','applicants.read','applicants.write','worker_search.use','crews.read','crews.manage','payroll.read','payroll.manage','compliance.read','reports.read','members.read','flc.read','messaging.use']::TEXT[], NULL, CURRENT_TIMESTAMP),
  (NULL, 'hiring',     ARRAY['jobs.read','applicants.read','applicants.write','worker_search.use','reports.read','messaging.use']::TEXT[], NULL, CURRENT_TIMESTAMP),
  (NULL, 'job_poster', ARRAY['jobs.read','jobs.write']::TEXT[], NULL, CURRENT_TIMESTAMP),
  (NULL, 'compliance', ARRAY['jobs.read','applicants.read','payroll.read','compliance.read','compliance.write','reports.read','flc.read','flc.write']::TEXT[], NULL, CURRENT_TIMESTAMP),
  (NULL, 'reporting',  ARRAY['jobs.read','applicants.read','crews.read','payroll.read','compliance.read','reports.read','flc.read']::TEXT[], NULL, CURRENT_TIMESTAMP),
  (NULL, 'billing',    ARRAY['reports.read','billing.manage']::TEXT[], NULL, CURRENT_TIMESTAMP),
  (NULL, 'foreman',    ARRAY['crews.read','crews.record','payroll.record']::TEXT[], 'self_crew', CURRENT_TIMESTAMP);

-- ============================================================================
-- employer_contacts — membership roster
-- ============================================================================
ALTER TABLE "employer_contacts"
    ADD COLUMN "user_id"               TEXT         NULL,
    ADD COLUMN "email"                 TEXT         NULL,
    ADD COLUMN "role_id"               UUID         NULL,
    ADD COLUMN "invited_at"            TIMESTAMP(3) NULL,
    ADD COLUMN "accepted_at"           TIMESTAMP(3) NULL,
    ADD COLUMN "invite_token_hash"     TEXT         NULL,
    ADD COLUMN "invite_expires_at"     TIMESTAMP(3) NULL,
    ADD COLUMN "invited_by_contact_id" UUID         NULL;

-- Map the legacy free-text role onto a seeded role. An exact key match wins;
-- anything else (including the old 'foreman' default) maps to foreman.
UPDATE "employer_contacts" ec
SET "role_id" = COALESCE(
    (SELECT r.id FROM "roles" r WHERE r.tenant_id IS NULL AND r.key = ec.role),
    (SELECT r.id FROM "roles" r WHERE r.tenant_id IS NULL AND r.key = 'foreman')
);

ALTER TABLE "employer_contacts"
    ALTER COLUMN "role_id" SET NOT NULL,
    DROP COLUMN "role";

ALTER TABLE "employer_contacts"
    ADD CONSTRAINT "employer_contacts_user_fk"
        FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL,
    ADD CONSTRAINT "employer_contacts_role_fk"
        FOREIGN KEY ("role_id") REFERENCES "roles"("id"),
    ADD CONSTRAINT "employer_contacts_invitedby_fk"
        FOREIGN KEY ("invited_by_contact_id") REFERENCES "employer_contacts"("id") ON DELETE SET NULL;

CREATE INDEX "employer_contacts_user_id_idx"           ON "employer_contacts"("user_id");
CREATE INDEX "employer_contacts_role_id_idx"           ON "employer_contacts"("role_id");
CREATE INDEX "employer_contacts_invite_token_hash_idx" ON "employer_contacts"("invite_token_hash");

-- ============================================================================
-- employer_profiles — reassignable owner pointer
-- ============================================================================
ALTER TABLE "employer_profiles"
    ADD COLUMN "owner_contact_id" UUID NULL;

-- Backfill: every existing profile gets an owner contact mirroring its
-- legacy user_id, already accepted (an active member from day one).
WITH ins AS (
    INSERT INTO "employer_contacts"
        ("tenant_id","employer_id","user_id","email","name","phone","role_id","languages","sort_order","accepted_at","updated_at")
    SELECT
        ep."tenant_id",
        ep."id",
        ep."user_id",
        u."email",
        COALESCE(NULLIF(u."email", ''), ep."legal_name", 'Account Owner'),
        COALESCE(u."phone", ep."contact_phone", ''),
        (SELECT r.id FROM "roles" r WHERE r.tenant_id IS NULL AND r.key = 'owner'),
        ARRAY['en','es']::TEXT[],
        0,
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
    FROM "employer_profiles" ep
    JOIN "users" u ON u."id" = ep."user_id"
    RETURNING "id", "employer_id"
)
UPDATE "employer_profiles" ep
SET "owner_contact_id" = ins."id"
FROM ins
WHERE ins."employer_id" = ep."id";

ALTER TABLE "employer_profiles"
    ADD CONSTRAINT "employer_profiles_owner_contact_fk"
        FOREIGN KEY ("owner_contact_id") REFERENCES "employer_contacts"("id");

CREATE UNIQUE INDEX "employer_profiles_owner_contact_id_key"
    ON "employer_profiles"("owner_contact_id");

-- These already-UUID tables key to employer_profiles.id but their ownership
-- policies join employer_profiles and test ep.user_id = app.user_id, so they
-- depend on the column. Drop them before the column; recreated below against
-- the active employer (app.employer_id).
DROP POLICY IF EXISTS "verification_log_self_employer"    ON "verification_log";
DROP POLICY IF EXISTS "worker_search_log_self_employer"   ON "worker_search_log";
DROP POLICY IF EXISTS "worker_invitations_self_employer"  ON "worker_invitations";
DROP POLICY IF EXISTS "billing_events_self_employer"       ON "billing_events";

-- Drop the legacy single-owner linkage (cascades the inline UNIQUE and the
-- employer_profiles_user_fk that depend on the column).
ALTER TABLE "employer_profiles" DROP COLUMN "user_id";

-- ============================================================================
-- Re-key the employer data surface: job_postings / crews / shifts /
-- payroll_periods / compliance_items / conversations carried employer_id =
-- the owner's users.id (TEXT). Re-key to employer_profiles.id (UUID) — the
-- stable account identity under reassignable ownership + multiple members.
-- Mapping uses the owner contact backfilled above. SET NOT NULL is the loud
-- guard: any data row whose old owner does not resolve aborts the migration.
--
-- RLS policies that referenced these columns (= app.user_id) are dropped
-- first (Postgres forbids dropping a column a policy depends on), the
-- columns re-keyed, then the policies recreated against the active employer
-- (app.employer_id, set by the auth middleware to one of the caller's
-- memberships). Worker self / tenant-read / participant policies are
-- untouched. verification_logs / worker_search_logs / worker_invitations /
-- billing_events already key to employer_profiles.id — left as-is.
-- ============================================================================

DROP POLICY IF EXISTS "job_postings_employer_manage"       ON "job_postings";
DROP POLICY IF EXISTS "applications_self_employer"          ON "applications";
DROP POLICY IF EXISTS "application_events_self_employer"    ON "application_events";
DROP POLICY IF EXISTS "crews_self_employer"                 ON "crews";
DROP POLICY IF EXISTS "crew_members_self_employer"          ON "crew_members";
DROP POLICY IF EXISTS "shifts_self_employer"                ON "shifts";
DROP POLICY IF EXISTS "shift_assignments_self_employer"     ON "shift_assignments";
DROP POLICY IF EXISTS "payroll_periods_employer"            ON "payroll_periods";
DROP POLICY IF EXISTS "payroll_lines_employer"              ON "payroll_lines";
DROP POLICY IF EXISTS "compliance_items_employer"           ON "compliance_items";
DROP POLICY IF EXISTS "conversations_employer"              ON "conversations";
DROP POLICY IF EXISTS "cp_employer"                         ON "conversation_participants";

-- job_postings
ALTER TABLE "job_postings" ADD COLUMN "employer_pid" UUID;
UPDATE "job_postings" t SET "employer_pid" = ep."id"
    FROM "employer_profiles" ep
    JOIN "employer_contacts" oc ON oc."id" = ep."owner_contact_id"
    WHERE oc."user_id" = t."employer_id";
ALTER TABLE "job_postings" DROP COLUMN "employer_id";
ALTER TABLE "job_postings" RENAME COLUMN "employer_pid" TO "employer_id";
ALTER TABLE "job_postings" ALTER COLUMN "employer_id" SET NOT NULL;
ALTER TABLE "job_postings" ADD CONSTRAINT "job_postings_employer_fk"
    FOREIGN KEY ("employer_id") REFERENCES "employer_profiles"("id");
CREATE INDEX "job_postings_employer_id_status_idx" ON "job_postings"("employer_id","status");

-- crews
ALTER TABLE "crews" ADD COLUMN "employer_pid" UUID;
UPDATE "crews" t SET "employer_pid" = ep."id"
    FROM "employer_profiles" ep
    JOIN "employer_contacts" oc ON oc."id" = ep."owner_contact_id"
    WHERE oc."user_id" = t."employer_id";
ALTER TABLE "crews" DROP COLUMN "employer_id";
ALTER TABLE "crews" RENAME COLUMN "employer_pid" TO "employer_id";
ALTER TABLE "crews" ALTER COLUMN "employer_id" SET NOT NULL;
ALTER TABLE "crews" ADD CONSTRAINT "crews_employer_fk"
    FOREIGN KEY ("employer_id") REFERENCES "employer_profiles"("id");
CREATE INDEX "crews_employer_id_idx" ON "crews"("employer_id");

-- shifts
ALTER TABLE "shifts" ADD COLUMN "employer_pid" UUID;
UPDATE "shifts" t SET "employer_pid" = ep."id"
    FROM "employer_profiles" ep
    JOIN "employer_contacts" oc ON oc."id" = ep."owner_contact_id"
    WHERE oc."user_id" = t."employer_id";
ALTER TABLE "shifts" DROP COLUMN "employer_id";
ALTER TABLE "shifts" RENAME COLUMN "employer_pid" TO "employer_id";
ALTER TABLE "shifts" ALTER COLUMN "employer_id" SET NOT NULL;
ALTER TABLE "shifts" ADD CONSTRAINT "shifts_employer_fk"
    FOREIGN KEY ("employer_id") REFERENCES "employer_profiles"("id");
CREATE INDEX "shifts_employer_id_shift_date_idx" ON "shifts"("employer_id","shift_date");

-- payroll_periods
ALTER TABLE "payroll_periods" ADD COLUMN "employer_pid" UUID;
UPDATE "payroll_periods" t SET "employer_pid" = ep."id"
    FROM "employer_profiles" ep
    JOIN "employer_contacts" oc ON oc."id" = ep."owner_contact_id"
    WHERE oc."user_id" = t."employer_id";
ALTER TABLE "payroll_periods" DROP COLUMN "employer_id";
ALTER TABLE "payroll_periods" RENAME COLUMN "employer_pid" TO "employer_id";
ALTER TABLE "payroll_periods" ALTER COLUMN "employer_id" SET NOT NULL;
ALTER TABLE "payroll_periods" ADD CONSTRAINT "payroll_periods_employer_fk"
    FOREIGN KEY ("employer_id") REFERENCES "employer_profiles"("id");
CREATE INDEX "payroll_periods_employer_id_start_date_idx" ON "payroll_periods"("employer_id","start_date");

-- compliance_items
ALTER TABLE "compliance_items" ADD COLUMN "employer_pid" UUID;
UPDATE "compliance_items" t SET "employer_pid" = ep."id"
    FROM "employer_profiles" ep
    JOIN "employer_contacts" oc ON oc."id" = ep."owner_contact_id"
    WHERE oc."user_id" = t."employer_id";
ALTER TABLE "compliance_items" DROP COLUMN "employer_id";
ALTER TABLE "compliance_items" RENAME COLUMN "employer_pid" TO "employer_id";
ALTER TABLE "compliance_items" ALTER COLUMN "employer_id" SET NOT NULL;
ALTER TABLE "compliance_items" ADD CONSTRAINT "compliance_items_employer_fk"
    FOREIGN KEY ("employer_id") REFERENCES "employer_profiles"("id");
CREATE UNIQUE INDEX "compliance_items_employer_id_category_item_key_key"
    ON "compliance_items"("employer_id","category","item_key");
CREATE INDEX "compliance_items_employer_id_status_idx" ON "compliance_items"("employer_id","status");

-- conversations
ALTER TABLE "conversations" ADD COLUMN "employer_pid" UUID;
UPDATE "conversations" t SET "employer_pid" = ep."id"
    FROM "employer_profiles" ep
    JOIN "employer_contacts" oc ON oc."id" = ep."owner_contact_id"
    WHERE oc."user_id" = t."employer_id";
ALTER TABLE "conversations" DROP COLUMN "employer_id";
ALTER TABLE "conversations" RENAME COLUMN "employer_pid" TO "employer_id";
ALTER TABLE "conversations" ALTER COLUMN "employer_id" SET NOT NULL;
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_employer_fk"
    FOREIGN KEY ("employer_id") REFERENCES "employer_profiles"("id");
CREATE INDEX "conversations_employer_id_last_message_at_idx"
    ON "conversations"("employer_id","last_message_at");

-- ----------------------------------------------------------------------------
-- Recreate the ownership policies against the active employer profile.
-- ----------------------------------------------------------------------------
CREATE POLICY "job_postings_employer_manage" ON "job_postings"
    USING (current_setting('app.role', true) = 'authenticated'
        AND tenant_id = current_setting('app.tenant_id', true)::uuid
        AND employer_id = NULLIF(current_setting('app.employer_id', true), '')::uuid)
    WITH CHECK (current_setting('app.role', true) = 'authenticated'
        AND tenant_id = current_setting('app.tenant_id', true)::uuid
        AND employer_id = NULLIF(current_setting('app.employer_id', true), '')::uuid);

CREATE POLICY "applications_self_employer" ON "applications"
    USING (current_setting('app.role', true) = 'authenticated'
        AND EXISTS (SELECT 1 FROM "job_postings" j
            WHERE j.id = applications.job_id
              AND j.employer_id = NULLIF(current_setting('app.employer_id', true), '')::uuid))
    WITH CHECK (current_setting('app.role', true) = 'authenticated'
        AND EXISTS (SELECT 1 FROM "job_postings" j
            WHERE j.id = applications.job_id
              AND j.employer_id = NULLIF(current_setting('app.employer_id', true), '')::uuid));

CREATE POLICY "application_events_self_employer" ON "application_events"
    FOR SELECT
    USING (current_setting('app.role', true) = 'authenticated'
        AND EXISTS (SELECT 1 FROM "applications" a
            JOIN "job_postings" j ON j.id = a.job_id
            WHERE a.id = application_events.application_id
              AND j.employer_id = NULLIF(current_setting('app.employer_id', true), '')::uuid));

CREATE POLICY "crews_self_employer" ON "crews"
    USING (current_setting('app.role', true) = 'authenticated'
        AND tenant_id = current_setting('app.tenant_id', true)::uuid
        AND employer_id = NULLIF(current_setting('app.employer_id', true), '')::uuid)
    WITH CHECK (current_setting('app.role', true) = 'authenticated'
        AND tenant_id = current_setting('app.tenant_id', true)::uuid
        AND employer_id = NULLIF(current_setting('app.employer_id', true), '')::uuid);

CREATE POLICY "crew_members_self_employer" ON "crew_members"
    USING (current_setting('app.role', true) = 'authenticated'
        AND tenant_id = current_setting('app.tenant_id', true)::uuid
        AND EXISTS (SELECT 1 FROM "crews" c WHERE c.id = crew_members.crew_id
            AND c.employer_id = NULLIF(current_setting('app.employer_id', true), '')::uuid))
    WITH CHECK (current_setting('app.role', true) = 'authenticated'
        AND tenant_id = current_setting('app.tenant_id', true)::uuid
        AND EXISTS (SELECT 1 FROM "crews" c WHERE c.id = crew_members.crew_id
            AND c.employer_id = NULLIF(current_setting('app.employer_id', true), '')::uuid));

CREATE POLICY "shifts_self_employer" ON "shifts"
    USING (current_setting('app.role', true) = 'authenticated'
        AND tenant_id = current_setting('app.tenant_id', true)::uuid
        AND employer_id = NULLIF(current_setting('app.employer_id', true), '')::uuid)
    WITH CHECK (current_setting('app.role', true) = 'authenticated'
        AND tenant_id = current_setting('app.tenant_id', true)::uuid
        AND employer_id = NULLIF(current_setting('app.employer_id', true), '')::uuid);

CREATE POLICY "shift_assignments_self_employer" ON "shift_assignments"
    USING (current_setting('app.role', true) = 'authenticated'
        AND tenant_id = current_setting('app.tenant_id', true)::uuid
        AND EXISTS (SELECT 1 FROM "shifts" s WHERE s.id = shift_assignments.shift_id
            AND s.employer_id = NULLIF(current_setting('app.employer_id', true), '')::uuid))
    WITH CHECK (current_setting('app.role', true) = 'authenticated'
        AND tenant_id = current_setting('app.tenant_id', true)::uuid
        AND EXISTS (SELECT 1 FROM "shifts" s WHERE s.id = shift_assignments.shift_id
            AND s.employer_id = NULLIF(current_setting('app.employer_id', true), '')::uuid));

CREATE POLICY "payroll_periods_employer" ON "payroll_periods"
    USING (current_setting('app.role', true) = 'authenticated'
        AND tenant_id = current_setting('app.tenant_id', true)::uuid
        AND employer_id = NULLIF(current_setting('app.employer_id', true), '')::uuid)
    WITH CHECK (current_setting('app.role', true) = 'authenticated'
        AND tenant_id = current_setting('app.tenant_id', true)::uuid
        AND employer_id = NULLIF(current_setting('app.employer_id', true), '')::uuid);

CREATE POLICY "payroll_lines_employer" ON "payroll_lines"
    USING (current_setting('app.role', true) = 'authenticated'
        AND tenant_id = current_setting('app.tenant_id', true)::uuid
        AND EXISTS (SELECT 1 FROM "payroll_periods" pp WHERE pp.id = payroll_lines.period_id
            AND pp.employer_id = NULLIF(current_setting('app.employer_id', true), '')::uuid))
    WITH CHECK (current_setting('app.role', true) = 'authenticated'
        AND tenant_id = current_setting('app.tenant_id', true)::uuid
        AND EXISTS (SELECT 1 FROM "payroll_periods" pp WHERE pp.id = payroll_lines.period_id
            AND pp.employer_id = NULLIF(current_setting('app.employer_id', true), '')::uuid));

CREATE POLICY "compliance_items_employer" ON "compliance_items"
    USING (current_setting('app.role', true) = 'authenticated'
        AND tenant_id = current_setting('app.tenant_id', true)::uuid
        AND employer_id = NULLIF(current_setting('app.employer_id', true), '')::uuid)
    WITH CHECK (current_setting('app.role', true) = 'authenticated'
        AND tenant_id = current_setting('app.tenant_id', true)::uuid
        AND employer_id = NULLIF(current_setting('app.employer_id', true), '')::uuid);

CREATE POLICY "conversations_employer" ON "conversations"
    USING (current_setting('app.role', true) = 'authenticated'
        AND tenant_id = current_setting('app.tenant_id', true)::uuid
        AND employer_id = NULLIF(current_setting('app.employer_id', true), '')::uuid)
    WITH CHECK (current_setting('app.role', true) = 'authenticated'
        AND tenant_id = current_setting('app.tenant_id', true)::uuid
        AND employer_id = NULLIF(current_setting('app.employer_id', true), '')::uuid);

CREATE POLICY "cp_employer" ON "conversation_participants"
    USING (current_setting('app.role', true) = 'authenticated'
        AND tenant_id = current_setting('app.tenant_id', true)::uuid
        AND EXISTS (SELECT 1 FROM "conversations" co WHERE co.id = conversation_participants.conversation_id
            AND co.employer_id = NULLIF(current_setting('app.employer_id', true), '')::uuid))
    WITH CHECK (current_setting('app.role', true) = 'authenticated'
        AND tenant_id = current_setting('app.tenant_id', true)::uuid
        AND EXISTS (SELECT 1 FROM "conversations" co WHERE co.id = conversation_participants.conversation_id
            AND co.employer_id = NULLIF(current_setting('app.employer_id', true), '')::uuid));

-- ----------------------------------------------------------------------------
-- employer_contacts: replace the tenant-wide policy with employer scoping so
-- members of one employer cannot read another employer's roster within a
-- shared tenant. Invite-token lookup (caller not yet a member) runs under the
-- service role, which keeps its existing full-access policy.
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "employer_contacts_tenant" ON "employer_contacts";

CREATE POLICY "employer_contacts_employer" ON "employer_contacts"
    USING (current_setting('app.role', true) = 'authenticated'
        AND tenant_id = current_setting('app.tenant_id', true)::uuid
        AND employer_id = NULLIF(current_setting('app.employer_id', true), '')::uuid)
    WITH CHECK (current_setting('app.role', true) = 'authenticated'
        AND tenant_id = current_setting('app.tenant_id', true)::uuid
        AND employer_id = NULLIF(current_setting('app.employer_id', true), '')::uuid);

-- ----------------------------------------------------------------------------
-- Recreate the ownership policies on the already-UUID tables against the
-- active employer (these key to employer_profiles.id directly; the EXISTS
-- join on ep.user_id is replaced by a direct employer_id match).
-- ----------------------------------------------------------------------------
CREATE POLICY "verification_log_self_employer" ON "verification_log"
    FOR SELECT
    USING (current_setting('app.role', true) = 'authenticated'
        AND tenant_id = current_setting('app.tenant_id', true)::uuid
        AND employer_id = NULLIF(current_setting('app.employer_id', true), '')::uuid);

CREATE POLICY "worker_search_log_self_employer" ON "worker_search_log"
    USING (current_setting('app.role', true) = 'authenticated'
        AND tenant_id = current_setting('app.tenant_id', true)::uuid
        AND employer_id = NULLIF(current_setting('app.employer_id', true), '')::uuid)
    WITH CHECK (current_setting('app.role', true) = 'authenticated'
        AND tenant_id = current_setting('app.tenant_id', true)::uuid
        AND employer_id = NULLIF(current_setting('app.employer_id', true), '')::uuid);

CREATE POLICY "worker_invitations_self_employer" ON "worker_invitations"
    USING (current_setting('app.role', true) = 'authenticated'
        AND tenant_id = current_setting('app.tenant_id', true)::uuid
        AND employer_id = NULLIF(current_setting('app.employer_id', true), '')::uuid)
    WITH CHECK (current_setting('app.role', true) = 'authenticated'
        AND tenant_id = current_setting('app.tenant_id', true)::uuid
        AND employer_id = NULLIF(current_setting('app.employer_id', true), '')::uuid);

CREATE POLICY "billing_events_self_employer" ON "billing_events"
    FOR SELECT
    USING (current_setting('app.role', true) = 'authenticated'
        AND tenant_id = current_setting('app.tenant_id', true)::uuid
        AND employer_id = NULLIF(current_setting('app.employer_id', true), '')::uuid);
