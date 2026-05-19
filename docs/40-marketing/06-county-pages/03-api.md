# 06 — County Landing Pages: API

## One endpoint, enhanced (in scope)

County pages reuse the existing public landing jobs endpoint
`GET /v1/landing/jobs` — but this feature **owns** hardening its
**sorting, filtering, and paging** as a defined backend deliverable, not an
afterthought. Per [[feedback-web-no-direct-db]] the web RSC fetches through the
API client; it does **not** touch `@agconn/db` directly.

Current state of [`services/api/src/landing/jobs.ts`](../../../services/api/src/landing/jobs.ts):
`?county=` is read and applied server-side (`where.county`), ordering is
hardcoded `createdAt desc`, paging is opaque-cursor at `PAGE_SIZE = 20`,
`county` is an **unchecked cast** (`county as County`). The `County` enum is
exactly `{Fresno, Kern, Kings, Madera, Tulare}`, 1:1 with `SERVICE_COUNTIES`.

### New request contract (backwards compatible)

```
GET /v1/landing/jobs?county=Fresno&sort=recent&limit=20[&cursor=<opaque>]
```

A Zod schema in the `landing/` domain (`schemas.ts`) validates every param;
unknown/invalid → `400` (never silently ignored, never an unchecked cast).

| param | rule | default | notes |
| --- | --- | --- | --- |
| `county` | enum of the 5 `County` values (case-normalized) | none (all counties) | invalid → 400; web also guards `[county]` and 404s before calling |
| `sort` | `recent` \| `wage_desc` \| `wage_asc` \| `start_soon` | `recent` | `recent` = current `createdAt desc` behaviour, so existing callers are unaffected |
| `limit` | int 1–50 | 20 | preserves the old `PAGE_SIZE` default; county aggregate pages pass `50` |
| `cursor` | opaque keyset token | none | **must encode the active sort** — see below |

### Paging must be sort-aware

The cursor today encodes `(createdAt, id)`. With multiple sorts the keyset
predicate changes per sort, so the cursor must carry the sort key it was minted
under and the endpoint must reject a cursor whose embedded sort ≠ the request
`sort` (→ 400 `cursor_sort_mismatch`) rather than return a corrupt page. Keyset
tuples per sort:

- `recent` → `(createdAt desc, id desc)` (unchanged)
- `wage_desc` → `(wageMin desc, id desc)`  ·  `wage_asc` → `(wageMin asc, id asc)`
- `start_soon` → `(startDate asc, id asc)`

> **Inferred:** wage sort keys on `wageMin` (the advertised floor) for a stable
> single-column keyset; `wageMax` ties are not a sort dimension. Revisit only if
> product wants "highest ceiling first".

### County aggregate read

For the answer paragraph the RSC needs county-wide `count`, `medianWageCents`,
`topRoles`. It calls the endpoint with `county` pinned, `sort=wage_desc`,
`limit=50` and **follows `nextCursor` up to a 3-page cap (≤ 150 rows)** to
compute the aggregate.

> **Inferred:** 3×50 cap. If a single county routinely exceeds 150 active
> postings, add `GET /v1/landing/jobs/county-summary?county=` returning
> `{count, medianWageCents, topRoles}` computed in one SQL aggregate — flagged
> as the documented escape hatch, out of MVP scope.

`jobCount`, `medianWageCents`, `topRoles` are derived in the RSC from the
returned rows; the API returns rows, not aggregates, for MVP.

## Sitemap

`apps/web/src/app/sitemap.ts` gains 10 entries (5 counties × 2 locales) with
the standard hreflang alternates. Generated from `SERVICE_COUNTIES`, not
hand-listed, so adding a sixth county later is a one-line change.

## Security / abuse

- Read-only, public, cacheable — no rate-limit changes needed beyond what
  `/v1/landing/*` already enforces.
- `[county]` is an allowlist of five values; no user input reaches a query
  beyond that mapped enum. No injection surface.
