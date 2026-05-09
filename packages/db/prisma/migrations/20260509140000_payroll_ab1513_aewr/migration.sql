-- AB 1513 (CA Labor Code §226.2) piece-rate breakdowns + AEWR (H-2A) wage
-- floor support on payroll_lines. Adds non-productive/rest-period hour and
-- pay columns, AEWR top-up, and the applied floor cents per line. Also adds
-- the platform-level aewr_rates reference table.

ALTER TABLE "payroll_lines"
  ADD COLUMN "non_productive_hours"     DECIMAL(6,2) NOT NULL DEFAULT 0,
  ADD COLUMN "rest_period_hours"        DECIMAL(6,2) NOT NULL DEFAULT 0,
  ADD COLUMN "regular_pay_cents"        INTEGER      NOT NULL DEFAULT 0,
  ADD COLUMN "overtime_pay_cents"       INTEGER      NOT NULL DEFAULT 0,
  ADD COLUMN "piece_rate_pay_cents"     INTEGER      NOT NULL DEFAULT 0,
  ADD COLUMN "non_productive_pay_cents" INTEGER      NOT NULL DEFAULT 0,
  ADD COLUMN "rest_period_pay_cents"    INTEGER      NOT NULL DEFAULT 0,
  ADD COLUMN "aewr_top_up_cents"        INTEGER      NOT NULL DEFAULT 0,
  ADD COLUMN "applied_floor_cents"      INTEGER      NOT NULL DEFAULT 0,
  ADD COLUMN "is_h2a"                   BOOLEAN      NOT NULL DEFAULT FALSE;

CREATE TABLE "aewr_rates" (
  "id"             UUID         NOT NULL DEFAULT gen_random_uuid(),
  "state_code"     VARCHAR(2)   NOT NULL,
  "effective_from" DATE         NOT NULL,
  "effective_to"   DATE,
  "hourly_cents"   INTEGER      NOT NULL,
  "source"         TEXT,
  "created_at"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at"     TIMESTAMP(3) NOT NULL,
  CONSTRAINT "aewr_rates_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "aewr_rates_state_code_effective_from_key"
  ON "aewr_rates" ("state_code", "effective_from");

CREATE INDEX "aewr_rates_state_code_effective_from_idx"
  ON "aewr_rates" ("state_code", "effective_from");

-- aewr_rates is platform reference data: readable to all roles, writable
-- only by admin (the script seeds via service role bypassing RLS).
ALTER TABLE "aewr_rates" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "aewr_rates_read_all" ON "aewr_rates"
  FOR SELECT USING (TRUE);

CREATE POLICY "aewr_rates_admin_write" ON "aewr_rates"
  FOR ALL
  USING (current_setting('app.role', TRUE) = 'admin')
  WITH CHECK (current_setting('app.role', TRUE) = 'admin');
