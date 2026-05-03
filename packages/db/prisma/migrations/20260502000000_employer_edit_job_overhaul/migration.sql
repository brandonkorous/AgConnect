-- Edit Job overhaul: bring the job posting model in line with the v2 employer
-- edit-job spec (basics → schedule → pay → requirements → location → application →
-- compliance), plus the supporting lookup tables, photo storage, screening
-- questions, foreman contacts, edit-event log, and the SMS-apply / re-notify
-- pipelines those features depend on.
--
-- See docs/20-employer/02-job-postings/02-data-model.md.

-- ─── Enums ────────────────────────────────────────────────────────────────
CREATE TYPE "WageStructure" AS ENUM ('hourly', 'hourly_piece', 'piece');
CREATE TYPE "PayFrequency"  AS ENUM ('weekly', 'biweekly', 'daily');
CREATE TYPE "MinExperience" AS ENUM ('none', 'one_year', 'three_years', 'five_years');
CREATE TYPE "MinAge"        AS ENUM ('sixteen', 'eighteen', 'twenty_one');
CREATE TYPE "ScreeningAnswerType" AS ENUM ('yes_no', 'text');
CREATE TYPE "JobEditEventKind" AS ENUM (
    'field_changed',
    'photo_added',
    'photo_removed',
    'photo_reordered',
    'screening_changed',
    'renotify_dispatched',
    'autosaved'
);
CREATE TYPE "RenotifyChannel" AS ENUM ('sms', 'email', 'app');
CREATE TYPE "RenotifyStatus"  AS ENUM ('queued', 'sent', 'failed', 'skipped_quiet_hours');

-- ─── Lookup tables (seeded from code) ─────────────────────────────────────
CREATE TABLE "crops" (
    "id"          UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    "slug"        TEXT         NOT NULL UNIQUE,
    "label_en"    TEXT         NOT NULL,
    "label_es"    TEXT         NOT NULL,
    "glyph_key"   TEXT         NOT NULL,
    "sort_order"  INTEGER      NOT NULL DEFAULT 0,
    "active"      BOOLEAN      NOT NULL DEFAULT true,
    "created_at"  TIMESTAMPTZ  NOT NULL DEFAULT now(),
    "updated_at"  TIMESTAMPTZ  NOT NULL DEFAULT now()
);
CREATE INDEX "crops_active_sort_idx" ON "crops"("active", "sort_order");

CREATE TABLE "role_types" (
    "id"          UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    "slug"        TEXT         NOT NULL UNIQUE,
    "label_en"    TEXT         NOT NULL,
    "label_es"    TEXT         NOT NULL,
    "sort_order"  INTEGER      NOT NULL DEFAULT 0,
    "active"      BOOLEAN      NOT NULL DEFAULT true,
    "created_at"  TIMESTAMPTZ  NOT NULL DEFAULT now(),
    "updated_at"  TIMESTAMPTZ  NOT NULL DEFAULT now()
);
CREATE INDEX "role_types_active_sort_idx" ON "role_types"("active", "sort_order");

CREATE TABLE "skill_tags" (
    "id"          UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    "slug"        TEXT         NOT NULL UNIQUE,
    "label_en"    TEXT         NOT NULL,
    "label_es"    TEXT         NOT NULL,
    "category"    TEXT         NOT NULL DEFAULT 'general',
    "sort_order"  INTEGER      NOT NULL DEFAULT 0,
    "active"      BOOLEAN      NOT NULL DEFAULT true,
    "created_at"  TIMESTAMPTZ  NOT NULL DEFAULT now(),
    "updated_at"  TIMESTAMPTZ  NOT NULL DEFAULT now()
);
CREATE INDEX "skill_tags_active_sort_idx" ON "skill_tags"("active", "sort_order");
CREATE INDEX "skill_tags_category_idx"    ON "skill_tags"("category");

