# 06 — County Landing Pages: Data Model

## No new tables

County pages introduce **zero schema changes**. They read existing data and a
small static county registry. Job postings already carry a county; the picker,
`FeaturedJobs`, and `areaServed` use the same five-county set.

## County registry (static, code)

A single shared module is the source of truth for the five service counties.
Reused by `CountyPicker`, `FeaturedJobs`, `MarketingFooter`, and these pages so
the list never drifts.

> **Inferred:** location `packages/schemas/src/counties.ts` (leaf package,
> already imported by web). If a county constant already exists elsewhere,
> consolidate into it rather than adding a parallel list.

```ts
export const SERVICE_COUNTIES = ['fresno', 'tulare', 'kern', 'kings', 'madera'] as const;
export type CountySlug = (typeof SERVICE_COUNTIES)[number];

// Display + region are i18n keys, not literals — copy lives in seed bundles.
// slug -> the value job_postings.county is stored as (canonical, EN proper noun).
export const COUNTY_DB_VALUE: Record<CountySlug, string> = {
  fresno: 'Fresno', tulare: 'Tulare', kern: 'Kern', kings: 'Kings', madera: 'Madera',
};
```

`isCountySlug(x): x is CountySlug` guards the route param.

## Per-page data (read-only, request time)

For a given `(locale, county)` the page assembles:

| field | source |
| --- | --- |
| `jobs[]` | jobs API, filtered to `county = COUNTY_DB_VALUE[slug]`, active only, ordered `createdAt desc` (endpoint's only order); cursor-paginated, capped at ≤ 60 for aggregates (see [03-api](03-api.md)) |
| `jobCount` | length of the filtered set (capped display: "50+") |
| `medianWageCents` | computed server-side from `jobs[]` hourly rates; null if < 3 jobs |
| `topRoles[]` | top 3 distinct job titles by frequency in `jobs[]` (for the intro sentence) |
| `countyContext` | **static** editorial copy from i18n seed bundle (crops, seasons) — not derived from jobs |
| `siblingCounties` | `SERVICE_COUNTIES` minus current, for cross-links |

> **Inferred:** median wage is suppressed when fewer than 3 active postings
> exist in the county, to avoid a misleading "median" off one job and to keep
> the answer-format sentence honest ([[feedback-tierra-not-editorial]] — specific
> before general, never manufactured).

## i18n keys (county content)

Per-county editorial copy lives in the **landing** seed bundle
(`packages/db/seed-data/translations/landing.ts`), DB-backed per
[[feedback-bilingual-by-design]] — edit the bundle + reseed, never the generated
JSON. Key shape:

```
county.fresno.h1            county.fresno.intro_template
county.fresno.context_crops county.fresno.context_seasons
county.fresno.meta_title    county.fresno.meta_description
county.fresno.faq.q1 / a1 … (3 entries)
```

`intro_template` holds placeholders the page fills at render —
`{count}`, `{median}`, `{topRole}` — so the answer sentence is dynamic but the
sentence *structure* is translator-controlled per language (ES is not a
templated translation of EN; both are authored).

## Caching

Pages are statically generated (`generateStaticParams` over 5×2) and ISR-
revalidated on the **same interval as `/jobs`** so counts/wages don't go stale
relative to the index they summarize. No per-county cache key beyond the route.
