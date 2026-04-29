# 01 — KPI Dashboard: Data Model

Read-only feature. No new tables.

## Source tables

- `applications` (placements)
- `enrollments` (training)
- `employer_profiles` (employer counts, verified)
- `job_postings` (postings count, hire rate)
- `users` (worker counts)

## Aggregation queries

### Placements (hired count)

```sql
-- params: $tenantId (uuid array — admin can pass multiple), $start, $end, $counties (county[])
SELECT
  COUNT(*) AS hired_count,
  AVG(wage_offered) AS avg_wage,
  COUNT(DISTINCT worker_id) AS unique_workers
FROM applications a
JOIN job_postings j ON j.id = a.job_id
WHERE a.tenant_id = ANY($tenantIds)
  AND a.status = 'hired'
  AND a.hired_at >= $start AND a.hired_at < $end
  AND ($counties IS NULL OR j.county = ANY($counties))
  AND a.deleted_at IS NULL;
```

### Trend (compare to prior period)

Run the same query for the prior period (`$start - duration` to `$start`) and compute `% change`.

### Training completions

```sql
SELECT
  COUNT(*) AS completed_count,
  COUNT(DISTINCT worker_id) AS unique_workers,
  COUNT(*) FILTER (WHERE cert_url IS NOT NULL) AS cert_count
FROM enrollments
WHERE tenant_id = ANY($tenantIds)
  AND status = 'completed'
  AND completed_at >= $start AND completed_at < $end
  AND deleted_at IS NULL;
```

### Active employers

```sql
SELECT
  COUNT(DISTINCT id) AS active_employer_count
FROM employer_profiles
WHERE tenant_id = ANY($tenantIds)
  AND flc_verified_at IS NOT NULL
  AND deleted_at IS NULL
  AND id IN (
    -- scoped to "active" = published a posting OR had an applicant in period
    SELECT DISTINCT employer_id FROM job_postings WHERE tenant_id = ANY($tenantIds) AND status = 'active'
    UNION
    SELECT DISTINCT j.employer_id FROM applications a JOIN job_postings j ON j.id = a.job_id
      WHERE a.tenant_id = ANY($tenantIds) AND a.applied_at >= $start AND a.applied_at < $end
  );
```

### Hire rate

```sql
SELECT
  COUNT(*) FILTER (WHERE status = 'hired')::float / NULLIF(COUNT(*), 0) AS hire_rate
FROM applications
WHERE tenant_id = ANY($tenantIds)
  AND applied_at >= $start AND applied_at < $end
  AND deleted_at IS NULL;
```

### Wage distribution

For the histogram tile:

```sql
SELECT
  WIDTH_BUCKET(wage_offered, 14, 30, 8) AS bucket,    -- 8 buckets between $14 and $30
  COUNT(*) AS n
FROM applications
WHERE tenant_id = ANY($tenantIds)
  AND status = 'hired'
  AND hired_at >= $start AND hired_at < $end
GROUP BY bucket
ORDER BY bucket;
```

## Indexes

Existing indexes from feature data models cover these queries:

- `applications(tenant_id, status, hired_at)` — hired aggregation
- `enrollments(tenant_id, status, completed_at)` — training aggregation
- `job_postings(tenant_id, status)` — active employer detection

If KPI queries become slow at scale, add covering indexes or move to a separate materialized view (`kpi_daily`) refreshed nightly. Out of scope for MVP.

## RLS

All KPI queries run as admin role (`current_setting('app.role') = 'admin'`) which bypasses tenant RLS. Tenant-admin role (Phase 2) would restrict to their tenant.

## Caching

Dashboard tiles cache for 60s server-side (Next.js `revalidate: 60`). Filters bust the cache via cache key including filter params.

## Audit

Admin dashboard views logged in `auth_events` with `event_type = 'admin.dashboard.view'` for auditing who looked at what.
