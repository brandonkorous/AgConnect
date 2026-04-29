# 04 — Employer Activity Report: Data Model

Read-only.

## Source

`employer_profiles` joined with `users`, `job_postings`, `applications`.

## Canonical columns (per-employer)

```
Employer ID
Business Name
License Type
County
Verified Date
Plan Tier
Postings Published
Postings Active
Postings Filled
Total Applications
Total Hires
Hire Rate (%)
Avg Wage at Hire ($/hr)
Avg Time to Hire (days)
First Activity Date
Most Recent Activity Date
```

## Generation query

```sql
SELECT
  ep.id AS "Employer ID",
  ep.business_name AS "Business Name",
  ep.license_type AS "License Type",
  ep.county AS "County",
  ep.flc_verified_at AS "Verified Date",
  ep.plan AS "Plan Tier",
  COUNT(DISTINCT jp.id) FILTER (WHERE jp.published_at IS NOT NULL AND jp.published_at >= $start AND jp.published_at < $end) AS "Postings Published",
  COUNT(DISTINCT jp.id) FILTER (WHERE jp.status = 'active') AS "Postings Active",
  COUNT(DISTINCT jp.id) FILTER (WHERE jp.status = 'filled' AND jp.filled_at >= $start AND jp.filled_at < $end) AS "Postings Filled",
  COUNT(DISTINCT a.id) FILTER (WHERE a.applied_at >= $start AND a.applied_at < $end) AS "Total Applications",
  COUNT(DISTINCT a.id) FILTER (WHERE a.status = 'hired' AND a.hired_at >= $start AND a.hired_at < $end) AS "Total Hires",
  ROUND(
    100.0 * COUNT(DISTINCT a.id) FILTER (WHERE a.status = 'hired' AND a.hired_at >= $start AND a.hired_at < $end)
    / NULLIF(COUNT(DISTINCT a.id) FILTER (WHERE a.applied_at >= $start AND a.applied_at < $end), 0),
    1
  ) AS "Hire Rate (%)",
  ROUND(AVG(a.wage_offered) FILTER (WHERE a.status = 'hired' AND a.hired_at >= $start AND a.hired_at < $end), 2) AS "Avg Wage at Hire ($/hr)",
  ROUND(AVG(EXTRACT(EPOCH FROM (a.hired_at - a.applied_at)) / 86400) FILTER (WHERE a.status = 'hired' AND a.hired_at >= $start AND a.hired_at < $end), 1) AS "Avg Time to Hire (days)",
  MIN(a.applied_at) AS "First Activity Date",
  MAX(GREATEST(a.updated_at, jp.updated_at)) AS "Most Recent Activity Date"
FROM employer_profiles ep
LEFT JOIN job_postings jp ON jp.employer_id = ep.id AND jp.tenant_id = ep.tenant_id
LEFT JOIN applications a ON a.job_id = jp.id
WHERE ep.tenant_id = ANY($tenantIds)
  AND ep.deleted_at IS NULL
  AND ep.flc_verified_at IS NOT NULL
  AND ($counties IS NULL OR ep.county = ANY($counties))
  AND ($licenseTypes IS NULL OR ep.license_type = ANY($licenseTypes))
GROUP BY ep.id, ep.business_name, ep.license_type, ep.county, ep.flc_verified_at, ep.plan
HAVING
  -- Optionally filter to "active in period": at least one posting or application in the range
  COUNT(DISTINCT jp.id) FILTER (WHERE jp.published_at >= $start AND jp.published_at < $end) > 0
  OR COUNT(DISTINCT a.id) FILTER (WHERE a.applied_at >= $start AND a.applied_at < $end) > 0
ORDER BY "Total Hires" DESC, "Total Applications" DESC;
```

> **Inferred:** The HAVING clause excludes verified-but-inactive employers from the report. Adjust if the view should include all verified employers (signal: "we have N employers but only M active this quarter"). Add a toggle if requested.

## Aggregated view by county

Groups rows by `county` and sums hires, postings, applications.

## Indexes

Existing indexes cover the joins. Performance check at scale.

## RLS

Admin only. Phase 2 grantee org sees only their own data.

## Audit

`report_runs.reportType = 'employer'`.
