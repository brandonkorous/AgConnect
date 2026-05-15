# 01 — KPI Dashboard: Edge Cases & Risks

## Aggregation drift

KPI tile says 142 hires; detail report says 138.

**Root cause:** different `WHERE` clauses, missing soft-delete filter, time-zone math.

**Mitigation:**

- All KPI queries derive from a small library of canonical query helpers in `packages/db/raw/kpi/*.sql` so detail reports use the same filters.
- Test: for each tile, the detail-report total must match the tile total.

## Time zone in date filtering

Range is "This quarter" — relative to which timezone?

**Decision:** America/Los_Angeles. All admin dates in PT regardless of admin's browser tz. Display labels say "PT" for clarity.

## Performance at scale

Single-DB cross-tenant aggregations on millions of rows can be slow.

**Mitigation:**

- Existing indexes cover MVP scale (sub-second on 100k rows).
- For scale: nightly materialized view `kpi_daily` with day-bucketed pre-aggregations. Out of scope for MVP.
- HPA on api pods to handle dashboard auto-refresh load.

## Concurrent filter changes

Admin rapidly changes filters; multiple in-flight requests.

**Mitigation:**

- SWR client deduplicates and cancels stale requests.
- UI shows the loading state for the most recent filter; ignores stale responses.

## Drill-down filter mismatch

Admin filters by Fresno + this quarter. Click "Hires" tile. Drill-down shows different numbers if filters not preserved.

**Mitigation:** filters carried via URL params; drill-down reads them and applies. Tested.

## Cross-tenant aggregations privacy

Admin sees Tenant 1 + Tenant 2 data combined. If a tenant has policy concerns, this could be a leak.

**Mitigation:**

- AGCONN-wide admins see everything (single internal team).
- Tenant admins (Phase 2) see only their tenant.
- Single-tenant filter selects exactly one tenant for the view.

## Empty data periods

New tenant, no activity yet.

**Behavior:** all tiles show 0; trend shows "—"; no errors.

## DST transitions in series

Day-bucketed series across a DST change has a 23-hour or 25-hour day. Bucket boundaries computed in PT.

**Mitigation:** use Postgres `date_trunc('day', applied_at AT TIME ZONE 'America/Los_Angeles')` and group on that. Test cases include DST boundaries.

## Browser tab kept open for hours

Auto-refresh polling continues; data stays current.

**Risk:** background tab keeps polling indefinitely → API load.

**Mitigation:** disable polling when `document.visibilityState !== 'visible'`. Resume when visible.

## CSV export size

If admin exports a 10-year history with daily granularity → big CSV.

**Mitigation:** export caps rows at 10,000; show "Refine your filter to export more" if exceeded. Out of scope for MVP — likely never hit.

## Admin role escalation race

Admin role just granted; existing JWT doesn't yet have admin claim.

**Mitigation (per [02-auth/08-edge-cases.md](../../00-foundation/02-auth/08-edge-cases.md)):** admin endpoints re-check role from DB, not just JWT.

## Number formatting

Numbers > 1000 → "1,234"; > 1M → "1.2M". Use `Intl.NumberFormat('en-US')`.

## Sparkline of < 7 days

Sparklines need at least 7 data points. For shorter ranges, show a simple "+X this week" indicator instead.

## Open questions

1. Real-time updates — when is 60s polling not fast enough? Likely never for a grant-reporting tool.
2. Tenant admins (Phase 2) — when does scoped admin role ship?
3. Custom dashboards — when do partner orgs ask? Likely never; the canonical four tiles cover most needs.
4. Anomaly alerts ("hire count dropped 50% this week") — Phase 3 intelligence layer.
