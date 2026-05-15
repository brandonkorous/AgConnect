-- Per-parse audit row for the resume-parser service. Tracks token usage and
-- computed cost so monthly billing rollups can attribute LLM spend per tenant.
-- See docs/00-foundation/07-resume-parser/02-data-model.md and the GAP-CLOSURE
-- plan Phase 2 (resume parser productionization).

CREATE TYPE "ParseJobStatus" AS ENUM ('queued', 'running', 'succeeded', 'failed');

CREATE TYPE "ParseExtractKind" AS ENUM ('pdf_text', 'pdf_ocr', 'docx', 'plaintext', 'html');

CREATE TABLE "resume_parse_jobs" (
    "id"                  UUID                NOT NULL DEFAULT gen_random_uuid(),
    "tenant_id"           UUID                NOT NULL,
    "user_id"             TEXT                NOT NULL,
    "blob_path"           TEXT                NOT NULL,
    "extract_kind"        "ParseExtractKind",
    "raw_text_length"     INTEGER,
    "status"              "ParseJobStatus"    NOT NULL,
    "model_used"          TEXT,
    "input_tokens"        INTEGER,
    "output_tokens"       INTEGER,
    "cache_read_tokens"   INTEGER,
    "cache_write_tokens"  INTEGER,
    "cost_usd"            DECIMAL(10, 5),
    "parse_duration_ms"   INTEGER,
    "error_code"          TEXT,
    "error_msg"           TEXT,
    "repair_attempted"    BOOLEAN             NOT NULL DEFAULT FALSE,
    "created_at"          TIMESTAMP(3)        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at"        TIMESTAMP(3),

    CONSTRAINT "resume_parse_jobs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "resume_parse_jobs_tenant_id_idx"  ON "resume_parse_jobs"("tenant_id");
CREATE INDEX "resume_parse_jobs_user_id_idx"    ON "resume_parse_jobs"("user_id");
CREATE INDEX "resume_parse_jobs_status_created" ON "resume_parse_jobs"("status", "created_at");

-- Standard three-policy RLS template. Admin: full. Service: tenant-scoped
-- read+write. Worker: own rows only (authenticated role checks user_id).
-- See docs/00-foundation/03-database/04-rls.md for the policy contract.
ALTER TABLE "resume_parse_jobs" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "resume_parse_jobs" FORCE  ROW LEVEL SECURITY;

CREATE POLICY "resume_parse_jobs_admin" ON "resume_parse_jobs"
    USING (current_setting('app.role', true) = 'admin')
    WITH CHECK (current_setting('app.role', true) = 'admin');

CREATE POLICY "resume_parse_jobs_service" ON "resume_parse_jobs"
    USING (
        current_setting('app.role', true) IN ('service', 'webhook')
        AND tenant_id = current_setting('app.tenant_id', true)::uuid
    )
    WITH CHECK (
        current_setting('app.role', true) IN ('service', 'webhook')
        AND tenant_id = current_setting('app.tenant_id', true)::uuid
    );

CREATE POLICY "resume_parse_jobs_worker_read" ON "resume_parse_jobs"
    FOR SELECT
    USING (
        current_setting('app.role', true) = 'authenticated'
        AND user_id = current_setting('app.user_id', true)
    );
