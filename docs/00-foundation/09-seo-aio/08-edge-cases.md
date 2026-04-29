# 09 — SEO & AIO: Edge Cases & Risks

## Duplicate content from locale forks

`/en/jobs/abc` and `/es/trabajos/abc` show different language but the same underlying entity.

**Mitigation:**

- `hreflang` alternates declared on every page so Google understands the relationship.
- Each locale has its own canonical (NOT canonicalized to one locale).
- `x-default` points to ES (the default locale).

## Slug collisions

Two job postings could attempt the same slug if generated from similar inputs.

**Mitigation:** the suffix (`randomBytes(2).toString('hex')`) makes collisions vanishingly rare. On the unique-constraint violation, retry with a new suffix (max 3 retries before failing the create).

## Slug change after publish

Worker / employer / admin wants to change a posting title; should the slug update?

**Decision:** **NO.** Once published, the slug is immutable. Title edits don't change the URL — preserves inbound links. If the title changes drastically, archive the old posting and create a new one.

## Stale sitemap entries

A job posting is filled or closed but the sitemap still references it.

**Mitigation:**

- Sitemap query filters `status = 'active' AND deletedAt IS NULL`.
- ISR cache 1 hour — closed jobs disappear from the sitemap within an hour.
- Closed job pages return 410 Gone (not 404) so search engines deindex faster.

## OG image cache busting

OG image cached by social media scrapers; updates to title/wage don't reflect on Twitter / LinkedIn shares.

**Mitigation:**

- OG image URL includes the entity ID and the `updatedAt` ISO timestamp as a query param: `/og/job/<id>?v=<updated_at>`.
- Forces scrapers to refetch when content changes.
- Trade-off: slightly less browser caching on the OG endpoint.

## Bot impersonation

Some "AI crawlers" don't honor robots.txt; some bad bots impersonate Googlebot.

**Mitigation:**

- Robots.txt is advisory, not enforcement.
- Rate-limit at the ingress (Nginx) by UA + IP for repeat suspicious patterns.
- Cloudflare bot management as a future option (out of scope for MVP).

## JSON-LD vs visible content mismatch

Google penalizes pages where structured data describes content not visible on the page.

**Mitigation:**

- Both the visible page and the JSON-LD use the same entity object — derived from the same DB row.
- Test: if `posting.titleEn` is in JSON-LD, it MUST be visible in the rendered HTML.

## Spanish indexing

ES content needs Google to know it's Spanish (geo + language signals).

**Mitigation:**

- `hreflang="es"` set.
- `<html lang="es">` set.
- `inLanguage: 'es'` in JSON-LD.
- ES URL space (`/es/...`) is structurally distinct.
- Initial sitemap submitted with both ES and EN entries.

## Geographic targeting

AgConn is California-only for MVP. Some pages explicitly target counties (Fresno, Kern, etc.). Need to signal this clearly so the platform doesn't compete with national job boards.

**Mitigation:**

- `addressRegion: 'CA'` and `addressCountry: 'US'` in every JobPosting JSON-LD.
- County in titles ("Strawberry Picker — Fresno County").
- Search Console targeting set to USA.

## URL changes during refactor

Engineer renames a route mid-development. URLs change. SEO ranking lost.

**Mitigation:**

- Once a URL is published, treat it as immutable. Refactors that change URLs MUST add 301 redirects from old to new.
- Routes audit before launch: every public URL committed and locked.

## Pagination

Long lists (jobs across multiple pages) need careful pagination signals.

**Decision:** use `<link rel="canonical">` pointing to page 1 for paginated lists, and use `<link rel="next" href="...">` and `<link rel="prev" href="...">`. Google deprecated `rel="prev/next"` for ranking but it's still valid HTML and helpful for AI crawlers. Job postings index uses query-param filtering (`/jobs?county=Fresno&page=2`) — page param canonicalized.

## AIO crawler quotas

Some AI crawlers have aggressive crawl rates; can overwhelm small services.

**Mitigation:**

- ISR / static generation for high-traffic public pages.
- Edge caching (Nginx Ingress + Azure CDN if needed).
- Rate-limit per-IP (1000 req/min default).

## Privacy: indexing worker data

Worker profiles are NOT public for MVP. Their data appears nowhere in sitemap / JSON-LD / public HTML.

If/when worker public profiles ship (post-MVP), a per-worker visibility setting is required (default: not public). This must be enforced in `sitemap.ts` and on the page itself.

## Open questions

1. Per-entity bilingual slugs (`seo_slug_en`, `seo_slug_es`) — do we ever invest? Probably not unless ES-specific search intent diverges materially from EN.
2. Authority content authorship — who writes the Phase 5 resources articles? Likely partner orgs + admin staff, not engineering.
3. Schema.org Job/EducationalOccupationalProgram extensions for agriculture — does Schema.org have farm-specific subtypes worth using? Audit before Phase 5.
