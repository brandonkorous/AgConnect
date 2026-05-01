# 10 · Reports — Overview

Read-only aggregation surface. No new tables; queries roll up `JobPosting`, `Application`, `ShiftAssignment`, and `PayrollLine` into:

- **KPIs** — Hires this season, Avg time-to-fill, Cost per hire, Retention 30-day
- **Applicant flow** — weekly applied vs. hired (line + bar chart)
- **By job type** — applied / hired / fill % per posting title
- **Top performers** — workers ranked by piece-rate yield (when piece data present)

## Scope (MVP)

- One endpoint: `GET /v1/employer/reports/overview`
- Range param: `season=current|prev` (default `current`, computed by employer signup year)
- CSV export deferred to v2 — UI button POSTs `/exports` job stub
