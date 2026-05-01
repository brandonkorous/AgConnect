-- Payroll, Compliance, Messaging — three new operational domains.
-- See docs/20-employer/{07-payroll,08-compliance,09-messaging}/02-data-model.md.

-- Enums
CREATE TYPE "PayrollPeriodStatus"  AS ENUM ('draft', 'approved', 'paid');
CREATE TYPE "ComplianceItemStatus" AS ENUM ('ok', 'warn', 'fail');
CREATE TYPE "MessageChannel"       AS ENUM ('app', 'sms', 'whatsapp', 'broadcast');
CREATE TYPE "MessageDirection"     AS ENUM ('inbound', 'outbound');

-- payroll_periods
CREATE TABLE "payroll_periods" (
    "id"              UUID                   PRIMARY KEY DEFAULT gen_random_uuid(),
    "tenant_id"       UUID                   NOT NULL REFERENCES "tenants"("id"),
    "employer_id"     TEXT                   NOT NULL REFERENCES "users"("id"),
    "start_date"      DATE                   NOT NULL,
    "end_date"        DATE                   NOT NULL,
    "pay_date"        DATE                   NOT NULL,
    "status"          "PayrollPeriodStatus"  NOT NULL DEFAULT 'draft',
    "approved_at"     TIMESTAMPTZ,
    "approved_by_id"  TEXT REFERENCES "users"("id"),
    "paid_at"         TIMESTAMPTZ,
    "created_at"      TIMESTAMPTZ            NOT NULL DEFAULT now(),
    "updated_at"      TIMESTAMPTZ            NOT NULL DEFAULT now(),
    CONSTRAINT "payroll_periods_dates" CHECK ("start_date" <= "end_date" AND "pay_date" >= "end_date")
);
CREATE INDEX "payroll_periods_tenant_idx"   ON "payroll_periods"("tenant_id");
CREATE INDEX "payroll_periods_employer_idx" ON "payroll_periods"("employer_id", "start_date");
CREATE INDEX "payroll_periods_status_idx"   ON "payroll_periods"("status");

-- payroll_lines
CREATE TABLE "payroll_lines" (
    "id"               UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    "tenant_id"        UUID         NOT NULL REFERENCES "tenants"("id"),
    "period_id"        UUID         NOT NULL REFERENCES "payroll_periods"("id") ON DELETE CASCADE,
    "worker_user_id"   TEXT         NOT NULL REFERENCES "users"("id"),
    "role"             TEXT,
    "hours"            NUMERIC(6,2) NOT NULL DEFAULT 0,
    "overtime_hours"   NUMERIC(6,2) NOT NULL DEFAULT 0,
    "gross_cents"      INTEGER      NOT NULL DEFAULT 0,
    "bonus_cents"      INTEGER      NOT NULL DEFAULT 0,
    "taxes_cents"      INTEGER      NOT NULL DEFAULT 0,
    "net_cents"        INTEGER      NOT NULL DEFAULT 0,
    "notes"            TEXT,
    "approved_at"      TIMESTAMPTZ,
    "created_at"       TIMESTAMPTZ  NOT NULL DEFAULT now(),
    "updated_at"       TIMESTAMPTZ  NOT NULL DEFAULT now(),
    CONSTRAINT "payroll_lines_unique" UNIQUE ("period_id", "worker_user_id"),
    CONSTRAINT "payroll_lines_nonneg" CHECK (
        "hours" >= 0 AND "overtime_hours" >= 0
        AND "gross_cents" >= 0 AND "bonus_cents" >= 0 AND "taxes_cents" >= 0
    )
);
CREATE INDEX "payroll_lines_tenant_idx" ON "payroll_lines"("tenant_id");
CREATE INDEX "payroll_lines_worker_idx" ON "payroll_lines"("worker_user_id");

