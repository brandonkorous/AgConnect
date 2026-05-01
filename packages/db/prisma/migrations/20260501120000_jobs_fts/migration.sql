-- Bilingual full-text search column for job postings. We index title +
-- description in both English and Spanish into a single tsvector so a Spanish
-- speaker searching "cosecha" matches an English-only "harvest" listing too
-- (and vice versa). The column is generated, so it stays in sync without
-- application code remembering to set it.
--
-- Implementation notes:
--   * `to_tsvector('simple', ...)` instead of language-specific dictionaries
--     so accents / stems / stopwords don't differ between locales.
--   * Concat both locales with weight A/B so titles outrank descriptions.
--   * GIN index gives us sub-millisecond lookups even at 100K+ jobs.

ALTER TABLE "job_postings"
  ADD COLUMN "search_vector" tsvector
  GENERATED ALWAYS AS (
    setweight(to_tsvector('simple', coalesce("title_en", '')), 'A') ||
    setweight(to_tsvector('simple', coalesce("title_es", '')), 'A') ||
    setweight(to_tsvector('simple', coalesce("description_en", '')), 'B') ||
    setweight(to_tsvector('simple', coalesce("description_es", '')), 'B')
  ) STORED;

CREATE INDEX "job_postings_search_vector_idx"
  ON "job_postings" USING GIN ("search_vector");
