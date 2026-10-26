-- AG-11: policies that hold up once the app connects as agconn_app, a role that cannot bypass RLS.

CREATE SCHEMA IF NOT EXISTS app;
GRANT USAGE ON SCHEMA app TO PUBLIC;

-- rls.ts sets an unset app.* value to '', which ::uuid rejects; this reads it as NULL so the policy matches nothing.
CREATE OR REPLACE FUNCTION app.setting_uuid(name text) RETURNS uuid
    LANGUAGE sql STABLE
    AS $$ SELECT NULLIF(current_setting(name, true), '')::uuid $$;

-- Helpers run as admin inside the function only, so a policy can ask one narrow question without a policy cycle.
CREATE OR REPLACE FUNCTION app.is_active_employer_conversation(conversation uuid) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path = public, pg_temp
    SET app.role = 'admin'
    AS $$ SELECT EXISTS (SELECT 1 FROM conversations c
            WHERE c.id = conversation AND c.employer_id = app.setting_uuid('app.employer_id')) $$;

CREATE OR REPLACE FUNCTION app.is_active_employer_shift(shift uuid) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path = public, pg_temp
    SET app.role = 'admin'
    AS $$ SELECT EXISTS (SELECT 1 FROM shifts s
            WHERE s.id = shift AND s.employer_id = app.setting_uuid('app.employer_id')) $$;

-- conversations <-> conversation_participants and shifts <-> shift_assignments referenced each other.
DROP POLICY "cp_employer" ON "conversation_participants";
CREATE POLICY "cp_employer" ON "conversation_participants"
    USING (current_setting('app.role', true) = 'authenticated'
        AND tenant_id = app.setting_uuid('app.tenant_id')
        AND app.is_active_employer_conversation(conversation_id))
    WITH CHECK (current_setting('app.role', true) = 'authenticated'
        AND tenant_id = app.setting_uuid('app.tenant_id')
        AND app.is_active_employer_conversation(conversation_id));

DROP POLICY "shift_assignments_self_employer" ON "shift_assignments";
CREATE POLICY "shift_assignments_self_employer" ON "shift_assignments"
    USING (current_setting('app.role', true) = 'authenticated'
        AND tenant_id = app.setting_uuid('app.tenant_id')
        AND app.is_active_employer_shift(shift_id))
    WITH CHECK (current_setting('app.role', true) = 'authenticated'
        AND tenant_id = app.setting_uuid('app.tenant_id')
        AND app.is_active_employer_shift(shift_id));

-- Every remaining policy that casts an app.* setting to uuid reads it through app.setting_uuid instead.
DO $do$
DECLARE
    p record;
    cast_any constant text := '\((?:NULLIF\()?current_setting\(''(app\.[a-z_]+)''::text, true\)(?:, ''''::text\))?\)::uuid';
    fixed text;
    using_sql text;
    check_sql text;
BEGIN
    FOR p IN SELECT schemaname, tablename, policyname, qual, with_check FROM pg_policies
             WHERE schemaname = 'public' AND (qual ~ cast_any OR with_check ~ cast_any)
    LOOP
        using_sql := regexp_replace(p.qual, cast_any, 'app.setting_uuid(''\1''::text)', 'g');
        check_sql := regexp_replace(p.with_check, cast_any, 'app.setting_uuid(''\1''::text)', 'g');
        fixed := format('ALTER POLICY %I ON %I.%I', p.policyname, p.schemaname, p.tablename);
        IF using_sql IS NOT NULL THEN fixed := fixed || format(' USING (%s)', using_sql); END IF;
        IF check_sql IS NOT NULL THEN fixed := fixed || format(' WITH CHECK (%s)', check_sql); END IF;
        EXECUTE fixed;
    END LOOP;
    IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public'
               AND (qual ~ 'current_setting\([^)]*\)\)::uuid' OR with_check ~ 'current_setting\([^)]*\)\)::uuid'
                 OR qual ~ '''''::text\)\)::uuid' OR with_check ~ '''''::text\)\)::uuid')) THEN
        RAISE EXCEPTION 'a policy still casts an app.* setting straight to uuid';
    END IF;
END
$do$;

-- These were ENABLE only, so their owner skipped them.
ALTER TABLE "aewr_rates"        FORCE ROW LEVEL SECURITY;
ALTER TABLE "mspa_flc_registry" FORCE ROW LEVEL SECURITY;
ALTER TABLE "mspa_sync_run"     FORCE ROW LEVEL SECURITY;

-- audit-retention runs as agconn_app, which cannot create partitions, so the helper runs as its owner.
ALTER FUNCTION ensure_audit_partition(date) SECURITY DEFINER SET search_path = public, pg_temp;
REVOKE EXECUTE ON FUNCTION ensure_audit_partition(date) FROM PUBLIC;