-- compliance_items
CREATE TABLE "compliance_items" (
    "id"            UUID                   PRIMARY KEY DEFAULT gen_random_uuid(),
    "tenant_id"     UUID                   NOT NULL REFERENCES "tenants"("id"),
    "employer_id"   TEXT                   NOT NULL REFERENCES "users"("id"),
    "category"      TEXT                   NOT NULL,
    "item_key"      TEXT                   NOT NULL,
    "label"         TEXT                   NOT NULL,
    "status"        "ComplianceItemStatus" NOT NULL DEFAULT 'ok',
    "details"       TEXT,
    "evidence_url"  TEXT,
    "due_at"        TIMESTAMPTZ,
    "resolved_at"   TIMESTAMPTZ,
    "created_at"    TIMESTAMPTZ            NOT NULL DEFAULT now(),
    "updated_at"    TIMESTAMPTZ            NOT NULL DEFAULT now(),
    CONSTRAINT "compliance_items_unique" UNIQUE ("employer_id", "category", "item_key")
);
CREATE INDEX "compliance_items_tenant_idx"        ON "compliance_items"("tenant_id");
CREATE INDEX "compliance_items_employer_status"   ON "compliance_items"("employer_id", "status");
CREATE INDEX "compliance_items_due_idx"           ON "compliance_items"("due_at");

-- conversations
CREATE TABLE "conversations" (
    "id"                UUID              PRIMARY KEY DEFAULT gen_random_uuid(),
    "tenant_id"         UUID              NOT NULL REFERENCES "tenants"("id"),
    "employer_id"       TEXT              NOT NULL REFERENCES "users"("id"),
    "title"             TEXT              NOT NULL,
    "is_group"          BOOLEAN           NOT NULL DEFAULT false,
    "channel"           "MessageChannel"  NOT NULL DEFAULT 'app',
    "pinned_shift_id"   UUID REFERENCES "shifts"("id"),
    "last_message_at"   TIMESTAMPTZ,
    "created_at"        TIMESTAMPTZ       NOT NULL DEFAULT now(),
    "updated_at"        TIMESTAMPTZ       NOT NULL DEFAULT now(),
    "deleted_at"        TIMESTAMPTZ
);
CREATE INDEX "conversations_tenant_idx"   ON "conversations"("tenant_id");
CREATE INDEX "conversations_employer_idx" ON "conversations"("employer_id", "last_message_at");

-- conversation_participants
CREATE TABLE "conversation_participants" (
    "id"               UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    "tenant_id"        UUID         NOT NULL REFERENCES "tenants"("id"),
    "conversation_id"  UUID         NOT NULL REFERENCES "conversations"("id") ON DELETE CASCADE,
    "user_id"          TEXT         NOT NULL REFERENCES "users"("id"),
    "joined_at"        TIMESTAMPTZ  NOT NULL DEFAULT now(),
    "left_at"          TIMESTAMPTZ,
    "unread_count"     INTEGER      NOT NULL DEFAULT 0,
    "last_read_at"     TIMESTAMPTZ,
    CONSTRAINT "conversation_participants_unique" UNIQUE ("conversation_id", "user_id")
);
CREATE INDEX "conversation_participants_tenant_idx" ON "conversation_participants"("tenant_id");
CREATE INDEX "conversation_participants_user_idx"   ON "conversation_participants"("user_id");

-- messages
CREATE TABLE "messages" (
    "id"               UUID                PRIMARY KEY DEFAULT gen_random_uuid(),
    "tenant_id"        UUID                NOT NULL REFERENCES "tenants"("id"),
    "conversation_id"  UUID                NOT NULL REFERENCES "conversations"("id") ON DELETE CASCADE,
    "sender_user_id"   TEXT                NOT NULL REFERENCES "users"("id"),
    "body"             TEXT                NOT NULL,
    "channel"          "MessageChannel"    NOT NULL DEFAULT 'app',
    "direction"        "MessageDirection"  NOT NULL DEFAULT 'outbound',
    "sms_log_id"       UUID,
    "metadata"         JSONB               NOT NULL DEFAULT '{}',
    "created_at"       TIMESTAMPTZ         NOT NULL DEFAULT now(),
    "deleted_at"       TIMESTAMPTZ
);
CREATE INDEX "messages_tenant_idx"               ON "messages"("tenant_id");
CREATE INDEX "messages_conversation_created_idx" ON "messages"("conversation_id", "created_at");
CREATE INDEX "messages_sender_idx"               ON "messages"("sender_user_id");

