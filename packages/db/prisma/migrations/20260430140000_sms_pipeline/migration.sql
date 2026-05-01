-- SMS pipeline: sms_log (per-send audit) + sms_opt_out (phone-keyed STOP cache).
-- See docs/00-foundation/05-sms-pipeline/02-data-model.md.

CREATE TYPE "SmsStatus" AS ENUM (
    'queued',
    'scheduled',
    'sending',
    'sent',
    'delivered',
    'failed',
    'failed_exhausted',
    'dropped'
);

CREATE TABLE "sms_log" (
    "id"            UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenant_id"     UUID NOT NULL,
    "user_id"       TEXT,
    "template"      TEXT NOT NULL,
    "locale"        "Lang" NOT NULL,
    "to_phone"      TEXT NOT NULL,
    "body"          TEXT NOT NULL,
    "vars"          JSONB NOT NULL DEFAULT '{}',
    "status"        "SmsStatus" NOT NULL DEFAULT 'queued',
    "provider_sid"  TEXT,
    "error_code"    TEXT,
    "opted_out_at"  TIMESTAMP(3),
    "queued_at"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sent_at"       TIMESTAMP(3),
    "delivered_at"  TIMESTAMP(3),
    "failed_at"     TIMESTAMP(3),
    CONSTRAINT sms_log_pkey PRIMARY KEY ("id"),
    CONSTRAINT sms_log_tenant_fk FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT
);

CREATE INDEX "sms_log_tenant_id_idx"        ON "sms_log"("tenant_id");
CREATE INDEX "sms_log_user_id_idx"          ON "sms_log"("user_id");
CREATE INDEX "sms_log_to_phone_idx"         ON "sms_log"("to_phone");
CREATE INDEX "sms_log_template_queued_idx"  ON "sms_log"("template", "queued_at");
CREATE INDEX "sms_log_status_idx"           ON "sms_log"("status");

-- Partial index for the operational dashboard (in-flight rows only).
CREATE INDEX "sms_log_in_flight_idx" ON "sms_log"("queued_at")
    WHERE status IN ('queued', 'scheduled', 'sending');

ALTER TABLE "sms_log" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "sms_log" FORCE ROW LEVEL SECURITY;

CREATE POLICY "sms_log_admin" ON "sms_log"
    USING (current_setting('app.role', true) = 'admin')
    WITH CHECK (current_setting('app.role', true) = 'admin');

CREATE POLICY "sms_log_service" ON "sms_log"
    USING (current_setting('app.role', true) IN ('service', 'system', 'webhook'))
    WITH CHECK (current_setting('app.role', true) IN ('service', 'system', 'webhook'));

CREATE POLICY "sms_log_self" ON "sms_log"
    FOR SELECT
    USING (
        current_setting('app.role', true) = 'authenticated'
        AND user_id = current_setting('app.user_id', true)
        AND tenant_id = current_setting('app.tenant_id', true)::uuid
    );

CREATE TABLE "sms_opt_out" (
    "phone"        TEXT NOT NULL,
    "opted_out_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "source"       TEXT NOT NULL DEFAULT 'STOP',
    CONSTRAINT sms_opt_out_pkey PRIMARY KEY ("phone")
);

-- Opt-out is global (FCC: per-phone, not per-account). Service + webhook
-- write; admin reads everything; authenticated users may check their own.
ALTER TABLE "sms_opt_out" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "sms_opt_out" FORCE ROW LEVEL SECURITY;

CREATE POLICY "sms_opt_out_admin" ON "sms_opt_out"
    USING (current_setting('app.role', true) = 'admin')
    WITH CHECK (current_setting('app.role', true) = 'admin');

CREATE POLICY "sms_opt_out_service" ON "sms_opt_out"
    USING (current_setting('app.role', true) IN ('service', 'system', 'webhook'))
    WITH CHECK (current_setting('app.role', true) IN ('service', 'system', 'webhook'));
