# 06 — County Landing Pages: Acceptance

## Endpoint: sorting / filtering / paging

- [ ] `GET /v1/landing/jobs` with no params returns the **same** result set and
      order as before this change (`recent` = `createdAt desc`, default
      `limit` 20) — `/jobs` and `FeaturedJobs` regression-free.
- [ ] `sort=wage_desc|wage_asc|start_soon|recent` each return correctly ordered
      rows; `sort=garbage` → 400.
- [ ] `county=Fresno` (any of the 5, case-insensitive) filters server-side;
      `county=Sonoma` / unchecked value → 400, never reaches Prisma.
- [ ] `limit` clamped to 1–50; `limit=0`/`limit=999`/`limit=abc` → 400.
- [ ] A `cursor` minted under one `sort` replayed with a different `sort` →
      400 `cursor_sort_mismatch` (no corrupt/duplicated page).
- [ ] Following `nextCursor` to the 3rd page yields no overlap/gap for each sort.

## Routing & generation

- [ ] `/[locale]/jobs/county/{fresno,tulare,kern,kings,madera}` resolves for
      both `en` and `es` — 10 pages, all 200.
- [ ] `generateStaticParams` emits exactly those 10; no others.
- [ ] An unknown county slug (`/en/jobs/county/sonoma`, `/en/jobs/county/x`)
      returns the localized 404 (section chrome, not a blank), per
      [08-edge-cases](08-edge-cases.md) and the nested-not-found pattern
      ([[feedback-nested-not-found-needs-catchall]]).
- [ ] `/[locale]/jobs/county` (no county) does not render a broken page —
      404 or redirect to `/jobs`.
- [ ] No collision with `/[locale]/jobs/[slug]`: a real job slug still resolves
      to the job-detail page; `county` is never swallowed as a slug.

## Content & data

- [ ] Each page's answer paragraph is server-rendered real text in the initial
      HTML (verify via `view-source`, not just hydrated DOM).
- [ ] Job count and median wage match `/jobs?county=…` for the same county at
      the same revalidation point.
- [ ] < 3 active jobs → median suppressed, no-median intro variant used.
- [ ] 0 active jobs → page still 200 and indexable, empty-state copy + cross-
      links shown, no 404, no urgency copy.
- [ ] `topRole` reflects the actual most-frequent title in that county's jobs.

## SEO / AIO

- [ ] `generateMetadata` per page: unique title, description, `canonical`,
      `hreflang` EN↔ES alternates pointing at the sibling-locale county page.
- [ ] Valid `BreadcrumbList`, `ItemList`(of `JobPosting`), and `FAQPage`
      JSON-LD — passes `validator.schema.org` with zero errors on all 10.
- [ ] Lighthouse SEO ≥ 95; LCP < 2.5s, CLS < 0.1, INP < 200ms on mobile 4G.
- [ ] All 10 URLs present in `sitemap.xml` with hreflang alternates.
- [ ] AI crawlers (GPTBot, PerplexityBot, ClaudeBot) not blocked for these routes.

## Internal linking

- [ ] Footer county links resolve to the matching county page (no dead links)
      in EN and ES.
- [ ] Each county page cross-links to the other four + "All counties" → `/jobs`.
- [ ] `FeaturedJobs` active-chip "View all … jobs" link points at the county page.

## i18n / brand

- [ ] Every `county.*` key has EN and ES; bilingual parity check passes (build
      fails if any ES county string is missing) ([[feedback-bilingual-by-design]]).
- [ ] No EN-only render path: forcing `es` shows fully Spanish page incl. intro.
- [ ] H1/meta contain no forbidden marketing verbs; numbers use Inter
      tabular-nums; no emoji; FontAwesome per-icon only; canonical container used.
- [ ] 44×44 touch targets, visible focus ring, county not conveyed by color
      alone, `prefers-reduced-motion` respected.
