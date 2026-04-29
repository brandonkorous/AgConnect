# 01 — KPI Dashboard: Acceptance Criteria

## Functional

- [ ] Admin can access `/` and see all four tile groups populated.
- [ ] Filters (tenant, county, range) apply to all tiles consistently.
- [ ] Numbers match the underlying detail reports for the same filter (no aggregation drift).
- [ ] Trend arrows reflect comparison to the prior equivalent period.
- [ ] Drill-down routes preserve filters via URL.
- [ ] Export downloads a CSV of currently displayed values.
- [ ] Auto-refresh toggle polls every 60s when on.
- [ ] Non-admin user accessing admin app → redirected to sign-in / 403.
- [ ] Cross-tenant view: admin sees data from all tenants by default; can filter to a single tenant.

## Non-functional

- [ ] `/admin/v1/kpi/summary` P95 < 1.5s.
- [ ] Filter change → updated tiles in < 500ms (after fetch returns).
- [ ] Dashboard fits 1280×800 desktop without horizontal scroll.
- [ ] Sparkline charts render without layout shift.

## Test scenarios

### Unit

1. Trend computation: prior-period zero → current 10 → trend deltaPct = +∞ → display as "new" or "+10".
2. Date range too wide (> 2 years) rejected with `date_range_too_wide`.
3. Hire rate division by zero (no applications) → null.

### Integration

1. **Numbers consistency:** seed 50 hires across 3 counties; KPI hire count = 50; `/admin/v1/kpi/breakdown/county` sums to 50.
2. **Tenant isolation in admin context:** two tenants with overlapping data; filter to Tenant 1 → numbers reflect only Tenant 1.
3. **Custom range:** any 30-day range produces correct counts vs. computed from raw rows.
4. **Performance:** dashboard with 100k applications, 50k enrollments → P95 < 1.5s.

### Manual

1. Filter combinations: All tenants + all counties + this quarter → numbers visually match what we expect.
2. Exit + reload: URL params preserve state.

## Definition of done

- All KPI calculations covered by tests with golden datasets.
- Sentry tags every dashboard view + filter combo for usage analytics.
- Materialized view migration plan documented (in case scale demands it).
- Admin runbook: how to debug a discrepancy (KPI vs detail report mismatch).
