-- =============================================================================
-- AgConn — Multi-tenant RLS + default public tenant seed
-- =============================================================================
--
-- Adds Row-Level Security with FORCE on every business-data table and
-- seeds the default public tenant used by /v1/landing/* (unauthenticated
-- waitlist signups, marketing surfaces).
--
-- Roles (set via `SET LOCAL app.role = '...'` per request/job):
--   - admin    — bypasses tenant scoping; used by migrations, seeds, ops tooling
--   - service  — tenant-scoped read/write; used by /v1/landing/* and the worker
--   - webhook  — cross-tenant access on email_log + email_suppression only;
--                used by Resend webhook handler (verified by signature)
--
-- A connection that sets neither `app.role` nor `app.tenant_id` reads/writes
-- nothing — fail-closed by design.
-- =============================================================================

-- 1. Seed default public tenant BEFORE enabling RLS.
INSERT INTO "tenants" ("id", "slug", "name", "is_public", "settings", "updated_at")
  VALUES (
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'public',
    'AgConn Public',
    true,
    '{}',
    NOW()
  );

-- 2. Enable RLS + FORCE on all protected tables.
--    FORCE means table owners (Prisma's connection user) are also bound by RLS.
ALTER TABLE "tenants"           ENABLE ROW LEVEL SECURITY;
ALTER TABLE "tenants"           FORCE  ROW LEVEL SECURITY;
ALTER TABLE "waitlist"          ENABLE ROW LEVEL SECURITY;
ALTER TABLE "waitlist"          FORCE  ROW LEVEL SECURITY;
ALTER TABLE "email_log"         ENABLE ROW LEVEL SECURITY;
ALTER TABLE "email_log"         FORCE  ROW LEVEL SECURITY;
ALTER TABLE "email_suppression" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "email_suppression" FORCE  ROW LEVEL SECURITY;

-- 3. Admin policies — full access when app.role = 'admin'.
--    Used by migrations, seed scripts, and ops/admin tooling.
CREATE POLICY "tenants_admin" ON "tenants"
  AS PERMISSIVE FOR ALL
  USING      (current_setting('app.role', true) = 'admin')
  WITH CHECK (current_setting('app.role', true) = 'admin');

CREATE POLICY "waitlist_admin" ON "waitlist"
  AS PERMISSIVE FOR ALL
  USING      (current_setting('app.role', true) = 'admin')
  WITH CHECK (current_setting('app.role', true) = 'admin');

CREATE POLICY "email_log_admin" ON "email_log"
  AS PERMISSIVE FOR ALL
  USING      (current_setting('app.role', true) = 'admin')
  WITH CHECK (current_setting('app.role', true) = 'admin');

CREATE POLICY "email_suppression_admin" ON "email_suppression"
  AS PERMISSIVE FOR ALL
  USING      (current_setting('app.role', true) = 'admin')
  WITH CHECK (current_setting('app.role', true) = 'admin');

-- 4. Service policies — tenant-scoped, used by /v1/landing/* and the worker.
--    Reads/writes only succeed when the row's tenant_id matches the pinned
--    app.tenant_id session var.
CREATE POLICY "tenants_service_select" ON "tenants"
  AS PERMISSIVE FOR SELECT
  USING (
    current_setting('app.role', true) = 'service'
    AND "id" = current_setting('app.tenant_id', true)::uuid
  );

CREATE POLICY "waitlist_service" ON "waitlist"
  AS PERMISSIVE FOR ALL
  USING (
    current_setting('app.role', true) = 'service'
    AND "tenant_id" = current_setting('app.tenant_id', true)::uuid
  )
  WITH CHECK (
    current_setting('app.role', true) = 'service'
    AND "tenant_id" = current_setting('app.tenant_id', true)::uuid
  );

CREATE POLICY "email_log_service" ON "email_log"
  AS PERMISSIVE FOR ALL
  USING (
    current_setting('app.role', true) = 'service'
    AND "tenant_id" = current_setting('app.tenant_id', true)::uuid
  )
  WITH CHECK (
    current_setting('app.role', true) = 'service'
    AND "tenant_id" = current_setting('app.tenant_id', true)::uuid
  );

-- email_suppression is global (no tenant_id) — CAN-SPAM is per-address.
-- Service and webhook roles can read/write across all tenants.
CREATE POLICY "email_suppression_service" ON "email_suppression"
  AS PERMISSIVE FOR ALL
  USING      (current_setting('app.role', true) IN ('service', 'webhook'))
  WITH CHECK (current_setting('app.role', true) IN ('service', 'webhook'));

-- 5. Webhook policies — narrow cross-tenant access for Resend delivery events.
--    The webhook endpoint verifies the Resend signature before setting this
--    role, so the cross-tenant breadth here is gated by HMAC, not by tenancy.
CREATE POLICY "email_log_webhook" ON "email_log"
  AS PERMISSIVE FOR ALL
  USING      (current_setting('app.role', true) = 'webhook')
  WITH CHECK (current_setting('app.role', true) = 'webhook');
