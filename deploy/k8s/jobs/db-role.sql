-- Makes agconn_app, the role every AgConnect service connects as. Run as agconn_owner; safe to run again.
-- psql variable: app_password (AGCONN-APP-PASSWORD in kv-agconn-prod-cus).
\set ON_ERROR_STOP on

DO $do$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'agconn_app') THEN
    CREATE ROLE agconn_app LOGIN NOSUPERUSER NOBYPASSRLS NOCREATEDB NOCREATEROLE NOREPLICATION;
  END IF;
END
$do$;
-- Only LOGIN and the password change here: altering SUPERUSER or BYPASSRLS needs those attributes.
ALTER ROLE agconn_app LOGIN PASSWORD :'app_password';

-- Every policy is skipped by a superuser or BYPASSRLS role, so refuse to go on with one.
DO $do$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'agconn_app' AND (rolsuper OR rolbypassrls)) THEN
    RAISE EXCEPTION 'agconn_app is SUPERUSER or BYPASSRLS; row level security would not apply';
  END IF;
  EXECUTE format('GRANT CONNECT, TEMPORARY ON DATABASE %I TO agconn_app', current_database());
END
$do$;

GRANT USAGE ON SCHEMA public TO agconn_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO agconn_app;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO agconn_app;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO agconn_app;

-- Objects that later migrations create as the current role (agconn_owner) get the same grants.
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO agconn_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO agconn_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT EXECUTE ON FUNCTIONS TO agconn_app;

-- pg-boss makes and owns its own tables in this schema; they hold queue rows only and have no RLS.
-- PG 16+: giving agconn_app a schema needs SET on it, which its creator (ADMIN on it) may grant itself.
GRANT agconn_app TO CURRENT_USER WITH INHERIT FALSE, SET TRUE;
CREATE SCHEMA IF NOT EXISTS pgboss AUTHORIZATION agconn_app;
ALTER SCHEMA pgboss OWNER TO agconn_app;

-- SECURITY DEFINER helpers in schema app run as the owner, and FORCE RLS binds the owner too.
-- owner_all lets the owner (this role, never a login the services use) read and write each RLS table.
DO $do$
DECLARE t text;
BEGIN
  FOR t IN SELECT c.relname FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
           WHERE n.nspname = 'public' AND c.relkind IN ('r', 'p') AND c.relrowsecurity AND NOT c.relispartition
             AND NOT EXISTS (SELECT 1 FROM pg_policies p
                             WHERE p.schemaname = 'public' AND p.tablename = c.relname AND p.policyname = 'owner_all')
  LOOP
    EXECUTE format('CREATE POLICY owner_all ON public.%I TO CURRENT_USER USING (true) WITH CHECK (true)', t);
  END LOOP;
END
$do$;
