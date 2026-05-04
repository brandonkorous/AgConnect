-- Crew editor overhaul: turns the modal-based crew editor into a full-page
-- section-rail editor with first-class fields for crew identity (short code,
-- crew type, primary crop), schedule color (now a 6-stop palette tied to
-- crops, not the daisyUI semantic colors), required-skill gating, pay
-- defaults, and per-crew communication channel toggles.
--
-- Color palette migration: existing semantic colors map onto the closest
-- palette stop. Default for new rows is "olive" (the brand primary).
--
-- See docs/design/project/employer-edit-crew.jsx.

-- 1. New fields on `crews`.
ALTER TABLE "crews"
    ADD COLUMN "short_code"             VARCHAR(8),
    ADD COLUMN "crew_type"              VARCHAR(32),
    ADD COLUMN "primary_crop"           VARCHAR(32),
    ADD COLUMN "required_skills"        TEXT[]   NOT NULL DEFAULT ARRAY[]::TEXT[],
    ADD COLUMN "base_wage_cents"        INTEGER,
    ADD COLUMN "piece_rate_cents"       INTEGER,
    ADD COLUMN "piece_rate_unit"        VARCHAR(16),
    ADD COLUMN "foreman_premium_cents"  INTEGER,
    ADD COLUMN "comms_channels"         JSONB    NOT NULL DEFAULT '{}'::jsonb;

-- 2. Migrate the schedule color from daisyUI semantic tokens to the new
--    crop-themed palette. Anything unrecognised falls through to "olive".
UPDATE "crews"
SET    "color" = CASE "color"
                   WHEN 'primary' THEN 'olive'
                   WHEN 'accent'  THEN 'almond'
                   WHEN 'info'    THEN 'grape'
                   WHEN 'success' THEN 'lettuce'
                   WHEN 'warning' THEN 'citrus'
                   ELSE                'olive'
                 END;

-- 3. Flip the column default to the new palette.
ALTER TABLE "crews" ALTER COLUMN "color" SET DEFAULT 'olive';
