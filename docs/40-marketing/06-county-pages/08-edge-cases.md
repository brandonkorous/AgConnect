# 06 — County Landing Pages: Edge Cases

## Invalid / unexpected county slug

- **Unknown slug** (`/en/jobs/county/sonoma`, typo, garbage): `[county]` is
  guarded by `isCountySlug`. On miss, call `notFound()`. Because a segment-
  scoped `not-found.tsx` only fires on `notFound()` calls and **not** on
  unmatched URLs, pair the dynamic `[county]/page.tsx` with the guard so bad
  slugs render the localized section 404 chrome, not a bare Next 404
  ([[feedback-nested-not-found-needs-catchall]]).
- **Casing / encoding** (`/en/jobs/county/Fresno`, `%20`): normalize to
  lowercase before the guard; `Fresno` → `fresno` resolves, anything else 404s.
  Do not 301 case variants individually — normalize then serve canonical.
- **`/jobs/county` with no county**: no page at that path. **Inferred:** 404
  rather than redirect, to avoid a soft-404 indexable shell; the footer/links
  never generate this URL.

## Data edge cases

- **0 active jobs in a county**: page stays 200 and indexable (a county we
  serve with no current postings is still a real, rankable entity). Empty-state
  copy + county context + cross-links. Never 404 a valid county on empty data —
  that would de-index a page seasonally and lose accrued ranking.
- **1–2 jobs (median meaningless)**: suppress median, use
  `intro_template_no_median`. Don't print a "median" off one posting
  (specific-before-general; no manufactured precision).
- **All jobs in county share one title**: `topRole` is that title; intro still
  grammatical ("Most are X roles").
- **Job count volatile across revalidation**: acceptable — ISR matches `/jobs`
  cadence; the answer paragraph says "right now", which is honest for a cached
  snapshot. Do not claim real-time.
- **Very large county set (50+)**: display caps at "50+"; list paginates via
  the reused `/jobs` component's existing pagination, not a new mechanism.

## SEO / duplication

- **Thin-content risk on empty counties**: mitigated by the static county-
  context block (crops/seasons) + FAQ, so even a 0-job page has unique
  bilingual content and is not a near-empty duplicate of its siblings.
- **Duplicate-content vs `/jobs?county=`**: county page is `canonical` to
  itself; the `/jobs?county=` filtered view is **not** independently
  canonicalized to the county page (different intent — index filter vs landing).
  **Inferred:** leave `/jobs?county=` as-is; revisit only if Search Console
  flags duplication.
- **hreflang mismatch**: EN county page's `alternate` must point to the **same
  county's** ES page (`/en/jobs/county/kern` ↔ `/es/jobs/county/kern`), never
  to `/es/jobs`. Cross-locale, same-entity.

## Routing collision

- A real job whose slug is literally `county` cannot shadow this route: county
  pages live at `jobs/county/[county]` (two segments); job detail is
  `jobs/[slug]` (one). They never overlap. If slug generation could ever emit
  `county` as a one-segment job slug, reserve it in the slug blocklist
  (cross-ref [10-worker/03-job-discovery] slug rules).

## Locale edge

- **Missing ES county string at runtime** (seed not reseeded after a copy
  change): the bilingual parity check should have failed the build
  ([[feedback-bilingual-by-design]]); if it somehow renders, fall back to the
  key name is unacceptable for a public SEO page — treat a missing
  `county.*` ES key as a build blocker, not a runtime fallback.
