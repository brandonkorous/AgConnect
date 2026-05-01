-- Clerk auth foundation: User mirror, EmployerProfile, AuthEvent webhook log.
-- See docs/00-foundation/02-auth/ for the contract.

CREATE TYPE "UserRole" AS ENUM ('worker', 'employer', 'training_org', 'admin');
CREATE TYPE "AuthEventStatus" AS ENUM ('received', 'processed', 'failed', 'skipped');

-- Users: id = Clerk userId. Mirror of identity; PII for joins.
CREATE TABLE "users" (
    "id"              TEXT NOT NULL,
    "tenant_id"       UUID,
    "role"            "UserRole" NOT NULL,
    "preferred_lang"  "Lang" NOT NULL DEFAULT 'es',
    "email"           TEXT,
    "phone"           TEXT,
    "onboarded"       BOOLEAN NOT NULL DEFAULT false,
    "created_at"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at"      TIMESTAMP(3) NOT NULL,
    CONSTRAINT users_pkey PRIMARY KEY ("id"),
    CONSTRAINT users_tenant_fk FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE SET NULL
);

CREATE INDEX "users_tenant_id_idx" ON "users"("tenant_id");
CREATE INDEX "users_phone_idx" ON "users"("phone");
CREATE INDEX "users_email_idx" ON "users"("email");

-- Employer profiles. One per employer Clerk Organization.
CREATE TABLE "employer_profiles" (
    "id"            UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id"       TEXT NOT NULL UNIQUE,
    "tenant_id"     UUID NOT NULL,
    "clerk_org_id"  TEXT UNIQUE,
    "legal_name"    TEXT NOT NULL,
    "contact_email" TEXT,
    "created_at"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at"    TIMESTAMP(3) NOT NULL,
    CONSTRAINT employer_profiles_pkey PRIMARY KEY ("id"),
    CONSTRAINT employer_profiles_user_fk FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE,
    CONSTRAINT employer_profiles_tenant_fk FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT
);

CREATE INDEX "employer_profiles_tenant_id_idx" ON "employer_profiles"("tenant_id");

-- Clerk webhook events. Idempotent on event id.
CREATE TABLE "auth_events" (
    "id"           UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenant_id"    UUID,
    "user_id"      TEXT,
    "event_type"   TEXT NOT NULL,
    "payload"      JSONB NOT NULL,
    "received_at"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processed_at" TIMESTAMP(3),
    "status"       "AuthEventStatus" NOT NULL DEFAULT 'received',
    "error_msg"    TEXT,
    CONSTRAINT auth_events_pkey PRIMARY KEY ("id"),
    CONSTRAINT auth_events_tenant_fk FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE SET NULL
);

CREATE INDEX "auth_events_tenant_id_idx" ON "auth_events"("tenant_id");
CREATE INDEX "auth_events_user_id_idx" ON "auth_events"("user_id");
CREATE INDEX "auth_events_event_type_received_at_idx" ON "auth_events"("event_type", "received_at");

-- RLS: users + employer_profiles use the standard tenant + admin pattern.
ALTER TABLE "users" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "users" FORCE ROW LEVEL SECURITY;

CREATE POLICY "users_admin" ON "users"
    USING (current_setting('app.role', true) = 'admin')
    WITH CHECK (current_setting('app.role', true) = 'admin');

CREATE POLICY "users_service" ON "users"
    USING (current_setting('app.role', true) IN ('service', 'webhook'))
    WITH CHECK (current_setting('app.role', true) IN ('service', 'webhook'));

CREATE POLICY "users_self" ON "users"
    FOR SELECT
    USING (
        current_setting('app.role', true) = 'authenticated'
        AND id = current_setting('app.user_id', true)
    );

ALTER TABLE "employer_profiles" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "employer_profiles" FORCE ROW LEVEL SECURITY;

CREATE POLICY "employer_profiles_admin" ON "employer_profiles"
    USING (current_setting('app.role', true) = 'admin')
    WITH CHECK (current_setting('app.role', true) = 'admin');

CREATE POLICY "employer_profiles_service" ON "employer_profiles"
    USING (current_setting('app.role', true) IN ('service', 'webhook'))
    WITH CHECK (current_setting('app.role', true) IN ('service', 'webhook'));

CREATE POLICY "employer_profiles_tenant" ON "employer_profiles"
    USING (
        current_setting('app.role', true) = 'authenticated'
        AND tenant_id = current_setting('app.tenant_id', true)::uuid
    );

-- auth_events: admin reads everything; users read their own.
ALTER TABLE "auth_events" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "auth_events" FORCE ROW LEVEL SECURITY;

CREATE POLICY "auth_events_admin" ON "auth_events"
    USING (current_setting('app.role', true) = 'admin')
    WITH CHECK (current_setting('app.role', true) = 'admin');

CREATE POLICY "auth_events_webhook" ON "auth_events"
    USING (current_setting('app.role', true) = 'webhook')
    WITH CHECK (current_setting('app.role', true) = 'webhook');

CREATE POLICY "auth_events_self" ON "auth_events"
    FOR SELECT
    USING (
        current_setting('app.role', true) = 'authenticated'
        AND user_id = current_setting('app.user_id', true)
    );