-- RLS — admin/service unrestricted; employer reads/writes own; worker reads
-- their own message threads + payroll lines.

-- payroll_periods
ALTER TABLE "payroll_periods" ENABLE ROW LEVEL SECURITY; ALTER TABLE "payroll_periods" FORCE ROW LEVEL SECURITY;
CREATE POLICY "payroll_periods_admin"   ON "payroll_periods" USING (current_setting('app.role', true) = 'admin')
    WITH CHECK (current_setting('app.role', true) = 'admin');
CREATE POLICY "payroll_periods_service" ON "payroll_periods" USING (current_setting('app.role', true) IN ('service','webhook'))
    WITH CHECK (current_setting('app.role', true) IN ('service','webhook'));
CREATE POLICY "payroll_periods_employer" ON "payroll_periods"
    USING (current_setting('app.role', true) = 'authenticated'
        AND tenant_id = current_setting('app.tenant_id', true)::uuid
        AND employer_id = current_setting('app.user_id', true))
    WITH CHECK (current_setting('app.role', true) = 'authenticated'
        AND tenant_id = current_setting('app.tenant_id', true)::uuid
        AND employer_id = current_setting('app.user_id', true));

-- payroll_lines
ALTER TABLE "payroll_lines" ENABLE ROW LEVEL SECURITY; ALTER TABLE "payroll_lines" FORCE ROW LEVEL SECURITY;
CREATE POLICY "payroll_lines_admin"   ON "payroll_lines" USING (current_setting('app.role', true) = 'admin')
    WITH CHECK (current_setting('app.role', true) = 'admin');
CREATE POLICY "payroll_lines_service" ON "payroll_lines" USING (current_setting('app.role', true) IN ('service','webhook'))
    WITH CHECK (current_setting('app.role', true) IN ('service','webhook'));
CREATE POLICY "payroll_lines_employer" ON "payroll_lines"
    USING (current_setting('app.role', true) = 'authenticated'
        AND tenant_id = current_setting('app.tenant_id', true)::uuid
        AND EXISTS (SELECT 1 FROM "payroll_periods" pp WHERE pp.id = payroll_lines.period_id
            AND pp.employer_id = current_setting('app.user_id', true)))
    WITH CHECK (current_setting('app.role', true) = 'authenticated'
        AND tenant_id = current_setting('app.tenant_id', true)::uuid
        AND EXISTS (SELECT 1 FROM "payroll_periods" pp WHERE pp.id = payroll_lines.period_id
            AND pp.employer_id = current_setting('app.user_id', true)));
CREATE POLICY "payroll_lines_self_worker" ON "payroll_lines"
    FOR SELECT
    USING (current_setting('app.role', true) = 'authenticated'
        AND worker_user_id = current_setting('app.user_id', true));

-- compliance_items
ALTER TABLE "compliance_items" ENABLE ROW LEVEL SECURITY; ALTER TABLE "compliance_items" FORCE ROW LEVEL SECURITY;
CREATE POLICY "compliance_items_admin"   ON "compliance_items" USING (current_setting('app.role', true) = 'admin')
    WITH CHECK (current_setting('app.role', true) = 'admin');
CREATE POLICY "compliance_items_service" ON "compliance_items" USING (current_setting('app.role', true) IN ('service','webhook'))
    WITH CHECK (current_setting('app.role', true) IN ('service','webhook'));
CREATE POLICY "compliance_items_employer" ON "compliance_items"
    USING (current_setting('app.role', true) = 'authenticated'
        AND tenant_id = current_setting('app.tenant_id', true)::uuid
        AND employer_id = current_setting('app.user_id', true))
    WITH CHECK (current_setting('app.role', true) = 'authenticated'
        AND tenant_id = current_setting('app.tenant_id', true)::uuid
        AND employer_id = current_setting('app.user_id', true));

