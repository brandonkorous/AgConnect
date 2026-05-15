-- RLS backfill: enable Row Level Security on tenant-scoped tables that were
-- created without policies. Surfaced by scripts/check-rls.mjs. Each table
-- gets the standard three-policy template:
--
--   *_admin   — current_setting('app.role') = 'admin'
--   *_service — current_setting('app.role') IN ('service', 'webhook')
--   *_<scope> — authenticated user inside the tenant (and, where the table
--               carries a per-row owner, scoped to that owner)
--
-- See docs/00-foundation/03-database/04-rls.md for the policy contract and
-- the AGCONN three-bucket tenancy model.

-- ============================================================================
-- compliance_score_snapshots — daily score rollup per employer profile.
-- Service writes (cron worker); employers in the tenant read.
-- ============================================================================
ALTER TABLE "compliance_score_snapshots" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "compliance_score_snapshots" FORCE  ROW LEVEL SECURITY;

CREATE POLICY "compliance_score_snapshots_admin" ON "compliance_score_snapshots"
    USING (current_setting('app.role', true) = 'admin')
    WITH CHECK (current_setting('app.role', true) = 'admin');

CREATE POLICY "compliance_score_snapshots_service" ON "compliance_score_snapshots"
    USING (current_setting('app.role', true) IN ('service', 'webhook'))
    WITH CHECK (current_setting('app.role', true) IN ('service', 'webhook'));

CREATE POLICY "compliance_score_snapshots_tenant" ON "compliance_score_snapshots"
    USING (current_setting('app.role', true) = 'authenticated'
        AND tenant_id = current_setting('app.tenant_id', true)::uuid)
    WITH CHECK (current_setting('app.role', true) = 'authenticated'
        AND tenant_id = current_setting('app.tenant_id', true)::uuid);

-- ============================================================================
-- employer_contacts — per-tenant contact roster (foremen, dispatch, etc).
-- Authenticated users in the tenant CRUD; service for SMS dispatch.
-- ============================================================================
ALTER TABLE "employer_contacts" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "employer_contacts" FORCE  ROW LEVEL SECURITY;

CREATE POLICY "employer_contacts_admin" ON "employer_contacts"
    USING (current_setting('app.role', true) = 'admin')
    WITH CHECK (current_setting('app.role', true) = 'admin');

CREATE POLICY "employer_contacts_service" ON "employer_contacts"
    USING (current_setting('app.role', true) IN ('service', 'webhook'))
    WITH CHECK (current_setting('app.role', true) IN ('service', 'webhook'));

CREATE POLICY "employer_contacts_tenant" ON "employer_contacts"
    USING (current_setting('app.role', true) = 'authenticated'
        AND tenant_id = current_setting('app.tenant_id', true)::uuid)
    WITH CHECK (current_setting('app.role', true) = 'authenticated'
        AND tenant_id = current_setting('app.tenant_id', true)::uuid);

-- ============================================================================
-- job_photos — gallery images attached to a job posting. Anonymous landing
-- reads happen via the service role; authenticated tenant users CRUD.
-- ============================================================================
ALTER TABLE "job_photos" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "job_photos" FORCE  ROW LEVEL SECURITY;

CREATE POLICY "job_photos_admin" ON "job_photos"
    USING (current_setting('app.role', true) = 'admin')
    WITH CHECK (current_setting('app.role', true) = 'admin');

CREATE POLICY "job_photos_service" ON "job_photos"
    USING (current_setting('app.role', true) IN ('service', 'webhook'))
    WITH CHECK (current_setting('app.role', true) IN ('service', 'webhook'));

CREATE POLICY "job_photos_tenant" ON "job_photos"
    USING (current_setting('app.role', true) = 'authenticated'
        AND tenant_id = current_setting('app.tenant_id', true)::uuid)
    WITH CHECK (current_setting('app.role', true) = 'authenticated'
        AND tenant_id = current_setting('app.tenant_id', true)::uuid);

-- ============================================================================
-- job_screening_questions — questions an employer attaches to a posting.
-- Workers see them through the service role at apply-time; the employer
-- manages them directly.
-- ============================================================================
ALTER TABLE "job_screening_questions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "job_screening_questions" FORCE  ROW LEVEL SECURITY;

CREATE POLICY "job_screening_questions_admin" ON "job_screening_questions"
    USING (current_setting('app.role', true) = 'admin')
    WITH CHECK (current_setting('app.role', true) = 'admin');

CREATE POLICY "job_screening_questions_service" ON "job_screening_questions"
    USING (current_setting('app.role', true) IN ('service', 'webhook'))
    WITH CHECK (current_setting('app.role', true) IN ('service', 'webhook'));

CREATE POLICY "job_screening_questions_tenant" ON "job_screening_questions"
    USING (current_setting('app.role', true) = 'authenticated'
        AND tenant_id = current_setting('app.tenant_id', true)::uuid)
    WITH CHECK (current_setting('app.role', true) = 'authenticated'
        AND tenant_id = current_setting('app.tenant_id', true)::uuid);

