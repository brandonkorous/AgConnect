-- =============================================================================
-- AgConn — Field Mode worker arrival timestamp
-- =============================================================================
--
-- Adds a nullable arrived_at timestamp to shift_assignments so a worker can
-- press the "I'm here" tile in Field Mode and have the moment of arrival
-- recorded distinctly from the existing "confirmed" assignment status (which
-- means "I accept this shift", not "I have arrived"). Foreman/HR systems can
-- consume this signal in a follow-up.
-- =============================================================================

ALTER TABLE "shift_assignments"
  ADD COLUMN IF NOT EXISTS "arrived_at" TIMESTAMP(3);

CREATE INDEX IF NOT EXISTS "shift_assignments_arrived_at_idx"
  ON "shift_assignments" ("arrived_at")
  WHERE "arrived_at" IS NOT NULL;
