# 04 — Employer Activity Report: Overview

## Purpose

Show admin (and grantee orgs in Phase 2) what employers are doing on the platform — postings published, applications received, hire rates, average wage, by employer and by county. Useful for grant impact reports ("X verified employers hired Y workers via the platform") and for AGCONN-internal employer health metrics.

## What it captures

- Active employer count by county
- Postings count (published) by employer
- Applications received by employer
- Hires by employer, with wage stats
- Hire rate (hires / applications) by employer
- Average time-to-hire (from `applied_at` to `hired_at`)

## Filter dimensions

- Date range
- County
- Employer (single drill-down)
- Tenant (admin only)
- License type (grower / FLC)

## Scope

In scope:

- Aggregated employer-activity export (CSV/XLSX)
- Per-employer drill-down view
- Time-to-hire calculation
- Filterable + delivery via download or email
- Audited via `report_runs`

Out of scope:

- Employer health-score / ranking (Phase 3)
- Worker satisfaction scores (Phase 3 — needs survey infra)
- Predictive analytics (out of scope)

## Success criteria

- Quarterly export < 30s.
- Numbers consistent with KPI dashboard `employers.activeCount` and `hireRate`.
- Drill into a single employer reveals their full activity history.
- Privacy: no individual worker data in this report (except aggregate counts).

## Dependencies

- [02-placement-report](../02-placement-report/), [03-training-report](../03-training-report/) — sister reports
- [01-kpi-dashboard](../01-kpi-dashboard/) — reconciles
- All employer / posting / application data
