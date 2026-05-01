-- Audit log: append-only, HMAC-tamper-evident, monthly range-partitioned.
-- See docs/00-foundation/12-audit-log/ for the full contract.
--
-- Roles in this codebase are application-level identifiers carried via
-- `SET LOCAL app.role = '<name>'` and enforced by RLS policies. We do NOT
-- create Postgres roles; we extend the `app.role` vocabulary with
-- 'audit_purge' (delete-only) and 'audit_redact' (narrow-update).

CREATE TYPE "ActorType" AS ENUM ('worker', 'employer', 'training_org', 'admin', 'system');
CREATE TYPE "AuditOutcome" AS ENUM ('success', 'failure');

-- Parent partitioned table. Compound PK includes occurred_at because each
-- partition needs a local PK and the partitioning column must be in it.
CREATE TABLE "audit_events" (
    "id"               BIGSERIAL,
    "tenant_id"        UUID NOT NULL,
    "occurred_at"      TIMESTAMPTZ NOT NULL DEFAULT now(),
    "actor_type"       "ActorType" NOT NULL,
    "actor_id"         TEXT,
    "actor_role"       TEXT,
    "actor_ip"         INET,
    "actor_user_agent" TEXT,
    "action"           TEXT NOT NULL,
    "resource_type"    TEXT,
    "resource_id"      TEXT,
    "outcome"          "AuditOutcome" NOT NULL DEFAULT 'success',
    "correlation_id"   UUID,
    "metadata"         JSONB NOT NULL DEFAULT '{}'::jsonb,
    "event_hmac"       BYTEA NOT NULL,
    "event_hmac_v"     SMALLINT NOT NULL DEFAULT 1,
    PRIMARY KEY ("id", "occurred_at"),
    CONSTRAINT audit_events_actor_user_agent_len_ck
        CHECK (octet_length(coalesce(actor_user_agent, '')) <= 4096),
    CONSTRAINT audit_events_event_hmac_len_ck
        CHECK (octet_length(event_hmac) = 32),
    CONSTRAINT audit_events_tenant_fk
        FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id")
) PARTITION BY RANGE ("occurred_at");

CREATE INDEX "audit_events_tenant_time_idx"
    ON "audit_events" ("tenant_id", "occurred_at" DESC);
CREATE INDEX "audit_events_tenant_actor_time_idx"
    ON "audit_events" ("tenant_id", "actor_id", "occurred_at" DESC);
CREATE INDEX "audit_events_tenant_resource_idx"
    ON "audit_events" ("tenant_id", "resource_type", "resource_id");
CREATE INDEX "audit_events_tenant_action_time_idx"
    ON "audit_events" ("tenant_id", "action", "occurred_at" DESC);
CREATE INDEX "audit_events_correlation_idx"
    ON "audit_events" ("correlation_id");
CREATE INDEX "audit_events_metadata_gin"
    ON "audit_events" USING gin ("metadata" jsonb_path_ops);

-- Helper: ensure a partition exists for the given month. Idempotent.
CREATE OR REPLACE FUNCTION ensure_audit_partition(month_start DATE)
RETURNS VOID
LANGUAGE plpgsql
AS $$
DECLARE
    part_name TEXT;
    next_start DATE;
BEGIN
    part_name := format('audit_events_%s', to_char(month_start, 'YYYY_MM'));
    next_start := (month_start + INTERVAL '1 month')::date;
    IF NOT EXISTS (SELECT 1 FROM pg_class WHERE relname = part_name) THEN
        EXECUTE format(
            'CREATE TABLE %I PARTITION OF audit_events FOR VALUES FROM (%L) TO (%L)',
            part_name, month_start::timestamptz, next_start::timestamptz
        );
    END IF;
END;
$$;

-- Bootstrap: current month + next 6 months. Retention worker tops up nightly.
DO $$
DECLARE
    base DATE := date_trunc('month', now())::date;
    i INT;
BEGIN
    FOR i IN 0..6 LOOP
        PERFORM ensure_audit_partition((base + (i || ' months')::interval)::date);
    END LOOP;
END;
$$;

-- RLS: append-only at the policy level.
--   INSERT — service/webhook scoped to tenant; admin/system bypass.
--   SELECT — admin / audit_purge / audit_redact only.
--   UPDATE — audit_redact only.
--   DELETE — audit_purge only.
ALTER TABLE "audit_events" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "audit_events" FORCE ROW LEVEL SECURITY;

CREATE POLICY "audit_insert" ON "audit_events"
    FOR INSERT
    WITH CHECK (
        current_setting('app.role', true) IN ('admin', 'system')
        OR (
            current_setting('app.role', true) IN ('service', 'webhook')
            AND tenant_id = current_setting('app.tenant_id', true)::uuid
        )
    );

CREATE POLICY "audit_select_admin" ON "audit_events"
    FOR SELECT
    USING (current_setting('app.role', true) IN ('admin', 'audit_purge', 'audit_redact'));

CREATE POLICY "audit_update_redact" ON "audit_events"
    FOR UPDATE
    USING (current_setting('app.role', true) = 'audit_redact')
    WITH CHECK (current_setting('app.role', true) = 'audit_redact');

CREATE POLICY "audit_delete_purge" ON "audit_events"
    FOR DELETE
    USING (current_setting('app.role', true) = 'audit_purge');
