-- =============================================================================
-- AgConn — Anonymous landing role + null-tenant landing/waitlist plumbing
-- =============================================================================
--
-- Removes the PUBLIC_TENANT_ID pattern from the landing surface. The DB-side
-- shape was already 80% there after 20260504200000_three_bucket_tenancy, but
-- two gaps remained:
--
--   1. waitlist confirm / unsubscribe paths run under role='service' WITHOUT
--      app.tenant_id (the row's tenant_id is NULL). The 2026-05-04 policy
--      embedded `current_setting('app.tenant_id', true)::uuid` which throws
--      when the setting is empty. Wrap every cast with NULLIF(...,'')::uuid
--      so an unset/empty session var collapses to NULL and the OR clause
--      handles tenant_id IS NULL rows cleanly.
--
--   2. email_log followed waitlist into the NULL-tenant path (waitlist_*
--      template emails are platform-level — no employer owns them). Make
--      tenant_id nullable on email_log and broaden the service/webhook
--      policies to permit NULL tenant_id rows.
--
-- Also tidies up the waitlist unique constraint: the old (tenant_id, email)
-- unique allowed multiple NULL-tenant rows with the same email (NULL != NULL
-- in unique constraints). Replace with two partial unique indexes — one for
-- NULL-tenant rows and one for tenant-scoped rows.
--
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. waitlist_service: NULLIF wrap so app.tenant_id='' is treated as NULL.
-- ---------------------------------------------------------------------------

DROP POLICY IF EXISTS "waitlist_service" ON "waitlist";

CREATE POLICY "waitlist_service" ON "waitlist"
    AS PERMISSIVE FOR ALL
    USING (
        current_setting('app.role', true) = 'service'
        AND (
            tenant_id IS NULL
            OR tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid
        )
    )
    WITH CHECK (
        current_setting('app.role', true) = 'service'
        AND (
            tenant_id IS NULL
            OR tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid
        )
    );

-- ---------------------------------------------------------------------------
-- 2. waitlist unique constraint: drop the (tenant_id, email) compound unique
--    and replace with two partial unique indexes covering each tenancy bucket.
--    Without this, two anonymous signups with the same email (both NULL
--    tenant_id) would both succeed under the old constraint.
-- ---------------------------------------------------------------------------

DROP INDEX IF EXISTS "waitlist_tenant_email_key";

CREATE UNIQUE INDEX "waitlist_email_anonymous_key" ON "waitlist" ("email")
    WHERE tenant_id IS NULL AND email IS NOT NULL;

CREATE UNIQUE INDEX "waitlist_email_tenant_key" ON "waitlist" ("tenant_id", "email")
    WHERE tenant_id IS NOT NULL AND email IS NOT NULL;

-- ---------------------------------------------------------------------------
-- 3. email_log: tenant_id becomes nullable. Waitlist confirm/welcome emails
--    are platform-level (no owning tenant) and need to write rows with NULL.
-- ---------------------------------------------------------------------------

ALTER TABLE "email_log" ALTER COLUMN "tenant_id" DROP NOT NULL;

DROP POLICY IF EXISTS "email_log_service" ON "email_log";

CREATE POLICY "email_log_service" ON "email_log"
    AS PERMISSIVE FOR ALL
    USING (
        current_setting('app.role', true) = 'service'
        AND (
            tenant_id IS NULL
            OR tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid
        )
    )
    WITH CHECK (
        current_setting('app.role', true) = 'service'
        AND (
            tenant_id IS NULL
            OR tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid
        )
    );

-- email_log_webhook is already cross-tenant (only gated by role='webhook'),
-- so it covers NULL tenant_id rows without modification.
