-- Normalize JobPosting.skills from a free-text mix of display labels and
-- slugs to slug-only values matching SkillTag.slug. The frontend chip UI in
-- apps/web Requirements.tsx compares state.skills entries against the seeded
-- SkillTag.slug list; legacy rows that contained "Harvesting", "Crew
-- leadership", and "Bilingual EN/ES" never round-tripped through the chips.
--
-- Idempotent: re-running on already-normalized data is a no-op because every
-- mapped slug maps to itself in the CASE.

UPDATE "job_postings"
SET    skills = ARRAY(
    SELECT CASE s
        -- Known legacy display labels surfaced during browser testing.
        WHEN 'Harvesting'      THEN 'harvesting'
        WHEN 'Crew leadership' THEN 'crew_leadership'
        WHEN 'Bilingual EN/ES' THEN 'bilingual_en_es'
        WHEN 'Forklift'        THEN 'forklift'
        WHEN 'WPS cert'        THEN 'wps_cert'
        WHEN 'Heat illness'    THEN 'heat_illness'
        WHEN 'CDL-A'           THEN 'cdl_a'
        WHEN 'CDL-B'           THEN 'cdl_b'
        WHEN 'First aid'       THEN 'first_aid'
        WHEN 'Tractor op.'     THEN 'tractor_op'
        WHEN 'Ladder safety'   THEN 'ladder_safety'
        WHEN 'Pre-shake'       THEN 'pre_shake'
        WHEN 'Hand harvest'    THEN 'hand_harvest'
        WHEN 'Pruning'         THEN 'pruning'
        WHEN 'Thinning'        THEN 'thinning'
        WHEN 'Packing'         THEN 'packing'
        WHEN 'Sort line'       THEN 'sort_line'
        WHEN 'Irrigation'      THEN 'irrigation'
        WHEN 'Planting'        THEN 'planting'
        -- Defensive fallback: lowercase + non-alphanum to underscore.
        ELSE LOWER(REGEXP_REPLACE(s, '[^a-zA-Z0-9]+', '_', 'g'))
    END
    FROM   unnest(skills) AS s
)
WHERE  skills <> ARRAY[]::text[];
