# 04 — Worker Search: Data Model

## Reads

`worker_profiles` (defined in [10-worker/01-onboarding/02-data-model.md](../../10-worker/01-onboarding/02-data-model.md)) plus `enrollments` (for cert filtering).

## worker_search_log

```prisma
model WorkerSearchLog {
  id          String   @id @default(uuid()) @db.Uuid
  tenantId    String   @db.Uuid              @map("tenant_id")
  employerId  String   @db.Uuid              @map("employer_id")
  filters     Json
  resultCount Int                              @map("result_count")
  createdAt   DateTime @default(now())        @map("created_at")

  @@index([tenantId, createdAt])
  @@index([employerId, createdAt])
  @@map("worker_search_log")
}
```

Used for:

- Per-employer rate-limiting (suspicious volume).
- Admin reports on search trends ("most-searched skill in Fresno").
- Debugging dead-end searches.

## worker_invitations

When an employer "invites a worker to apply" — creates a record:

```prisma
model WorkerInvitation {
  id          String    @id @default(uuid()) @db.Uuid
  tenantId    String    @db.Uuid              @map("tenant_id")
  employerId  String    @db.Uuid              @map("employer_id")
  workerId    String    @db.Uuid              @map("worker_id")
  jobId       String    @db.Uuid              @map("job_id")
  message     String?   @db.VarChar(500)
  acceptedAt  DateTime?                       @map("accepted_at")
  declinedAt  DateTime?                       @map("declined_at")
  expiredAt   DateTime?                       @map("expired_at")
  createdAt   DateTime  @default(now())       @map("created_at")

  @@unique([employerId, workerId, jobId])     // dedupe per job
  @@index([tenantId])
  @@index([workerId])
  @@map("worker_invitations")
}
```

## RLS

`worker_profiles` already has the policies in [10-worker/01-onboarding/02-data-model.md](../../10-worker/01-onboarding/02-data-model.md). Employers reading via worker search use the existing employer-read policy:

```sql
CREATE POLICY worker_self_select ON worker_profiles
  FOR SELECT
  USING (
    id = current_setting('app.user_id', true)::uuid
    OR current_setting('app.role', true) IN ('admin', 'employer')
  );
```

API-layer redaction enforces "no contact info unless application exists" — RLS alone doesn't redact columns.

## Search query

Canonical SQL:

```sql
SELECT wp.id,
       wp.first_name,
       wp.last_name,                       -- API drops to last_initial
       wp.county,
       wp.skills,
       wp.availability,
       cardinality(wp.skills & $skills::text[]) AS match_score
FROM worker_profiles wp
JOIN users u ON u.id = wp.id
WHERE wp.tenant_id = $tenant
  AND wp.onboarded_at IS NOT NULL
  AND u.deleted_at IS NULL
  AND wp.deleted_at IS NULL
  AND ($counties IS NULL OR wp.county = ANY($counties))
  AND ($skills IS NULL OR wp.skills && $skills::text[])
  -- Availability filter: jsonb path match
  -- Cert filter: subquery against enrollments (status = 'completed')
ORDER BY match_score DESC, wp.updated_at DESC
LIMIT 50 OFFSET 0;
```

For cert filtering:

```sql
AND ($cert_ids IS NULL OR EXISTS (
  SELECT 1 FROM enrollments e
  JOIN training_programs tp ON tp.id = e.program_id
  WHERE e.worker_id = wp.id
  AND e.status = 'completed'
  AND tp.topics && $cert_topics::text[]
))
```

## Indexes

- `worker_profiles(tenant_id, county)` — already indexed
- `worker_profiles.skills` GIN — already indexed
- `worker_profiles(onboarded_at)` — sparse but OK
- Optionally: `worker_profiles(tenant_id, county, onboarded_at)` composite for the most common filter combo

## Search rate limits

Per-employer rate limit: 100 searches per day, 30 per hour. Implemented via counting `worker_search_log` rows in a sliding window. Out of scope for MVP (defer to ingress-layer rate limit + monitor); revisit if abuse observed.
