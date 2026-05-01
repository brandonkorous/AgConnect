-- Crews & Shifts — operational layer between Job Postings and Payroll.
-- See docs/20-employer/06-crews-shifts/02-data-model.md.

-- Enums
CREATE TYPE "CrewMemberRole"        AS ENUM ('member', 'lead');
CREATE TYPE "ShiftStatus"           AS ENUM ('scheduled', 'in_progress', 'completed', 'cancelled');
CREATE TYPE "ShiftAssignmentStatus" AS ENUM ('assigned', 'confirmed', 'declined', 'no_show', 'completed');

-- crews
CREATE TABLE "crews" (
    "id"                UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    "tenant_id"         UUID         NOT NULL REFERENCES "tenants"("id"),
    "employer_id"       TEXT         NOT NULL REFERENCES "users"("id"),
    "foreman_user_id"   TEXT         REFERENCES "users"("id"),
    "job_id"            UUID         REFERENCES "job_postings"("id"),
    "name"              TEXT         NOT NULL,
    "color"             TEXT         NOT NULL DEFAULT 'primary',
    "notes"             TEXT,
    "created_at"        TIMESTAMPTZ  NOT NULL DEFAULT now(),
    "updated_at"        TIMESTAMPTZ  NOT NULL DEFAULT now(),
    "deleted_at"        TIMESTAMPTZ
);
CREATE INDEX "crews_tenant_id_idx"        ON "crews"("tenant_id");
CREATE INDEX "crews_employer_id_idx"      ON "crews"("employer_id");
CREATE INDEX "crews_foreman_user_id_idx"  ON "crews"("foreman_user_id");

-- crew_members
CREATE TABLE "crew_members" (
    "id"              UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    "tenant_id"       UUID         NOT NULL REFERENCES "tenants"("id"),
    "crew_id"         UUID         NOT NULL REFERENCES "crews"("id") ON DELETE CASCADE,
    "worker_user_id"  TEXT         NOT NULL REFERENCES "users"("id"),
    "role"            "CrewMemberRole" NOT NULL DEFAULT 'member',
    "joined_at"       TIMESTAMPTZ  NOT NULL DEFAULT now(),
    "left_at"         TIMESTAMPTZ
);
CREATE INDEX "crew_members_tenant_id_idx"         ON "crew_members"("tenant_id");
CREATE INDEX "crew_members_crew_id_idx"           ON "crew_members"("crew_id");
CREATE INDEX "crew_members_worker_user_id_idx"    ON "crew_members"("worker_user_id");
CREATE UNIQUE INDEX "crew_members_one_lead_per_crew"
    ON "crew_members"("crew_id")
    WHERE "role" = 'lead' AND "left_at" IS NULL;
CREATE UNIQUE INDEX "crew_members_active_unique"
    ON "crew_members"("crew_id", "worker_user_id")
    WHERE "left_at" IS NULL;

-- shifts
CREATE TABLE "shifts" (
    "id"               UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
    "tenant_id"        UUID          NOT NULL REFERENCES "tenants"("id"),
    "employer_id"      TEXT          NOT NULL REFERENCES "users"("id"),
    "crew_id"          UUID          REFERENCES "crews"("id"),
    "job_id"           UUID          REFERENCES "job_postings"("id"),
    "shift_date"       DATE          NOT NULL,
    "start_time"       TEXT          NOT NULL,
    "end_time"         TEXT,
    "location_label"   TEXT          NOT NULL,
    "location_lat"     NUMERIC(9,6),
    "location_lng"     NUMERIC(9,6),
    "status"           "ShiftStatus" NOT NULL DEFAULT 'scheduled',
    "notes"            TEXT,
    "created_at"       TIMESTAMPTZ   NOT NULL DEFAULT now(),
    "updated_at"       TIMESTAMPTZ   NOT NULL DEFAULT now(),
    CONSTRAINT "shifts_start_time_format" CHECK ("start_time" ~ '^[0-2][0-9]:[0-5][0-9]$'),
    CONSTRAINT "shifts_end_time_format"   CHECK ("end_time" IS NULL OR "end_time" ~ '^[0-2][0-9]:[0-5][0-9]$')
);
CREATE INDEX "shifts_tenant_id_idx"           ON "shifts"("tenant_id");
CREATE INDEX "shifts_employer_date_idx"       ON "shifts"("employer_id", "shift_date");
CREATE INDEX "shifts_crew_date_idx"           ON "shifts"("crew_id", "shift_date");
CREATE INDEX "shifts_status_idx"              ON "shifts"("status");

