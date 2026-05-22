-- 20260522120000_audit_partition_rls
--
-- Close an RLS gap on the audit_events partitions.
--
-- audit_events (the parent) is ENABLE + FORCE ROW LEVEL SECURITY with the
-- append-only / tamper-evident policy set (audit_insert, audit_select_admin,
-- audit_update_redact, audit_delete_purge) from 20260430120000_audit_events.
-- A range partition created with CREATE TABLE ... PARTITION OF does NOT
-- inherit those flags: Postgres leaves relrowsecurity off on the child. So a
-- partition is reachable by direct name (audit_events_2026_05, ...) outside
-- the parent's policies. The Supabase RLS advisor surfaced this.
--
-- Fix, two parts:
--   1. Backfill — ENABLE + FORCE on every partition that already exists.
--   2. ensure_audit_partition() — ENABLE + FORCE on each partition at
--      creation time, so the nightly retention top-up never mints another
--      unprotected partition.
--
-- Safety: every code path reads/writes audit rows through the parent
-- (Prisma model `auditEvent` -> table audit_events); nothing references a
-- partition by name except this DDL function. Parent-routed access keeps
-- enforcing the parent's policies as before. Enabling RLS on a partition
-- only governs direct-by-name access, which no code path uses.
--
-- See docs/00-foundation/12-audit-log/ and docs/00-foundation/03-database/04-rls.md.

BEGIN;

-- 1. Backfill existing partitions. regclass keeps names schema-qualified;
--    the loop is partition-count agnostic. ENABLE/FORCE are idempotent.
DO $$
DECLARE
    part regclass;
BEGIN
    FOR part IN
        SELECT inhrelid::regclass
        FROM pg_inherits
        WHERE inhparent = 'public.audit_events'::regclass
    LOOP
        EXECUTE format('ALTER TABLE %s ENABLE ROW LEVEL SECURITY', part);
        EXECUTE format('ALTER TABLE %s FORCE  ROW LEVEL SECURITY', part);
    END LOOP;
END;
$$;

-- 2. Re-define the partition helper so future partitions are secured on
--    creation. Unchanged from 20260430120000_audit_events except the two
--    ALTER TABLE statements inside the IF NOT EXISTS block.
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
        -- New partitions do not inherit the parent's RLS flags; match the
        -- parent so direct-by-name access is governed identically.
        EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', part_name);
        EXECUTE format('ALTER TABLE %I FORCE  ROW LEVEL SECURITY', part_name);
    END IF;
END;
$$;

COMMIT;