-- ─── Employer contacts (foreman / lead picker) ────────────────────────────
CREATE TABLE "employer_contacts" (
    "id"          UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    "tenant_id"   UUID         NOT NULL REFERENCES "tenants"("id"),
    "employer_id" UUID         NOT NULL REFERENCES "employer_profiles"("id") ON DELETE CASCADE,
    "name"        TEXT         NOT NULL,
    "phone"       TEXT         NOT NULL,
    "role"        TEXT         NOT NULL DEFAULT 'foreman',
    "languages"   TEXT[]       NOT NULL DEFAULT ARRAY['en','es']::TEXT[],
    "sort_order"  INTEGER      NOT NULL DEFAULT 0,
    "created_at"  TIMESTAMPTZ  NOT NULL DEFAULT now(),
    "updated_at"  TIMESTAMPTZ  NOT NULL DEFAULT now(),
    "deleted_at"  TIMESTAMPTZ
);
CREATE INDEX "employer_contacts_tenant_idx"   ON "employer_contacts"("tenant_id");
CREATE INDEX "employer_contacts_employer_idx" ON "employer_contacts"("employer_id");

-- ─── JobPosting extension ─────────────────────────────────────────────────
-- All new columns nullable / defaulted so the migration is non-breaking for
-- existing rows. New required-at-publish constraints are enforced in API.
ALTER TABLE "job_postings"
    ADD COLUMN "crop_id"                 UUID            REFERENCES "crops"("id"),
    ADD COLUMN "role_type_id"            UUID            REFERENCES "role_types"("id"),
    ADD COLUMN "daily_start_time"        TIME,
    ADD COLUMN "daily_end_time"          TIME,
    ADD COLUMN "working_days"            SMALLINT        NOT NULL DEFAULT 31,
    ADD COLUMN "wage_structure"          "WageStructure" NOT NULL DEFAULT 'hourly',
    ADD COLUMN "piece_rate"              NUMERIC(8,4),
    ADD COLUMN "piece_unit"              TEXT,
    ADD COLUMN "pay_frequency"           "PayFrequency"  NOT NULL DEFAULT 'weekly',
    ADD COLUMN "meals_provided"          BOOLEAN         NOT NULL DEFAULT false,
    ADD COLUMN "end_of_season_bonus_cents" INTEGER,
    ADD COLUMN "pickup_point"            TEXT,
    ADD COLUMN "min_experience"          "MinExperience" NOT NULL DEFAULT 'none',
    ADD COLUMN "min_age"                 "MinAge"        NOT NULL DEFAULT 'eighteen',
    ADD COLUMN "auto_match_enabled"      BOOLEAN         NOT NULL DEFAULT true,
    ADD COLUMN "auto_translate_enabled"  BOOLEAN         NOT NULL DEFAULT true,
    ADD COLUMN "sms_apply_enabled"       BOOLEAN         NOT NULL DEFAULT true,
    ADD COLUMN "sms_apply_keyword"       TEXT,
    ADD COLUMN "application_deadline_at" TIMESTAMPTZ,
    ADD COLUMN "foreman_contact_id"      UUID            REFERENCES "employer_contacts"("id"),
    ADD COLUMN "site_address"            TEXT,
    ADD COLUMN "site_acres"              NUMERIC(8,2),
    ADD COLUMN "site_lat"                DOUBLE PRECISION,
    ADD COLUMN "site_lng"                DOUBLE PRECISION,
    ADD COLUMN "human_id"                TEXT,
    ADD COLUMN "last_edited_by_id"       TEXT            REFERENCES "users"("id"),
    ADD COLUMN "autosaved_at"            TIMESTAMPTZ;

-- Working-days bitmask: bit 0=Mon … bit 6=Sun. Range 1..127 (must include
-- at least one day) once a job is past draft.
ALTER TABLE "job_postings"
    ADD CONSTRAINT "job_postings_working_days_range"
        CHECK ("working_days" >= 0 AND "working_days" <= 127);

-- Daily start must be before daily end when both set.
ALTER TABLE "job_postings"
    ADD CONSTRAINT "job_postings_daily_time_order"
        CHECK ("daily_start_time" IS NULL OR "daily_end_time" IS NULL
            OR "daily_start_time" < "daily_end_time");