-- shift_assignments
CREATE TABLE "shift_assignments" (
    "id"                UUID                    PRIMARY KEY DEFAULT gen_random_uuid(),
    "tenant_id"         UUID                    NOT NULL REFERENCES "tenants"("id"),
    "shift_id"          UUID                    NOT NULL REFERENCES "shifts"("id") ON DELETE CASCADE,
    "worker_user_id"    TEXT                    NOT NULL REFERENCES "users"("id"),
    "status"            "ShiftAssignmentStatus" NOT NULL DEFAULT 'assigned',
    "hours_worked"      NUMERIC(5,2),
    "pieces_count"      INTEGER,
    "piece_rate_cents"  INTEGER,
    "created_at"        TIMESTAMPTZ             NOT NULL DEFAULT now(),
    "updated_at"        TIMESTAMPTZ             NOT NULL DEFAULT now(),
    CONSTRAINT "shift_assignments_unique" UNIQUE ("shift_id", "worker_user_id"),
    CONSTRAINT "shift_assignments_hours_nonneg"
        CHECK ("hours_worked" IS NULL OR "hours_worked" >= 0),
    CONSTRAINT "shift_assignments_pieces_nonneg"
        CHECK ("pieces_count" IS NULL OR "pieces_count" >= 0)
);
CREATE INDEX "shift_assignments_tenant_id_idx"        ON "shift_assignments"("tenant_id");
CREATE INDEX "shift_assignments_worker_shift_idx"     ON "shift_assignments"("worker_user_id", "shift_id");
CREATE INDEX "shift_assignments_status_idx"           ON "shift_assignments"("status");

-- RLS — admin/service unrestricted; employer reads/writes own (via employer_id);
-- worker can read their own assignments + the parent shift.

ALTER TABLE "crews" ENABLE ROW LEVEL SECURITY; ALTER TABLE "crews" FORCE ROW LEVEL SECURITY;
CREATE POLICY "crews_admin"            ON "crews" USING (current_setting('app.role', true) = 'admin')
    WITH CHECK (current_setting('app.role', true) = 'admin');
CREATE POLICY "crews_service"          ON "crews" USING (current_setting('app.role', true) IN ('service','webhook'))
    WITH CHECK (current_setting('app.role', true) IN ('service','webhook'));
CREATE POLICY "crews_self_employer"    ON "crews"
    USING (current_setting('app.role', true) = 'authenticated'
        AND tenant_id = current_setting('app.tenant_id', true)::uuid
        AND employer_id = current_setting('app.user_id', true))
    WITH CHECK (current_setting('app.role', true) = 'authenticated'
        AND tenant_id = current_setting('app.tenant_id', true)::uuid
        AND employer_id = current_setting('app.user_id', true));

ALTER TABLE "crew_members" ENABLE ROW LEVEL SECURITY; ALTER TABLE "crew_members" FORCE ROW LEVEL SECURITY;
CREATE POLICY "crew_members_admin"     ON "crew_members" USING (current_setting('app.role', true) = 'admin')
    WITH CHECK (current_setting('app.role', true) = 'admin');
CREATE POLICY "crew_members_service"   ON "crew_members" USING (current_setting('app.role', true) IN ('service','webhook'))
    WITH CHECK (current_setting('app.role', true) IN ('service','webhook'));
