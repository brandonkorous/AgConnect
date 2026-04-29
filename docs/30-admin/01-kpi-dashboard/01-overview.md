# 01 — KPI Dashboard: Overview

## Purpose

The admin home page. Shows real-time tiles of the metrics that grant funders care about — placements, training completions, average wages, active employers — sliced by county and time range.

> **Inferred:** Admin app is English-only for MVP. Admin staff are internal; bilingual admin would inflate scope without user-base benefit. Add a per-user override later if needed.

## What it shows

Four tile groups, refreshed on page load with optional auto-refresh every 60s:

1. **Placements** — workers hired this period; trend vs. prior period.
2. **Training** — completions; certificate count; on-time-completion rate.
3. **Wages** — average hourly wage at hire (`applications.wage_offered`); distribution.
4. **Employers** — active verified employers; postings published; hire rate (hires per applicant).

Each tile clickable → drills into the relevant report (placement-report / training-report / employer-activity).

## Time and county filters

Dashboard-wide:

- **Time range:** This week / This month / This quarter / Custom range.
- **County:** All counties / Fresno / Kern / Kings / Madera / Tulare.

Filters apply to all tiles consistently.

## Scope

In scope:

- Live KPI tiles
- Time + county filters
- Per-tile drill-down
- Trend indicators (vs. prior period)
- Cross-tenant view for AgConn-internal admins; tenant-scoped view for tenant admins (Phase 2)

Out of scope:

- Custom dashboards / saved views (Phase 2)
- Anomaly detection (Phase 3)
- Real-time push updates (60s polling is fine)
- Mobile dashboard layout (admin is desktop-first)

## Roles

- **Admin (`role = 'admin'`):** full cross-tenant view.
- **Tenant admin** (Phase 2 — separate role): scoped to their tenant only.

## Success criteria

- Dashboard loads (all tiles populated) in < 1.5s.
- Numbers match the underlying detail reports exactly (no aggregation drift).
- Filter changes reflect within 500ms.
- Admin can pull a snapshot for a board meeting in 2 minutes.

## Dependencies

- [00-foundation/02-auth](../../00-foundation/02-auth/) — admin role gate
- [02-placement-report](../02-placement-report/), [03-training-report](../03-training-report/), [04-employer-activity](../04-employer-activity/) — drill-down targets
- All worker / employer / training data tables
