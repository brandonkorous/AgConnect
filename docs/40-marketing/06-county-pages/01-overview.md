# 06 — County Landing Pages: Overview

## Purpose

One indexable, bilingual landing page per **service county** so AGCONN ranks for
high-intent local long-tail queries the SEO spec already targets — "Fresno
strawberry harvest jobs", "trabajo agrícola condado de Tulare", "Kern County
farm labor" — instead of funnelling every query into the generic `/jobs` index.

These are **marketing/SEO surfaces**, not a new product feature. They wrap the
existing jobs data in a county-scoped, answer-format page with county-specific
structured data. They do not introduce new write paths, auth, or tenant logic.

## Service counties (the only valid pages)

Fresno, Tulare, Kern, Kings, Madera. This is the same five-county set used by
the county picker, `FeaturedJobs`, and `areaServed` — the home county (Visalia /
Tulare) is **not** special-cased here; it is one service county among five. See
[[project-hq-visalia-tulare]] for the HQ-vs-service-area distinction.

## Route

> **Inferred:** `/[locale]/jobs/county/[county]` (e.g. `/en/jobs/county/fresno`,
> `/es/jobs/county/tulare`). A dedicated `county/` segment under `jobs/` avoids
> collision with the existing `/[locale]/jobs/[slug]` job-detail route and reads
> as a crawlable hierarchy. `[county]` is constrained to the five slugs above;
> anything else is a 404 (see [08-edge-cases](08-edge-cases.md)).

10 static pages total: 5 counties × 2 locales. Generated at build via
`generateStaticParams`, ISR-revalidated on the same cadence as `/jobs`.

## What each page contains

1. **County H1 + answer-format intro** — one direct-answer bilingual paragraph
   ("There are N seasonal farm jobs in Fresno County right now, paying a median
   of $X/hr…"), the format AI Overviews and Perplexity cite.
2. **Live job count + median wage** for that county, from the jobs API.
3. **Job list** scoped to the county (reuses the `/jobs` listing component with
   a fixed county filter — no new list UI).
4. **County context block** — top crops / seasons / common roles for that
   county (static editorial content, bilingual, in the i18n seed bundles).
5. **County-scoped JSON-LD** — `ItemList` of `JobPosting`s + a `FAQPage` block.
6. **Cross-links** — to the other four counties and to `/jobs` (internal link
   equity; the existing footer county links point here).

## In scope

- 10 static county landing pages, EN + ES, full parity.
- `generateMetadata` (title, description, canonical, hreflang) per county.
- County-scoped `ItemList` + `FAQPage` JSON-LD via the [09-seo-aio](../../00-foundation/09-seo-aio/) helpers.
- Sitemap entries for all 10 URLs.
- Wiring the existing footer county links + `FeaturedJobs` county chips to these routes.
- Editorial county-context copy in the i18n seed bundles (EN + ES).

## Out of scope

- New job data, filters, or search behaviour — pages consume the existing jobs API.
- Per-county OG image variants (use the standard marketing OG image; **Inferred**).
- City-level pages (Visalia, Bakersfield, …) — county granularity only for MVP.
- Employer-facing or training county pages — jobs only for MVP.
- Editable-by-admin county copy (CMS) — copy ships in seed bundles.

## Success criteria

- All 10 pages valid at `validator.schema.org`, Lighthouse SEO ≥ 95, CWV "Good".
- Each page indexed in Search Console within 7 days of publish.
- Footer/`FeaturedJobs` county links resolve to a real page (no dead links).
- EN/ES parity enforced by the bilingual parity check ([[feedback-bilingual-by-design]]).

## Dependencies

- [00-foundation/09-seo-aio](../../00-foundation/09-seo-aio/) — metadata, JSON-LD, sitemap, hreflang helpers.
- [10-worker/03-job-discovery](../../10-worker/03-job-discovery/) — the jobs listing component + jobs API this reuses.
- [40-marketing/01-landing](../01-landing/) — footer county links + `FeaturedJobs` chips that now target these routes.
- [40-marketing/02-faq](../02-faq/) — shared `FAQPage` JSON-LD pattern; some county FAQ entries derive from the global FAQ set.
