# 04 — Employer Activity Report: Acceptance Criteria

## Functional

- [ ] Per-employer view returns one row per active employer in the date range.
- [ ] Hire rate computed correctly: hires / applications, with NULL for division by zero.
- [ ] Avg time to hire in days, rounded to one decimal.
- [ ] By-county view aggregates correctly (sums match per-employer view).
- [ ] By-license-type view splits FLC / Grower correctly.
- [ ] Drill-down `/employers/:id/activity` includes last 50 postings and last 100 hires.
- [ ] Numbers reconcile with KPI dashboard `employers.activeCount` and `hireRate`.
- [ ] Soft-deleted / unverified employers excluded by default.
- [ ] Filters (county, license type, date range) all combine correctly.

## Non-functional

- [ ] 1k-employer export < 30s.
- [ ] Drill-down page < 1.5s LCP.
- [ ] No PII for individual workers in this report; only aggregate counts.

## Test scenarios

### Unit

1. Hire rate formula: 0 applications → null; 5 applications, 1 hire → 20.0.
2. Avg time to hire excludes non-hire applications.

### Integration

1. **Numbers reconcile:** sum of "Total Hires" across employer rows = `kpi.placements.count` for same filters.
2. **By-county aggregation:** sum of by-county "Total Hires" = sum of per-employer "Total Hires".
3. **License type filter:** FLC-only filter excludes growers.

### Manual

1. Drill into an employer with active postings; verify postings list matches their dashboard.

## Definition of done

- All views tested.
- Sentry tags every export.
- Admin runbook: how to debug an employer flagged for unusually low hire rate.