-- Piece rate requires a unit, and only makes sense for hourly_piece / piece.
ALTER TABLE "job_postings"
    ADD CONSTRAINT "job_postings_piece_consistency"
        CHECK (
            ("piece_rate" IS NULL AND "piece_unit" IS NULL)
            OR ("piece_rate" IS NOT NULL AND "piece_unit" IS NOT NULL
                AND "wage_structure" IN ('hourly_piece', 'piece'))
        );

-- SMS-apply keyword unique within a tenant when set.
CREATE UNIQUE INDEX "job_postings_sms_keyword_unique"
    ON "job_postings"("tenant_id", LOWER("sms_apply_keyword"))
    WHERE "sms_apply_keyword" IS NOT NULL AND "deleted_at" IS NULL;

-- Human-readable id (e.g. "SV-2025-0042") unique per tenant when set.
CREATE UNIQUE INDEX "job_postings_human_id_unique"
    ON "job_postings"("tenant_id", "human_id")
    WHERE "human_id" IS NOT NULL AND "deleted_at" IS NULL;

CREATE INDEX "job_postings_crop_idx"      ON "job_postings"("crop_id")      WHERE "crop_id"      IS NOT NULL;
CREATE INDEX "job_postings_role_type_idx" ON "job_postings"("role_type_id") WHERE "role_type_id" IS NOT NULL;
CREATE INDEX "job_postings_geo_idx"       ON "job_postings"("site_lat", "site_lng")
    WHERE "site_lat" IS NOT NULL AND "site_lng" IS NOT NULL;

-- ─── Job photos ───────────────────────────────────────────────────────────
CREATE TABLE "job_photos" (
    "id"          UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    "tenant_id"   UUID         NOT NULL REFERENCES "tenants"("id"),
    "job_id"      UUID         NOT NULL REFERENCES "job_postings"("id") ON DELETE CASCADE,
    "url"         TEXT         NOT NULL,
    "storage_key" TEXT         NOT NULL,
    "caption_en"  TEXT,
    "caption_es"  TEXT,
    "width"       INTEGER,
    "height"      INTEGER,
    "sort_order"  INTEGER      NOT NULL DEFAULT 0,
    "uploaded_by_id" TEXT      REFERENCES "users"("id"),
    "created_at"  TIMESTAMPTZ  NOT NULL DEFAULT now()
);
CREATE INDEX "job_photos_tenant_idx" ON "job_photos"("tenant_id");
CREATE INDEX "job_photos_job_idx"    ON "job_photos"("job_id", "sort_order");

-- ─── Screening questions ──────────────────────────────────────────────────
CREATE TABLE "job_screening_questions" (
    "id"          UUID                  PRIMARY KEY DEFAULT gen_random_uuid(),
    "tenant_id"   UUID                  NOT NULL REFERENCES "tenants"("id"),
    "job_id"      UUID                  NOT NULL REFERENCES "job_postings"("id") ON DELETE CASCADE,
    "sort_order"  INTEGER               NOT NULL DEFAULT 0,
    "question_en" TEXT                  NOT NULL,
    "question_es" TEXT                  NOT NULL,
    "answer_type" "ScreeningAnswerType" NOT NULL DEFAULT 'yes_no',
    "required"    BOOLEAN               NOT NULL DEFAULT true,
    "created_at"  TIMESTAMPTZ           NOT NULL DEFAULT now(),
    "updated_at"  TIMESTAMPTZ           NOT NULL DEFAULT now()
);
CREATE INDEX "job_screening_questions_tenant_idx" ON "job_screening_questions"("tenant_id");
CREATE INDEX "job_screening_questions_job_idx"    ON "job_screening_questions"("job_id", "sort_order");

