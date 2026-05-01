-- Worker domain: profiles, jobs, applications, saved searches, training, enrollments.
-- See docs/10-worker/* for the contracts. RLS policies enforce tenant + role
-- isolation; the api layer pins app.user_id, app.role, app.tenant_id per request.

-- ============================================================================
-- Enums
-- ============================================================================
CREATE TYPE "County" AS ENUM ('Fresno', 'Kern', 'Kings', 'Madera', 'Tulare');
CREATE TYPE "AppStatus" AS ENUM ('applied', 'reviewed', 'hired', 'rejected', 'withdrawn');
CREATE TYPE "AlertChannel" AS ENUM ('sms', 'email', 'both');
CREATE TYPE "JobStatus" AS ENUM ('draft', 'active', 'closed', 'filled');
CREATE TYPE "WageUnit" AS ENUM ('hour', 'day', 'piece');
CREATE TYPE "Funder" AS ENUM ('CDFA', 'F3', 'CalOSBA', 'EDD', 'other');
CREATE TYPE "ProgramStatus" AS ENUM ('draft', 'active', 'full', 'closed', 'canceled');
CREATE TYPE "EnrollmentStatus" AS ENUM ('enrolled', 'completed', 'dropped');

-- ============================================================================
-- worker_profiles — extends users for the worker role
-- ============================================================================
CREATE TABLE "worker_profiles" (
    "id"              TEXT NOT NULL,
    "tenant_id"       UUID NOT NULL,
    "first_name"      TEXT NOT NULL,
    "last_name"       TEXT NOT NULL,
    "zip_code"        TEXT,
    "county"          "County",
    "skills"          TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "certifications"  JSONB NOT NULL DEFAULT '[]'::jsonb,
    "availability"    JSONB NOT NULL DEFAULT '{}'::jsonb,
    "resume"          JSONB,
    "resume_raw_url"  TEXT,
    "phone_hash"      TEXT,
    "onboarded_at"    TIMESTAMP(3),
    "created_at"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at"      TIMESTAMP(3) NOT NULL,
    "deleted_at"      TIMESTAMP(3),
    CONSTRAINT worker_profiles_pkey PRIMARY KEY ("id"),
    CONSTRAINT worker_profiles_user_fk FOREIGN KEY ("id") REFERENCES "users"("id") ON DELETE CASCADE,
    CONSTRAINT worker_profiles_tenant_fk FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT
);

CREATE INDEX "worker_profiles_tenant_id_idx" ON "worker_profiles"("tenant_id");
CREATE INDEX "worker_profiles_county_idx" ON "worker_profiles"("county");
CREATE INDEX "worker_profiles_phone_hash_idx" ON "worker_profiles"("phone_hash");
CREATE INDEX "worker_profile_skills_gin" ON "worker_profiles" USING gin("skills");

-- ============================================================================
-- job_postings
-- ============================================================================
CREATE TABLE "job_postings" (
    "id"              UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenant_id"       UUID NOT NULL,
    "employer_id"     TEXT NOT NULL,
    "title_en"        TEXT NOT NULL,
    "title_es"        TEXT NOT NULL,
    "description_en"  TEXT NOT NULL,
    "description_es"  TEXT NOT NULL,
    "county"          "County" NOT NULL,
    "city"            TEXT,
    "zip_code"        TEXT,
    "wage_min"        DECIMAL(8, 2) NOT NULL,
    "wage_max"        DECIMAL(8, 2) NOT NULL,
    "wage_unit"       "WageUnit" NOT NULL DEFAULT 'hour',
    "start_date"      DATE NOT NULL,
    "end_date"        DATE,
    "apply_by"        DATE,
    "skills"          TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "housing"         BOOLEAN NOT NULL DEFAULT false,
    "transport"       BOOLEAN NOT NULL DEFAULT false,
    "status"          "JobStatus" NOT NULL DEFAULT 'draft',
    "seo_slug"        TEXT NOT NULL,
    "published_at"    TIMESTAMP(3),
    "created_at"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at"      TIMESTAMP(3) NOT NULL,
    "deleted_at"      TIMESTAMP(3),
    CONSTRAINT job_postings_pkey PRIMARY KEY ("id"),
    CONSTRAINT job_postings_tenant_fk FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT,
    CONSTRAINT job_postings_employer_fk FOREIGN KEY ("employer_id") REFERENCES "users"("id") ON DELETE RESTRICT,
    CONSTRAINT job_postings_wage_chk CHECK ("wage_min" <= "wage_max")
);

CREATE UNIQUE INDEX "job_postings_seo_slug_key" ON "job_postings"("seo_slug");
CREATE INDEX "job_postings_tenant_id_idx" ON "job_postings"("tenant_id");
CREATE INDEX "job_postings_tenant_status_county_idx" ON "job_postings"("tenant_id", "status", "county");
CREATE INDEX "job_postings_status_start_idx" ON "job_postings"("status", "start_date");
CREATE INDEX "job_postings_skills_gin" ON "job_postings" USING gin("skills");

-- ============================================================================
-- applications
-- ============================================================================
CREATE TABLE "applications" (
    "id"               UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenant_id"        UUID NOT NULL,
    "job_id"           UUID NOT NULL,
    "worker_id"        TEXT NOT NULL,
    "status"           "AppStatus" NOT NULL DEFAULT 'applied',
    "wage_offered"     DECIMAL(8, 2),
    "worker_note"      VARCHAR(500),
    "applied_at"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewed_at"      TIMESTAMP(3),
    "hired_at"         TIMESTAMP(3),
    "rejected_at"      TIMESTAMP(3),
    "withdrawn_at"     TIMESTAMP(3),
    "start_date"       DATE,
    "county_at_apply"  "County",
    "skills_at_apply"  TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "created_at"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at"       TIMESTAMP(3) NOT NULL,
    "deleted_at"       TIMESTAMP(3),
    CONSTRAINT applications_pkey PRIMARY KEY ("id"),
    CONSTRAINT applications_tenant_fk FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT,
    CONSTRAINT applications_job_fk FOREIGN KEY ("job_id") REFERENCES "job_postings"("id") ON DELETE RESTRICT,
    CONSTRAINT applications_worker_fk FOREIGN KEY ("worker_id") REFERENCES "users"("id") ON DELETE RESTRICT,
    CONSTRAINT hired_requires_wage CHECK ("status" != 'hired' OR "wage_offered" IS NOT NULL)
);

CREATE UNIQUE INDEX "applications_job_worker_key" ON "applications"("job_id", "worker_id");
CREATE INDEX "applications_tenant_id_idx" ON "applications"("tenant_id");
CREATE INDEX "applications_worker_status_idx" ON "applications"("worker_id", "status");
CREATE INDEX "applications_job_status_idx" ON "applications"("job_id", "status");
CREATE INDEX "applications_applied_at_idx" ON "applications"("applied_at");

-- ============================================================================
-- application_events
-- ============================================================================
CREATE TABLE "application_events" (
    "id"               UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenant_id"        UUID NOT NULL,
    "application_id"   UUID NOT NULL,
    "from_status"      "AppStatus",
    "to_status"        "AppStatus" NOT NULL,
    "actor_user_id"    TEXT NOT NULL,
    "actor_role"       "UserRole" NOT NULL,
    "metadata"         JSONB NOT NULL DEFAULT '{}'::jsonb,
    "created_at"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT application_events_pkey PRIMARY KEY ("id"),
    CONSTRAINT application_events_tenant_fk FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT,
    CONSTRAINT application_events_app_fk FOREIGN KEY ("application_id") REFERENCES "applications"("id") ON DELETE CASCADE
);

CREATE INDEX "application_events_tenant_id_idx" ON "application_events"("tenant_id");
CREATE INDEX "application_events_app_created_idx" ON "application_events"("application_id", "created_at");

-- ============================================================================
-- saved_searches
-- ============================================================================
CREATE TABLE "saved_searches" (
    "id"               UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenant_id"        UUID NOT NULL,
    "worker_id"        TEXT NOT NULL,
    "name"             TEXT,
    "filters"          JSONB NOT NULL,
    "alert_channel"    "AlertChannel" NOT NULL DEFAULT 'sms',
    "alert_active"     BOOLEAN NOT NULL DEFAULT true,
    "last_notified_at" TIMESTAMP(3),
    "created_at"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at"       TIMESTAMP(3) NOT NULL,
    "deleted_at"       TIMESTAMP(3),
    CONSTRAINT saved_searches_pkey PRIMARY KEY ("id"),
    CONSTRAINT saved_searches_tenant_fk FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT,
    CONSTRAINT saved_searches_worker_fk FOREIGN KEY ("worker_id") REFERENCES "users"("id") ON DELETE CASCADE
);

CREATE INDEX "saved_searches_tenant_id_idx" ON "saved_searches"("tenant_id");
CREATE INDEX "saved_searches_worker_id_idx" ON "saved_searches"("worker_id");
CREATE INDEX "saved_searches_alert_active_idx" ON "saved_searches"("alert_active");

-- ============================================================================
-- search_views — analytics
-- ============================================================================
CREATE TABLE "search_views" (
    "id"           UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenant_id"    UUID NOT NULL,
    "worker_id"    TEXT,
    "filters"      JSONB NOT NULL,
    "result_count" INTEGER NOT NULL,
    "created_at"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT search_views_pkey PRIMARY KEY ("id"),
    CONSTRAINT search_views_tenant_fk FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT
);

CREATE INDEX "search_views_tenant_created_idx" ON "search_views"("tenant_id", "created_at");

-- ============================================================================
-- training_programs
-- ============================================================================
CREATE TABLE "training_programs" (
    "id"               UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenant_id"        UUID NOT NULL,
    "org_id"           TEXT NOT NULL,
    "title_en"         TEXT NOT NULL,
    "title_es"         TEXT NOT NULL,
    "summary_en"       VARCHAR(280),
    "summary_es"       VARCHAR(280),
    "description_en"   TEXT NOT NULL,
    "description_es"   TEXT NOT NULL,
    "funder"           "Funder" NOT NULL,
    "county"           "County" NOT NULL,
    "location_name"    TEXT NOT NULL,
    "location_address" TEXT NOT NULL,
    "capacity"         INTEGER NOT NULL,
    "enrolled_count"   INTEGER NOT NULL DEFAULT 0,
    "start_date"       TIMESTAMP(3) NOT NULL,
    "end_date"         TIMESTAMP(3) NOT NULL,
    "session_times"    JSONB NOT NULL DEFAULT '[]'::jsonb,
    "topics"           TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "cert_name"        TEXT,
    "seo_slug"         TEXT NOT NULL,
    "status"           "ProgramStatus" NOT NULL DEFAULT 'draft',
    "created_at"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at"       TIMESTAMP(3) NOT NULL,
    "deleted_at"       TIMESTAMP(3),
    CONSTRAINT training_programs_pkey PRIMARY KEY ("id"),
    CONSTRAINT training_programs_tenant_fk FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT,
    CONSTRAINT training_programs_org_fk FOREIGN KEY ("org_id") REFERENCES "users"("id") ON DELETE RESTRICT,
    CONSTRAINT training_programs_capacity_chk CHECK ("enrolled_count" <= "capacity"),
    CONSTRAINT training_programs_dates_chk CHECK ("end_date" >= "start_date")
);

CREATE UNIQUE INDEX "training_programs_seo_slug_key" ON "training_programs"("seo_slug");
CREATE INDEX "training_programs_tenant_id_idx" ON "training_programs"("tenant_id");
CREATE INDEX "training_programs_county_idx" ON "training_programs"("county");
CREATE INDEX "training_programs_funder_idx" ON "training_programs"("funder");
CREATE INDEX "training_programs_status_start_idx" ON "training_programs"("status", "start_date");

-- ============================================================================
-- enrollments
-- ============================================================================
CREATE TABLE "enrollments" (
    "id"                 UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenant_id"          UUID NOT NULL,
    "program_id"         UUID NOT NULL,
    "worker_id"          TEXT NOT NULL,
    "status"             "EnrollmentStatus" NOT NULL DEFAULT 'enrolled',
    "enrolled_at"        TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at"       TIMESTAMP(3),
    "dropped_at"         TIMESTAMP(3),
    "cert_url"           TEXT,
    "cert_generated_at"  TIMESTAMP(3),
    "certificate_id"     TEXT,
    "no_show"            BOOLEAN NOT NULL DEFAULT false,
    "reminder_sent_48h"  BOOLEAN NOT NULL DEFAULT false,
    "reminder_sent_2h"   BOOLEAN NOT NULL DEFAULT false,
    "created_at"         TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at"         TIMESTAMP(3) NOT NULL,
    "deleted_at"         TIMESTAMP(3),
    CONSTRAINT enrollments_pkey PRIMARY KEY ("id"),
    CONSTRAINT enrollments_tenant_fk FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT,
    CONSTRAINT enrollments_program_fk FOREIGN KEY ("program_id") REFERENCES "training_programs"("id") ON DELETE CASCADE,
    CONSTRAINT enrollments_worker_fk FOREIGN KEY ("worker_id") REFERENCES "users"("id") ON DELETE RESTRICT
);

CREATE UNIQUE INDEX "enrollments_program_worker_key" ON "enrollments"("program_id", "worker_id");
CREATE UNIQUE INDEX "enrollments_certificate_id_key" ON "enrollments"("certificate_id");
CREATE INDEX "enrollments_tenant_id_idx" ON "enrollments"("tenant_id");
CREATE INDEX "enrollments_worker_status_idx" ON "enrollments"("worker_id", "status");
CREATE INDEX "enrollments_program_status_idx" ON "enrollments"("program_id", "status");

-- ============================================================================
-- RLS — every table forces row level security; the api pins app.role,
-- app.user_id, app.tenant_id per request transaction.
-- ============================================================================

-- worker_profiles
ALTER TABLE "worker_profiles" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "worker_profiles" FORCE ROW LEVEL SECURITY;

CREATE POLICY "worker_profiles_admin" ON "worker_profiles"
    USING (current_setting('app.role', true) = 'admin')
    WITH CHECK (current_setting('app.role', true) = 'admin');

CREATE POLICY "worker_profiles_service" ON "worker_profiles"
    USING (current_setting('app.role', true) IN ('service', 'webhook'))
    WITH CHECK (current_setting('app.role', true) IN ('service', 'webhook'));

CREATE POLICY "worker_profiles_self" ON "worker_profiles"
    USING (
        current_setting('app.role', true) = 'authenticated'
        AND id = current_setting('app.user_id', true)
    )
    WITH CHECK (
        current_setting('app.role', true) = 'authenticated'
        AND id = current_setting('app.user_id', true)
    );

-- Employers in the same tenant may SELECT worker profiles (Worker Search,
-- Pro+ feature gates by plan in the api layer).
CREATE POLICY "worker_profiles_employer_read" ON "worker_profiles"
    FOR SELECT
    USING (
        current_setting('app.role', true) = 'authenticated'
        AND tenant_id = current_setting('app.tenant_id', true)::uuid
        AND EXISTS (
            SELECT 1 FROM "users" u
            WHERE u.id = current_setting('app.user_id', true)
            AND u.role = 'employer'
        )
    );

-- job_postings
ALTER TABLE "job_postings" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "job_postings" FORCE ROW LEVEL SECURITY;

CREATE POLICY "job_postings_admin" ON "job_postings"
    USING (current_setting('app.role', true) = 'admin')
    WITH CHECK (current_setting('app.role', true) = 'admin');

CREATE POLICY "job_postings_service" ON "job_postings"
    USING (current_setting('app.role', true) IN ('service', 'webhook'))
    WITH CHECK (current_setting('app.role', true) IN ('service', 'webhook'));

-- Public-ish read of active postings within the tenant for authenticated
-- users (workers + employers in tenant). Anonymous reads happen via the
-- service role from the public api surface.
CREATE POLICY "job_postings_tenant_read_active" ON "job_postings"
    FOR SELECT
    USING (
        current_setting('app.role', true) = 'authenticated'
        AND tenant_id = current_setting('app.tenant_id', true)::uuid
        AND status = 'active'
        AND deleted_at IS NULL
    );

-- Employer manages own postings (any status).
CREATE POLICY "job_postings_employer_manage" ON "job_postings"
    USING (
        current_setting('app.role', true) = 'authenticated'
        AND employer_id = current_setting('app.user_id', true)
    )
    WITH CHECK (
        current_setting('app.role', true) = 'authenticated'
        AND employer_id = current_setting('app.user_id', true)
    );

-- applications
ALTER TABLE "applications" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "applications" FORCE ROW LEVEL SECURITY;

CREATE POLICY "applications_admin" ON "applications"
    USING (current_setting('app.role', true) = 'admin')
    WITH CHECK (current_setting('app.role', true) = 'admin');

CREATE POLICY "applications_service" ON "applications"
    USING (current_setting('app.role', true) IN ('service', 'webhook'))
    WITH CHECK (current_setting('app.role', true) IN ('service', 'webhook'));

CREATE POLICY "applications_self_worker" ON "applications"
    USING (
        current_setting('app.role', true) = 'authenticated'
        AND worker_id = current_setting('app.user_id', true)
    )
    WITH CHECK (
        current_setting('app.role', true) = 'authenticated'
        AND worker_id = current_setting('app.user_id', true)
    );

CREATE POLICY "applications_self_employer" ON "applications"
    USING (
        current_setting('app.role', true) = 'authenticated'
        AND EXISTS (
            SELECT 1 FROM "job_postings" j
            WHERE j.id = applications.job_id
            AND j.employer_id = current_setting('app.user_id', true)
        )
    )
    WITH CHECK (
        current_setting('app.role', true) = 'authenticated'
        AND EXISTS (
            SELECT 1 FROM "job_postings" j
            WHERE j.id = applications.job_id
            AND j.employer_id = current_setting('app.user_id', true)
        )
    );

-- application_events
ALTER TABLE "application_events" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "application_events" FORCE ROW LEVEL SECURITY;

CREATE POLICY "application_events_admin" ON "application_events"
    USING (current_setting('app.role', true) = 'admin')
    WITH CHECK (current_setting('app.role', true) = 'admin');

CREATE POLICY "application_events_service" ON "application_events"
    USING (current_setting('app.role', true) IN ('service', 'webhook'))
    WITH CHECK (current_setting('app.role', true) IN ('service', 'webhook'));

CREATE POLICY "application_events_self_worker" ON "application_events"
    FOR SELECT
    USING (
        current_setting('app.role', true) = 'authenticated'
        AND EXISTS (
            SELECT 1 FROM "applications" a
            WHERE a.id = application_events.application_id
            AND a.worker_id = current_setting('app.user_id', true)
        )
    );

CREATE POLICY "application_events_self_employer" ON "application_events"
    FOR SELECT
    USING (
        current_setting('app.role', true) = 'authenticated'
        AND EXISTS (
            SELECT 1 FROM "applications" a
            JOIN "job_postings" j ON j.id = a.job_id
            WHERE a.id = application_events.application_id
            AND j.employer_id = current_setting('app.user_id', true)
        )
    );

-- saved_searches
ALTER TABLE "saved_searches" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "saved_searches" FORCE ROW LEVEL SECURITY;

CREATE POLICY "saved_searches_admin" ON "saved_searches"
    USING (current_setting('app.role', true) = 'admin')
    WITH CHECK (current_setting('app.role', true) = 'admin');

CREATE POLICY "saved_searches_service" ON "saved_searches"
    USING (current_setting('app.role', true) IN ('service', 'webhook'))
    WITH CHECK (current_setting('app.role', true) IN ('service', 'webhook'));

CREATE POLICY "saved_searches_self" ON "saved_searches"
    USING (
        current_setting('app.role', true) = 'authenticated'
        AND worker_id = current_setting('app.user_id', true)
    )
    WITH CHECK (
        current_setting('app.role', true) = 'authenticated'
        AND worker_id = current_setting('app.user_id', true)
    );

-- search_views
ALTER TABLE "search_views" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "search_views" FORCE ROW LEVEL SECURITY;

CREATE POLICY "search_views_admin" ON "search_views"
    USING (current_setting('app.role', true) = 'admin')
    WITH CHECK (current_setting('app.role', true) = 'admin');

CREATE POLICY "search_views_service" ON "search_views"
    USING (current_setting('app.role', true) IN ('service', 'webhook'))
    WITH CHECK (current_setting('app.role', true) IN ('service', 'webhook'));

CREATE POLICY "search_views_insert_authenticated" ON "search_views"
    FOR INSERT
    WITH CHECK (
        current_setting('app.role', true) = 'authenticated'
        AND tenant_id = current_setting('app.tenant_id', true)::uuid
    );

-- training_programs
ALTER TABLE "training_programs" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "training_programs" FORCE ROW LEVEL SECURITY;

CREATE POLICY "training_programs_admin" ON "training_programs"
    USING (current_setting('app.role', true) = 'admin')
    WITH CHECK (current_setting('app.role', true) = 'admin');

CREATE POLICY "training_programs_service" ON "training_programs"
    USING (current_setting('app.role', true) IN ('service', 'webhook'))
    WITH CHECK (current_setting('app.role', true) IN ('service', 'webhook'));

-- Anyone authenticated in the tenant can read active/full programs.
CREATE POLICY "training_programs_tenant_read_listed" ON "training_programs"
    FOR SELECT
    USING (
        current_setting('app.role', true) = 'authenticated'
        AND tenant_id = current_setting('app.tenant_id', true)::uuid
        AND status IN ('active', 'full')
        AND deleted_at IS NULL
    );

-- Org users manage their own programs.
CREATE POLICY "training_programs_org_manage" ON "training_programs"
    USING (
        current_setting('app.role', true) = 'authenticated'
        AND org_id = current_setting('app.user_id', true)
    )
    WITH CHECK (
        current_setting('app.role', true) = 'authenticated'
        AND org_id = current_setting('app.user_id', true)
    );

-- enrollments
ALTER TABLE "enrollments" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "enrollments" FORCE ROW LEVEL SECURITY;

CREATE POLICY "enrollments_admin" ON "enrollments"
    USING (current_setting('app.role', true) = 'admin')
    WITH CHECK (current_setting('app.role', true) = 'admin');

CREATE POLICY "enrollments_service" ON "enrollments"
    USING (current_setting('app.role', true) IN ('service', 'webhook'))
    WITH CHECK (current_setting('app.role', true) IN ('service', 'webhook'));

CREATE POLICY "enrollments_self" ON "enrollments"
    USING (
        current_setting('app.role', true) = 'authenticated'
        AND worker_id = current_setting('app.user_id', true)
    )
    WITH CHECK (
        current_setting('app.role', true) = 'authenticated'
        AND worker_id = current_setting('app.user_id', true)
    );

CREATE POLICY "enrollments_org" ON "enrollments"
    USING (
        current_setting('app.role', true) = 'authenticated'
        AND EXISTS (
            SELECT 1 FROM "training_programs" tp
            WHERE tp.id = enrollments.program_id
            AND tp.org_id = current_setting('app.user_id', true)
        )
    )
    WITH CHECK (
        current_setting('app.role', true) = 'authenticated'
        AND EXISTS (
            SELECT 1 FROM "training_programs" tp
            WHERE tp.id = enrollments.program_id
            AND tp.org_id = current_setting('app.user_id', true)
        )
    );
