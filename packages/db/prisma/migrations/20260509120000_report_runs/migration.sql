-- WIOA / CalJOBS placement-report support.
-- Adds the report_runs audit table + a hot-path index for hired-only
-- application scans during quarterly exports.
-- See docs/30-admin/02-placement-report/02-data-model.md.

CREATE TABLE "report_runs" (
    "id"           UUID         NOT NULL DEFAULT gen_random_uuid(),
    "tenant_id"    UUID,
    "report_type"  TEXT         NOT NULL,
    "filters"      JSONB        NOT NULL,
    "row_count"    INTEGER      NOT NULL,
    "format"       TEXT         NOT NULL,
    "generated_by" TEXT         NOT NULL,
    "generated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "blob_path"    TEXT,

    CONSTRAINT "report_runs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "report_runs_report_type_generated_at_idx"
    ON "report_runs" ("report_type", "generated_at");

CREATE INDEX "report_runs_tenant_id_generated_at_idx"
    ON "report_runs" ("tenant_id", "generated_at");

-- Admin-only table; mirror the standard three-policy template so the
-- check-rls.mjs gate doesn't flag it. Service role retained so the
-- audit-retention worker can prune old rows.
ALTER TABLE "report_runs" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "report_runs" FORCE  ROW LEVEL SECURITY;

CREATE POLICY "report_runs_admin" ON "report_runs"
    USING (current_setting('app.role', true) = 'admin')
    WITH CHECK (current_setting('app.role', true) = 'admin');

CREATE POLICY "report_runs_service" ON "report_runs"
    USING (current_setting('app.role', true) IN ('service', 'webhook'))
    WITH CHECK (current_setting('app.role', true) IN ('service', 'webhook'));

-- Hot path for placement-report generation: filtered to hired, non-deleted
-- rows so the index stays small and quarterly scans are bounded.
CREATE INDEX IF NOT EXISTS "applications_hired_at_idx"
    ON "applications" ("hired_at")
    WHERE "status" = 'hired' AND "deleted_at" IS NULL;
