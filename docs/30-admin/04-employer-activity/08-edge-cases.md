# 04 — Employer Activity Report: Edge Cases & Risks

## Inactive employers

Verified employers with zero activity in the period.

**Decision:** excluded by default (HAVING clause). Toggle "Show all verified employers" available — useful for "we have N verified employers but only M active" insight.

## New employers mid-period

Employer verified Apr 15; report range is Q1 (Jan-Mar). They shouldn't appear.

**Behavior:** the HAVING filter excludes them (no postings or applications in range).

## Time-to-hire including withdrawn

If a worker withdrew, then was re-considered and hired (rare, but possible via admin manual revert), `time_to_hire` could be huge.

**Mitigation:**

- Time-to-hire computed from `applied_at` to `hired_at` as recorded in `applications`. If hired (via revert/re-create), uses the latest event.
- Outlier detection (Phase 3): cap at 90 days; flag larger as "review needed".

## Hire rate distortion

Employer with 1 application, 1 hire = 100% hire rate. Misleading.

**Mitigation:**

- Optionally include only employers with ≥ 5 applications in hire-rate aggregations.
- Default: show raw rate; consumer can interpret.

## Cross-tenant employer

A grower operates in two tenants (rare). Counted separately per tenant.

**Behavior:** correct — tenant scoping is canonical.

## Employer with public profile but private postings (Phase 2)

If we ever support unpublished postings, exclude them from the report.

**Mitigation:** all queries filter `published_at IS NOT NULL` for posting counts.

## Privacy

This report is the highest-aggregation report we publish; contains no individual worker info.

**Mitigation:**

- Drill-down's hires list shows anonymized worker IDs only (not names).
- Report-runs audit log preserved.

## License type drift

Adding a new `LicenseType` (e.g., 'cooperative') requires migration.

**Mitigation:** report code uses the enum dynamically; any value works.

## Plan tier reporting

Plan tier reflects current state, not historical. Employer downgraded mid-quarter shows as `free` even though they had `pro` for most of the period.

**Mitigation:**

- For accurate historical plan tier: query `billing_events` for the period.
- Out of scope for MVP — report shows current plan with a footnote: "Plan reflects current tier as of report generation."

## Performance at scale

Queries with many JOINs and aggregations on large tables.

**Mitigation:**

- Existing indexes cover common filter paths.
- For tenant-scoped queries with 10k employers, materialize to a `kpi_employer_daily` view nightly. Out of scope for MVP.

## Open questions

1. Per-employer impact dashboard (employer's own version of this report) — Phase 2.
2. Comparison view ("how does my hire rate compare to similar employers?") — Phase 3.
3. Anomaly flags (employer hire rate dropped 50%) — Phase 3 intelligence.
4. Diversity / equity metrics — sensitive area; out of scope until the platform's role is clearer.
