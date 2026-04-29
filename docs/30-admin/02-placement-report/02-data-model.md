# 02 — Placement Report: Data Model

Read-only feature; no new tables.

## Source

`applications` joined with `users`, `worker_profiles`, `job_postings`, `employer_profiles`, `enrollments`.

## Participant ID

Anonymized stable identifier:

```ts
// packages/shared-types/src/anonymize.ts
export function participantId(tenantId: string, workerId: string): string {
  // SHA-256 of tenant + worker, prefix with year for human readability
  const hash = sha256(`${tenantId}:${workerId}:${process.env.PARTICIPANT_PEPPER}`);
  return `P-${hash.slice(0, 12).toUpperCase()}`;
}
```

Stable across reports — same `(tenant, worker)` always produces the same ID. Not reversible without the pepper.

> **Inferred:** Some grantees may need a worker's actual name to match against CalJOBS submissions. Provide both anonymized ID AND optionally name (admin opt-in checkbox at export time). Default: anonymized only.

## Canonical CSV / XLSX columns

```
Participant ID
First Name (optional)
Last Name (optional)
County of Residence
Language Preference
Service Start Date
Service End Date
Hire Date
Employer Name
Employer EIN
Occupation Title (English)
SOC Code (optional)
Wage at Placement ($/hr)
Wage Annual Equivalent ($)
Training Program Name (most recent)
Training Funder
Training Completion Date
Certification Earned
Certification ID
Q2 Retention Flag (manual)
Q4 Retention Flag (manual)
```

## Generation query

```sql
SELECT
  $participantId(a.tenant_id, a.worker_id) AS "Participant ID",
  CASE WHEN $includeNames THEN wp.first_name ELSE NULL END AS "First Name",
  CASE WHEN $includeNames THEN wp.last_name ELSE NULL END AS "Last Name",
  wp.county AS "County of Residence",
  u.preferred_lang AS "Language Preference",
  COALESCE((SELECT MIN(applied_at) FROM applications a2 WHERE a2.worker_id = a.worker_id), a.applied_at) AS "Service Start Date",
  COALESCE((SELECT MAX(updated_at) FROM applications a2 WHERE a2.worker_id = a.worker_id), a.updated_at) AS "Service End Date",
  a.hired_at AS "Hire Date",
  ep.business_name AS "Employer Name",
  ep.ein AS "Employer EIN",
  jp.title_en AS "Occupation Title (English)",
  NULL AS "SOC Code",                  -- optional, employer-provided in future
  a.wage_offered AS "Wage at Placement ($/hr)",
  ROUND(a.wage_offered * 40 * 52, 2) AS "Wage Annual Equivalent ($)",
  -- Most recent completed training
  (SELECT tp.title_en FROM enrollments e JOIN training_programs tp ON tp.id = e.program_id
    WHERE e.worker_id = a.worker_id AND e.status = 'completed' ORDER BY e.completed_at DESC LIMIT 1) AS "Training Program Name (most recent)",
  (SELECT tp.funder FROM enrollments e JOIN training_programs tp ON tp.id = e.program_id
    WHERE e.worker_id = a.worker_id AND e.status = 'completed' ORDER BY e.completed_at DESC LIMIT 1) AS "Training Funder",
  (SELECT e.completed_at FROM enrollments e
    WHERE e.worker_id = a.worker_id AND e.status = 'completed' ORDER BY e.completed_at DESC LIMIT 1) AS "Training Completion Date",
  -- Cert earned (if any)
  (SELECT tp.cert_name FROM enrollments e JOIN training_programs tp ON tp.id = e.program_id
    WHERE e.worker_id = a.worker_id AND e.status = 'completed' AND e.cert_url IS NOT NULL ORDER BY e.completed_at DESC LIMIT 1) AS "Certification Earned",
  (SELECT e.certificate_id FROM enrollments e
    WHERE e.worker_id = a.worker_id AND e.status = 'completed' AND e.cert_url IS NOT NULL ORDER BY e.completed_at DESC LIMIT 1) AS "Certification ID",
  '' AS "Q2 Retention Flag (manual)",
  '' AS "Q4 Retention Flag (manual)"
FROM applications a
JOIN users u ON u.id = a.worker_id
JOIN worker_profiles wp ON wp.id = a.worker_id
JOIN job_postings jp ON jp.id = a.job_id
JOIN users eu ON eu.id = jp.employer_id
JOIN employer_profiles ep ON ep.id = jp.employer_id
WHERE a.tenant_id = ANY($tenantIds)
  AND a.status = 'hired'
  AND a.hired_at >= $start AND a.hired_at < $end
  AND a.deleted_at IS NULL
  AND ($counties IS NULL OR jp.county = ANY($counties))
  AND ($funders IS NULL OR EXISTS (
        SELECT 1 FROM enrollments e
        JOIN training_programs tp ON tp.id = e.program_id
        WHERE e.worker_id = a.worker_id AND e.status = 'completed' AND tp.funder = ANY($funders)
      ))
ORDER BY a.hired_at DESC;
```

Heavy query for grant reporting; we accept the cost. Materialize to a job in the background if it gets too slow.

## Indexes

Existing indexes cover most. Additionally for the report:

```sql
CREATE INDEX applications_hired_at ON applications(hired_at) WHERE status = 'hired' AND deleted_at IS NULL;
```

## RLS

Admin-only access. Tenant admins (Phase 2) scoped to their tenant.

## Audit

Every report generation logged:

```prisma
model ReportRun {
  id          String   @id @default(uuid()) @db.Uuid
  tenantId    String?  @db.Uuid              @map("tenant_id")    // null = cross-tenant
  reportType  String                          @map("report_type")  // 'placement', 'training', 'employer'
  filters     Json
  rowCount    Int                             @map("row_count")
  format      String                          // 'csv' | 'xlsx'
  generatedBy String   @db.Uuid               @map("generated_by")
  generatedAt DateTime @default(now())        @map("generated_at")
  blobPath    String?                         @map("blob_path")    // optional: archive in Blob

  @@index([tenantId, generatedAt])
  @@map("report_runs")
}
```

Used for compliance audit ("show me every export of placement data in 2026").