-- conversations
ALTER TABLE "conversations" ENABLE ROW LEVEL SECURITY; ALTER TABLE "conversations" FORCE ROW LEVEL SECURITY;
CREATE POLICY "conversations_admin"   ON "conversations" USING (current_setting('app.role', true) = 'admin')
    WITH CHECK (current_setting('app.role', true) = 'admin');
CREATE POLICY "conversations_service" ON "conversations" USING (current_setting('app.role', true) IN ('service','webhook'))
    WITH CHECK (current_setting('app.role', true) IN ('service','webhook'));
CREATE POLICY "conversations_employer" ON "conversations"
    USING (current_setting('app.role', true) = 'authenticated'
        AND tenant_id = current_setting('app.tenant_id', true)::uuid
        AND employer_id = current_setting('app.user_id', true))
    WITH CHECK (current_setting('app.role', true) = 'authenticated'
        AND tenant_id = current_setting('app.tenant_id', true)::uuid
        AND employer_id = current_setting('app.user_id', true));
CREATE POLICY "conversations_participant_select" ON "conversations"
    FOR SELECT
    USING (current_setting('app.role', true) = 'authenticated'
        AND EXISTS (SELECT 1 FROM "conversation_participants" cp
            WHERE cp.conversation_id = conversations.id
              AND cp.user_id = current_setting('app.user_id', true)
              AND cp.left_at IS NULL));

-- conversation_participants
ALTER TABLE "conversation_participants" ENABLE ROW LEVEL SECURITY; ALTER TABLE "conversation_participants" FORCE ROW LEVEL SECURITY;
CREATE POLICY "cp_admin"   ON "conversation_participants" USING (current_setting('app.role', true) = 'admin')
    WITH CHECK (current_setting('app.role', true) = 'admin');
CREATE POLICY "cp_service" ON "conversation_participants" USING (current_setting('app.role', true) IN ('service','webhook'))
    WITH CHECK (current_setting('app.role', true) IN ('service','webhook'));
CREATE POLICY "cp_employer" ON "conversation_participants"
    USING (current_setting('app.role', true) = 'authenticated'
        AND tenant_id = current_setting('app.tenant_id', true)::uuid
        AND EXISTS (SELECT 1 FROM "conversations" co WHERE co.id = conversation_participants.conversation_id
            AND co.employer_id = current_setting('app.user_id', true)))
    WITH CHECK (current_setting('app.role', true) = 'authenticated'
        AND tenant_id = current_setting('app.tenant_id', true)::uuid
        AND EXISTS (SELECT 1 FROM "conversations" co WHERE co.id = conversation_participants.conversation_id
            AND co.employer_id = current_setting('app.user_id', true)));
CREATE POLICY "cp_self" ON "conversation_participants"
    FOR SELECT
    USING (current_setting('app.role', true) = 'authenticated'
        AND user_id = current_setting('app.user_id', true));

-- messages
ALTER TABLE "messages" ENABLE ROW LEVEL SECURITY; ALTER TABLE "messages" FORCE ROW LEVEL SECURITY;
CREATE POLICY "messages_admin"   ON "messages" USING (current_setting('app.role', true) = 'admin')
    WITH CHECK (current_setting('app.role', true) = 'admin');
CREATE POLICY "messages_service" ON "messages" USING (current_setting('app.role', true) IN ('service','webhook'))
    WITH CHECK (current_setting('app.role', true) IN ('service','webhook'));
CREATE POLICY "messages_participant" ON "messages"
    USING (current_setting('app.role', true) = 'authenticated'
        AND EXISTS (SELECT 1 FROM "conversation_participants" cp
            WHERE cp.conversation_id = messages.conversation_id
              AND cp.user_id = current_setting('app.user_id', true)
              AND cp.left_at IS NULL))
    WITH CHECK (current_setting('app.role', true) = 'authenticated'
        AND sender_user_id = current_setting('app.user_id', true)
        AND EXISTS (SELECT 1 FROM "conversation_participants" cp
            WHERE cp.conversation_id = messages.conversation_id
              AND cp.user_id = current_setting('app.user_id', true)
              AND cp.left_at IS NULL));
