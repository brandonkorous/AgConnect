# 03 — Training Report: Data Model

Read-only.

## Source

`enrollments` joined with `training_programs`, `users`, `worker_profiles`.

## Canonical columns (per-enrollment row)

```
Participant ID
First Name (optional)
Last Name (optional)
County of Residence
Language Preference
Program Name
Program Funder
Training Org Name
Program Start Date
Program End Date
Enrollment Date
Enrollment Status (enrolled | completed | dropped | no_show)
Completion Date
Drop Date
No-Show Flag
Certification Earned
Certification ID
Certification Issued At
```

## Aggregated views (separate exports)

### By program

```sql
SELECT tp.title_en AS "Program",
       tp.funder AS "Funder",
       u.id AS "Org",                                      -- could join further
       tp.county AS "County",
       COUNT(*) FILTER (WHERE e.status = 'enrolled')   AS "Currently Enrolled",
       COUNT(*) FILTER (WHERE e.status = 'completed')  AS "Completed",
       COUNT(*) FILTER (WHERE e.status = 'dropped')    AS "Dropped",
       COUNT(*) FILTER (WHERE e.no_show = true)        AS "No Show",
       COUNT(*) FILTER (WHERE e.cert_url IS NOT NULL)  AS "Certs Issued"
FROM enrollments e
JOIN training_programs tp ON tp.id = e.program_id
JOIN users u ON u.id = tp.org_id
WHERE tp.tenant_id = ANY($tenantIds)
  AND ($funders IS NULL OR tp.funder = ANY($funders))
  AND ($counties IS NULL OR tp.county = ANY($counties))
  AND e.created_at >= $start AND e.created_at < $end
  AND e.deleted_at IS NULL
GROUP BY tp.id, u.id;
```

### By funder

Aggregate completion / cert counts per funder for funder-specific reports.

### By org

For per-grantee delivery (Phase 2 — orgs see only their own programs).

## Indexes

`enrollments(tenant_id, status, completed_at)` — already present. Add:

```sql
CREATE INDEX enrollments_created_at ON enrollments(created_at);
```

## RLS

Admin-only in MVP. Phase 2: training-org-scoped role sees their own programs only.

## Audit

`report_runs` table (defined in placement-report); `reportType = 'training'`.