CREATE POLICY "crew_members_self_employer" ON "crew_members"
    USING (current_setting('app.role', true) = 'authenticated'
        AND tenant_id = current_setting('app.tenant_id', true)::uuid
        AND EXISTS (SELECT 1 FROM "crews" c WHERE c.id = crew_members.crew_id
            AND c.employer_id = current_setting('app.user_id', true)))
    WITH CHECK (current_setting('app.role', true) = 'authenticated'
        AND tenant_id = current_setting('app.tenant_id', true)::uuid
        AND EXISTS (SELECT 1 FROM "crews" c WHERE c.id = crew_members.crew_id
            AND c.employer_id = current_setting('app.user_id', true)));
CREATE POLICY "crew_members_self_worker" ON "crew_members"
    FOR SELECT
    USING (current_setting('app.role', true) = 'authenticated'
        AND worker_user_id = current_setting('app.user_id', true));

ALTER TABLE "shifts" ENABLE ROW LEVEL SECURITY; ALTER TABLE "shifts" FORCE ROW LEVEL SECURITY;
CREATE POLICY "shifts_admin"           ON "shifts" USING (current_setting('app.role', true) = 'admin')
    WITH CHECK (current_setting('app.role', true) = 'admin');
CREATE POLICY "shifts_service"         ON "shifts" USING (current_setting('app.role', true) IN ('service','webhook'))
    WITH CHECK (current_setting('app.role', true) IN ('service','webhook'));
CREATE POLICY "shifts_self_employer"   ON "shifts"
    USING (current_setting('app.role', true) = 'authenticated'
        AND tenant_id = current_setting('app.tenant_id', true)::uuid
        AND employer_id = current_setting('app.user_id', true))
    WITH CHECK (current_setting('app.role', true) = 'authenticated'
        AND tenant_id = current_setting('app.tenant_id', true)::uuid
        AND employer_id = current_setting('app.user_id', true));
CREATE POLICY "shifts_self_worker_select" ON "shifts"
    FOR SELECT
    USING (current_setting('app.role', true) = 'authenticated'
        AND EXISTS (SELECT 1 FROM "shift_assignments" sa
            WHERE sa.shift_id = shifts.id
              AND sa.worker_user_id = current_setting('app.user_id', true)));

ALTER TABLE "shift_assignments" ENABLE ROW LEVEL SECURITY; ALTER TABLE "shift_assignments" FORCE ROW LEVEL SECURITY;
CREATE POLICY "shift_assignments_admin"   ON "shift_assignments" USING (current_setting('app.role', true) = 'admin')
    WITH CHECK (current_setting('app.role', true) = 'admin');
CREATE POLICY "shift_assignments_service" ON "shift_assignments" USING (current_setting('app.role', true) IN ('service','webhook'))
    WITH CHECK (current_setting('app.role', true) IN ('service','webhook'));
CREATE POLICY "shift_assignments_self_employer" ON "shift_assignments"
    USING (current_setting('app.role', true) = 'authenticated'
        AND tenant_id = current_setting('app.tenant_id', true)::uuid
        AND EXISTS (SELECT 1 FROM "shifts" s WHERE s.id = shift_assignments.shift_id
            AND s.employer_id = current_setting('app.user_id', true)))
    WITH CHECK (current_setting('app.role', true) = 'authenticated'
        AND tenant_id = current_setting('app.tenant_id', true)::uuid
        AND EXISTS (SELECT 1 FROM "shifts" s WHERE s.id = shift_assignments.shift_id
            AND s.employer_id = current_setting('app.user_id', true)));
CREATE POLICY "shift_assignments_self_worker" ON "shift_assignments"
    USING (current_setting('app.role', true) = 'authenticated'
        AND worker_user_id = current_setting('app.user_id', true))
    WITH CHECK (current_setting('app.role', true) = 'authenticated'
        AND worker_user_id = current_setting('app.user_id', true));
