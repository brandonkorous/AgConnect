-- 20260522120000_shift_series
--
-- Recurring shift schedules. `shift_series` holds the schedule definition for a
-- run of shifts: a date range plus a 7-element weekday mask (index 0 = Monday).
-- Each shift is still materialized as its own row in `shifts`; `shifts.series_id`
-- links a shift back to the series that generated it. NULL = a true one-off
-- shift. ON DELETE SET NULL lets a shift outlive a removed series, so a future
-- series cancellation can leave already-worked shifts intact.
--
-- See docs/20-employer/06-crews-shifts/02-data-model.md.
--
-- Prisma's migrate runner is not transactional here; the repo convention is an
-- explicit BEGIN/COMMIT so a failure mid-migration cannot leave a half-built
-- schema.
BEGIN;

CREATE TABLE "shift_series" (
    "id"           UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    "tenant_id"    UUID         NOT NULL REFERENCES "tenants"("id"),
    "employer_id"  UUID         NOT NULL REFERENCES "employer_profiles"("id"),
    "crew_id"      UUID         REFERENCES "crews"("id"),
    "range_start"  DATE         NOT NULL,
    "range_end"    DATE         NOT NULL,
    "weekday_mask" BOOLEAN[]    NOT NULL,
    "shift_count"  INTEGER      NOT NULL DEFAULT 0,
    "created_at"   TIMESTAMPTZ  NOT NULL DEFAULT now(),
    "updated_at"   TIMESTAMPTZ  NOT NULL DEFAULT now(),
    "deleted_at"   TIMESTAMPTZ,
    CONSTRAINT "shift_series_range_order"      CHECK ("range_end" >= "range_start"),
    CONSTRAINT "shift_series_weekday_mask_len" CHECK (array_length("weekday_mask", 1) = 7)
);
CREATE INDEX "shift_series_tenant_id_idx"   ON "shift_series"("tenant_id");
CREATE INDEX "shift_series_employer_id_idx" ON "shift_series"("employer_id");

-- Link each materialized shift to its parent series. SET NULL keeps the shift
-- row when its series is removed.
ALTER TABLE "shifts" ADD COLUMN "series_id" UUID
    REFERENCES "shift_series"("id") ON DELETE SET NULL;
CREATE INDEX "shifts_series_id_idx" ON "shifts"("series_id");

-- RLS — employer-owned table. Mirrors the `shifts` policy set: admin + service
-- unrestricted, employer reads/writes its own rows via the active employer
-- profile. No worker policy: workers never read a series directly.
ALTER TABLE "shift_series" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "shift_series" FORCE  ROW LEVEL SECURITY;

CREATE POLICY "shift_series_admin"   ON "shift_series"
    USING (current_setting('app.role', true) = 'admin')
    WITH CHECK (current_setting('app.role', true) = 'admin');

CREATE POLICY "shift_series_service" ON "shift_series"
    USING (current_setting('app.role', true) IN ('service','webhook'))
    WITH CHECK (current_setting('app.role', true) IN ('service','webhook'));

CREATE POLICY "shift_series_self_employer" ON "shift_series"
    USING (current_setting('app.role', true) = 'authenticated'
        AND tenant_id = current_setting('app.tenant_id', true)::uuid
        AND employer_id = NULLIF(current_setting('app.employer_id', true), '')::uuid)
    WITH CHECK (current_setting('app.role', true) = 'authenticated'
        AND tenant_id = current_setting('app.tenant_id', true)::uuid
        AND employer_id = NULLIF(current_setting('app.employer_id', true), '')::uuid);

COMMIT;