-- Per-application answers, keyed by question. Sparse — only filled when an
-- applicant comes through the SMS-apply or in-app screener.
CREATE TABLE "application_screening_answers" (
    "id"             UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    "tenant_id"      UUID         NOT NULL REFERENCES "tenants"("id"),
    "application_id" UUID         NOT NULL REFERENCES "applications"("id") ON DELETE CASCADE,
    "question_id"    UUID         NOT NULL REFERENCES "job_screening_questions"("id") ON DELETE CASCADE,
    "answer_yes"     BOOLEAN,
    "answer_text"    TEXT,
    "answered_at"    TIMESTAMPTZ  NOT NULL DEFAULT now(),
    CONSTRAINT "application_screening_answers_unique"
        UNIQUE ("application_id", "question_id")
);
CREATE INDEX "application_screening_answers_tenant_idx" ON "application_screening_answers"("tenant_id");

-- ─── Job edit events (drives re-notify pipeline) ──────────────────────────
CREATE TABLE "job_edit_events" (
    "id"            UUID                PRIMARY KEY DEFAULT gen_random_uuid(),
    "tenant_id"     UUID                NOT NULL REFERENCES "tenants"("id"),
    "job_id"        UUID                NOT NULL REFERENCES "job_postings"("id") ON DELETE CASCADE,
    "actor_user_id" TEXT                NOT NULL REFERENCES "users"("id"),
    "kind"          "JobEditEventKind"  NOT NULL,
    "field_path"    TEXT,
    "before"        JSONB               NOT NULL DEFAULT '{}',
    "after"         JSONB               NOT NULL DEFAULT '{}',
    "renotify_dispatched_at" TIMESTAMPTZ,
    "created_at"    TIMESTAMPTZ         NOT NULL DEFAULT now()
);
CREATE INDEX "job_edit_events_tenant_idx" ON "job_edit_events"("tenant_id");
CREATE INDEX "job_edit_events_job_idx"    ON "job_edit_events"("job_id", "created_at");

-- ─── Per-applicant re-notification log (idempotency + audit) ─────────────
CREATE TABLE "job_renotifications" (
    "id"             UUID                PRIMARY KEY DEFAULT gen_random_uuid(),
    "tenant_id"      UUID                NOT NULL REFERENCES "tenants"("id"),
    "job_id"         UUID                NOT NULL REFERENCES "job_postings"("id") ON DELETE CASCADE,
    "edit_event_id"  UUID                NOT NULL REFERENCES "job_edit_events"("id") ON DELETE CASCADE,
    "application_id" UUID                NOT NULL REFERENCES "applications"("id") ON DELETE CASCADE,
    "channel"        "RenotifyChannel"   NOT NULL,
    "status"         "RenotifyStatus"    NOT NULL DEFAULT 'queued',
    "sent_at"        TIMESTAMPTZ,
    "error"          TEXT,
    CONSTRAINT "job_renotifications_unique"
        UNIQUE ("edit_event_id", "application_id", "channel")
);
CREATE INDEX "job_renotifications_tenant_idx" ON "job_renotifications"("tenant_id");
CREATE INDEX "job_renotifications_job_idx"    ON "job_renotifications"("job_id");

-- ─── SMS keyword routing ──────────────────────────────────────────────────
-- Inbound Twilio webhook looks up keyword (case-insensitive) within a tenant
-- and routes to the right job-apply flow. Keyword is also denormalized onto
-- job_postings.sms_apply_keyword for convenience; this table is the lookup.
CREATE TABLE "sms_keywords" (
    "id"           UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    "tenant_id"    UUID         NOT NULL REFERENCES "tenants"("id"),
    "keyword"      TEXT         NOT NULL,
    "kind"         TEXT         NOT NULL,
    "entity_id"    UUID         NOT NULL,
    "active"       BOOLEAN      NOT NULL DEFAULT true,
    "created_at"   TIMESTAMPTZ  NOT NULL DEFAULT now(),
    "last_used_at" TIMESTAMPTZ
);
CREATE UNIQUE INDEX "sms_keywords_keyword_unique" ON "sms_keywords" (LOWER("keyword"));
CREATE INDEX "sms_keywords_tenant_idx" ON "sms_keywords"("tenant_id");
CREATE INDEX "sms_keywords_entity_idx" ON "sms_keywords"("kind", "entity_id");
