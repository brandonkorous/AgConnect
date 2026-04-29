# 03 — Job Discovery: Edge Cases & Risks

## Stale FTS index

The `search` tsvector is a generated stored column; updates automatically on row writes. But Postgres needs `VACUUM ANALYZE` for query planner accuracy.

**Mitigation:** auto-vacuum on; tune for `job_postings`. Manual `ANALYZE` after bulk imports.

## Filter combinations with zero results

Worker applies many filters → 0 results. Frustrating UX.

**Mitigation:**

- Empty state explicitly invites saving the search ("We'll text you when new jobs match").
- Offer one-click "Clear all" button.
- Suggest broadening: "Try removing the {wage filter}" — Phase 2.

## Saved-search query in the dispatcher

The dispatcher runs an n-way join across all active saved searches and all new jobs. With many saved searches and many jobs, this scales poorly.

**Mitigation:**

- For MVP scale (low thousands of saved searches), a single SQL query handles it.
- Alert dispatch is the bottleneck: 5-minute cadence allows up to 5 minutes of catch-up; if pg-boss queue depth grows, scale workers.
- Phase 2: precompute filter-hash buckets so new jobs only check matching buckets.

## Job posted then quickly closed

Employer posts at 10:00, closes at 10:02. Dispatcher fires at 10:05 with a now-closed job.

**Mitigation:**

- Dispatcher filters `j.status = 'active'` at SMS-send time. If the job closed in the gap, no alert.
- Alert SMS includes the slug; if a worker taps after closure, page shows "This job is no longer accepting applications." (210 / 410).

## Bilingual title slug ambiguity

A worker searching in ES sees an EN slug (`/jobs/fresno-strawberry-picker-2026-x4f2`). Confusing but not broken.

> **Inferred:** Slugs are stable identifiers, not user-visible labels. Workers don't read them aloud or memorize. Keep EN slugs for SEO + URL stability; locale-aware page content does the work.

## Spam / fake job postings

Bad-actor employer posts fake jobs to harvest workers' contact info.

**Mitigation:**

- All employers must complete FLC verification (or grower verification) before they can publish jobs (`status = 'active'`).
- Drafts stay invisible until employer moves to active.
- Admin moderation queue for the first N postings of a new employer (out of scope for MVP).

## Spam / scrape

Aggressive bot scrapes the listing and copies content elsewhere.

**Mitigation:**

- Public listing is intentionally open (SEO is a feature). We accept scraping as a side effect.
- Rate-limit `/v1/jobs` per IP at the ingress (1000 req/min default).
- DMCA takedown if a competitor copies branded content.

## Search query with special chars

Worker types `!@#$%`. PG's `websearch_to_tsquery` is robust but defensive parsing helps.

**Mitigation:** strip non-word chars, collapse whitespace, cap length at 120 chars before passing to PG.

## County change after saving search

Worker saves a search, then moves counties (updates `worker_profiles.county`). The saved search filters are independent of the worker's current county.

**Behavior:** unchanged. Saved search filters are explicit; if the worker filtered by Fresno, that's what they get even if they later move to Tulare.

> **Inferred:** This is correct — the worker explicitly chose those filters. If we want county to "follow" the worker, we'd need a `dynamicCounty` flag. Out of scope for MVP.

## Skill filter alignment

Worker filters by "tractor"; jobs use the canonical tag `tractor_operation`.

**Mitigation:**

- Filter UI uses chips for canonical skills only (no free-text); ensures alignment.
- Server-side: skill filter expands aliases via a small synonym table (out of scope for MVP — start with strict matching and observe).

## Cursor pagination edge

Cursor encodes `(created_at, id)`. New rows inserted between page fetches can shift results.

**Mitigation:** descending order by `created_at`; cursors include both `created_at` and `id` for tie-breaking. Workers don't notice in practice (browsing newest-first).

## Search analytics privacy

`search_views.filters` could capture the worker's `q` query string. Sensitive if it's an unusual search.

**Mitigation:**

- `search_views.workerId` allows admin to see what a specific worker searched (rare). Don't surface this anywhere worker-visible.
- For aggregated reports (admin), filters are aggregated, not per-worker.

## Pagination + filters in URL

The URL is shareable: `/jobs?county=Fresno&skills=Tractor`. Encourages copy-paste sharing (good).

**Risk:** very long URLs from many filters. Cap query string at 2000 chars; reject longer.

## Worker's own employers

A worker also runs a small operation and has an `employer` Clerk org tied to a different business name. Should they see their own jobs?

**Decision:** yes, they see all jobs in the tenant including their own employer's. No deduplication. They can choose not to apply to their own.

## Open questions

1. Distance / radius filtering — when does Phase 2 geocoding ship? Likely concurrent with map view.
2. Email alerts — when does it become worth building? Likely after 6 months, when job-alert SMS volume justifies a per-channel optimization.
3. Saved-search digest format (one SMS with N jobs) vs. individual SMS — A/B test post-launch.
4. Should anonymous users be able to save searches by entering a phone number (no full sign-up)? Maybe — converts more leads. Privacy / spam tradeoffs need product input.
