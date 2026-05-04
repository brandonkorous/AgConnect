-- Shift editor overhaul: introduces a categorical `shift_type` (work / training /
-- off / holiday) plus a freeform `metadata` JSONB used by the editor for
-- per-shift settings the data model didn't previously cover (pickup, equipment,
-- lunch, safety checklist, notification preferences, heat-advisory state, etc.).
-- Repeat-day expansion is materialised at write-time, so this migration adds
-- no recurrence columns.
--
-- See docs/20-employer/06-crews-shifts/04-ui.md and
-- docs/design/project/employer-edit-shift.jsx.

CREATE TYPE "ShiftType" AS ENUM ('work', 'training', 'off', 'holiday');

ALTER TABLE "shifts"
    ADD COLUMN "shift_type" "ShiftType" NOT NULL DEFAULT 'work',
    ADD COLUMN "metadata"   JSONB        NOT NULL DEFAULT '{}'::jsonb;

CREATE INDEX "shifts_shift_type_idx" ON "shifts"("shift_type");