-- ============================================================================
-- application_screening_answers — workers' answers to the screening
-- questions above. Mirrors the applications RLS shape: employer in tenant
-- reads/writes; the worker who owns the parent application can read their
-- own answers.
-- ============================================================================
ALTER TABLE "application_screening_answers" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "application_screening_answers" FORCE  ROW LEVEL SECURITY;

CREATE POLICY "application_screening_answers_admin" ON "application_screening_answers"
    USING (current_setting('app.role', true) = 'admin')
    WITH CHECK (current_setting('app.role', true) = 'admin');

CREATE POLICY "application_screening_answers_service" ON "application_screening_answers"
    USING (current_setting('app.role', true) IN ('service', 'webhook'))
    WITH CHECK (current_setting('app.role', true) IN ('service', 'webhook'));

CREATE POLICY "application_screening_answers_tenant" ON "application_screening_answers"
    USING (current_setting('app.role', true) = 'authenticated'
        AND tenant_id = current_setting('app.tenant_id', true)::uuid)
    WITH CHECK (current_setting('app.role', true) = 'authenticated'
        AND tenant_id = current_setting('app.tenant_id', true)::uuid);

CREATE POLICY "application_screening_answers_self_worker" ON "application_screening_answers"
    USING (current_setting('app.role', true) = 'authenticated'
        AND EXISTS (
            SELECT 1 FROM "applications" a
            WHERE a.id = application_screening_answers.application_id
              AND a.worker_id = current_setting('app.user_id', true)
        ))
    WITH CHECK (current_setting('app.role', true) = 'authenticated'
        AND EXISTS (
            SELECT 1 FROM "applications" a
            WHERE a.id = application_screening_answers.application_id
              AND a.worker_id = current_setting('app.user_id', true)
        ));

-- ============================================================================
-- job_edit_events — audit trail for job posting edits. Tenant users read;
-- service writes from the edit handler.
-- ============================================================================
ALTER TABLE "job_edit_events" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "job_edit_events" FORCE  ROW LEVEL SECURITY;

CREATE POLICY "job_edit_events_admin" ON "job_edit_events"
    USING (current_setting('app.role', true) = 'admin')
    WITH CHECK (current_setting('app.role', true) = 'admin');

CREATE POLICY "job_edit_events_service" ON "job_edit_events"
    USING (current_setting('app.role', true) IN ('service', 'webhook'))
    WITH CHECK (current_setting('app.role', true) IN ('service', 'webhook'));

CREATE POLICY "job_edit_events_tenant" ON "job_edit_events"
    USING (current_setting('app.role', true) = 'authenticated'
        AND tenant_id = current_setting('app.tenant_id', true)::uuid)
    WITH CHECK (current_setting('app.role', true) = 'authenticated'
        AND tenant_id = current_setting('app.tenant_id', true)::uuid);

-- ============================================================================
-- job_renotifications — outbound dispatches to applicants when a job edit
-- requires re-notification. Service-driven; tenant users read for the audit
-- view.
-- ============================================================================
ALTER TABLE "job_renotifications" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "job_renotifications" FORCE  ROW LEVEL SECURITY;

CREATE POLICY "job_renotifications_admin" ON "job_renotifications"
    USING (current_setting('app.role', true) = 'admin')
    WITH CHECK (current_setting('app.role', true) = 'admin');

CREATE POLICY "job_renotifications_service" ON "job_renotifications"
    USING (current_setting('app.role', true) IN ('service', 'webhook'))
    WITH CHECK (current_setting('app.role', true) IN ('service', 'webhook'));

CREATE POLICY "job_renotifications_tenant" ON "job_renotifications"
    USING (current_setting('app.role', true) = 'authenticated'
        AND tenant_id = current_setting('app.tenant_id', true)::uuid)
    WITH CHECK (current_setting('app.role', true) = 'authenticated'
        AND tenant_id = current_setting('app.tenant_id', true)::uuid);

-- ============================================================================
-- sms_keywords — per-tenant keyword router for inbound SMS. Read by the SMS
-- pipeline (service); managed by tenant users.
-- ============================================================================
ALTER TABLE "sms_keywords" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "sms_keywords" FORCE  ROW LEVEL SECURITY;

CREATE POLICY "sms_keywords_admin" ON "sms_keywords"
    USING (current_setting('app.role', true) = 'admin')
    WITH CHECK (current_setting('app.role', true) = 'admin');

CREATE POLICY "sms_keywords_service" ON "sms_keywords"
    USING (current_setting('app.role', true) IN ('service', 'webhook'))
    WITH CHECK (current_setting('app.role', true) IN ('service', 'webhook'));

CREATE POLICY "sms_keywords_tenant" ON "sms_keywords"
    USING (current_setting('app.role', true) = 'authenticated'
        AND tenant_id = current_setting('app.tenant_id', true)::uuid)
    WITH CHECK (current_setting('app.role', true) = 'authenticated'
        AND tenant_id = current_setting('app.tenant_id', true)::uuid);
