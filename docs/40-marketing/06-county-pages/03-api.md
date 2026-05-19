# 06 — County Landing Pages: API

## No new endpoints

County pages reuse the existing public landing jobs endpoint. Per
[[feedback-web-no-direct-db]], the web RSC fetches through the API client; it
does **not** touch `@agconn/db` directly.

## Endpoint reused

`GET /v1/landing/jobs` (the same public, unauthenticated endpoint that backs
`/jobs` and `FeaturedJobs`).

> **Inferred:** the endpoint already accepts a `county` filter (the `/jobs`
> index and `FeaturedJobs` chips filter by county today). County pages call it
> with `county` pinned and `sort=wage_desc`. If the endpoint currently filters
> county **client-side only**, add a server-side `county` query param scoped to
> the five `SERVICE_COUNTIES` values — that is the only backend change this
> feature may require, and it lives in the API `landing/` domain folder.

Request (server-side, from the county page RSC):

```
GET /v1/landing/jobs?county=Fresno&sort=wage_desc&limit=50
```

- `county` validated against `SERVICE_COUNTIES` (mapped via `COUNTY_DB_VALUE`)
  by a Zod schema in the API `landing/` domain; unknown county → the page 404s
  before the call is made, so the API never sees an invalid value in practice.
- Public scope only (`/v1/landing/*`), no tenant, no auth — consistent with the
  rest of the marketing surface.

## Derived values are computed in the RSC, not the API

`jobCount`, `medianWageCents`, and `topRoles` are derived from the returned
job array in the page's server component. The API contract is unchanged — no
new aggregation endpoint for MVP (revisit if the job set per county grows large
enough that shipping 50 rows to compute a median is wasteful).

## Sitemap

`apps/web/src/app/sitemap.ts` gains 10 entries (5 counties × 2 locales) with
the standard hreflang alternates. Generated from `SERVICE_COUNTIES`, not
hand-listed, so adding a sixth county later is a one-line change.

## Security / abuse

- Read-only, public, cacheable — no rate-limit changes needed beyond what
  `/v1/landing/*` already enforces.
- `[county]` is an allowlist of five values; no user input reaches a query
  beyond that mapped enum. No injection surface.
