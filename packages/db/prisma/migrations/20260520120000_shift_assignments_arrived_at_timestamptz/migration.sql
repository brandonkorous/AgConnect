-- 20260520120000_shift_assignments_arrived_at_timestamptz
--
-- Promote `shift_assignments.arrived_at` from `TIMESTAMP(3) WITHOUT TIME ZONE`
-- to `TIMESTAMPTZ(3)`. The original column stored UTC instants but advertised
-- no timezone, which made every "arrived at {time}" render unambiguous on the
-- client only when the runtime happened to be UTC. Existing values are
-- interpreted as UTC (which is how Prisma + GKE wrote them) via
-- `AT TIME ZONE 'UTC'`.
--
-- Prisma's migrate runner is not transactional here (multi-statement file,
-- single DDL — but the convention in this repo is explicit BEGIN/COMMIT so a
-- failure mid-migration does not leave a half-typed column).
BEGIN;

ALTER TABLE "shift_assignments"
    ALTER COLUMN "arrived_at" TYPE TIMESTAMPTZ(3)
    USING "arrived_at" AT TIME ZONE 'UTC';

COMMIT;
