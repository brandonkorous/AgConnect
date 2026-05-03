-- Employer address — required during onboarding for FLC verification.
-- Columns are nullable at the DB level so existing pre-2026-05-03 rows don't
-- block the migration; new sign-ups are forced to populate them via the
-- onboarding Zod schema in packages/schemas/src/employer.ts.
--
-- See docs/20-employer/01-flc-verification/02-data-model.md.

ALTER TABLE "employer_profiles"
    ADD COLUMN "street_address" TEXT,
    ADD COLUMN "city"           TEXT,
    ADD COLUMN "state_code"     TEXT,
    ADD COLUMN "postal_code"    TEXT,
    ADD COLUMN "address_lat"    NUMERIC(9,6),
    ADD COLUMN "address_lng"    NUMERIC(9,6),
    ADD COLUMN "mapbox_id"      TEXT;

-- US state code is always two upper-case letters when set.
ALTER TABLE "employer_profiles"
    ADD CONSTRAINT "employer_profiles_state_code_format"
        CHECK ("state_code" IS NULL OR "state_code" ~ '^[A-Z]{2}$');

-- US ZIP is 5 digits, optionally + 4. Allows existing legacy free-text rows
-- to remain by only enforcing on non-null.
ALTER TABLE "employer_profiles"
    ADD CONSTRAINT "employer_profiles_postal_code_format"
        CHECK ("postal_code" IS NULL OR "postal_code" ~ '^[0-9]{5}(-[0-9]{4})?$');

-- Lat/lng are either both set or both null.
ALTER TABLE "employer_profiles"
    ADD CONSTRAINT "employer_profiles_address_geo_paired"
        CHECK (
            ("address_lat" IS NULL AND "address_lng" IS NULL)
            OR ("address_lat" IS NOT NULL AND "address_lng" IS NOT NULL)
        );

CREATE INDEX "employer_profiles_address_geo_idx"
    ON "employer_profiles"("address_lat", "address_lng")
    WHERE "address_lat" IS NOT NULL AND "address_lng" IS NOT NULL;
