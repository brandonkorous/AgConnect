# 03 — Job Discovery: Data Model

## Reads

`job_postings` (defined in [20-employer/02-job-postings/02-data-model.md](../../20-employer/02-job-postings/02-data-model.md)) with FTS index from [00-foundation/04-i18n/02-data-model.md](../../00-foundation/04-i18n/02-data-model.md).

## saved_searches (new)

```prisma
model SavedSearch {
  id            String   @id @default(uuid()) @db.Uuid
  tenantId      String   @db.Uuid              @map("tenant_id")
  workerId      String   @db.Uuid              @map("worker_id")
  name          String?                         // optional user-given name; default derived from filters
  filters       Json                            // SavedSearchFiltersSchema
  alertChannel  AlertChannel @default(sms)      @map("alert_channel")  // sms only for MVP
  alertActive   Boolean  @default(true)         @map("alert_active")
  lastNotifiedAt DateTime?                      @map("last_notified_at")
  createdAt     DateTime @default(now())        @map("created_at")
  updatedAt     DateTime @updatedAt             @map("updated_at")
  deletedAt     DateTime?                        @map("deleted_at")

  worker        User     @relation(fields: [workerId], references: [id])

  @@index([tenantId])
  @@index([workerId])
  @@index([alertActive])
  @@map("saved_searches")
}

enum AlertChannel { sms email both }
```

## SavedSearchFiltersSchema

```ts
export const SavedSearchFiltersSchema = z.object({
  county:      z.array(CountyEnum).optional(),
  skills:      z.array(z.string().min(1).max(60)).optional(),
  wageMin:     z.number().min(0).optional(),       // hourly USD floor
  wageMax:     z.number().min(0).optional(),
  startBefore: z.string().date().optional(),
  startAfter:  z.string().date().optional(),
  q:           z.string().max(120).optional(),     // free-text query
}).strict();
```

## search_views (lightweight analytics)

```prisma
model SearchView {
  id          String   @id @default(uuid()) @db.Uuid
  tenantId    String   @db.Uuid              @map("tenant_id")
  workerId    String?  @db.Uuid              @map("worker_id")     // null for anonymous
  filters     Json
  resultCount Int                              @map("result_count")
  createdAt   DateTime @default(now())        @map("created_at")

  @@index([tenantId, createdAt])
  @@map("search_views")
}
```

Used to power the admin "what are workers searching for" report and to detect dead-end searches (zero results) for content-gap analysis. Not surfaced to workers.

> **Inferred:** Lightweight analytics (no per-page-view, just per-search) is enough for MVP. Full event analytics (impression / click / outbound) can come in Phase 2 with a proper analytics pipeline (Posthog or Plausible).

## RLS

- `saved_searches`: standard tenant isolation + self-only:

```sql
CREATE POLICY saved_searches_self ON saved_searches
  FOR ALL
  USING (
    worker_id = current_setting('app.user_id', true)::uuid
    OR current_setting('app.role', true) = 'admin'
  );
```

- `search_views`: insert from any authenticated context within the tenant; admin-only read.

## Indexes

- `job_postings(tenant_id, status, county)` — primary filter path
- `job_postings.search` (gin) — FTS
- `job_postings.skills` (gin) — required-skill match (intersection with worker skills)
- `saved_searches(workerId, alertActive)` — alert worker query

## Job-match SQL (canonical query)

```sql
-- Match jobs for a saved search
SELECT j.*
FROM job_postings j
WHERE j.tenant_id = $tenant
  AND j.status = 'active'
  AND j.deleted_at IS NULL
  AND ($counties IS NULL OR j.county = ANY($counties))
  AND ($skills IS NULL OR j.skills && $skills::text[])
  AND ($wage_min IS NULL OR j.wage_max >= $wage_min)
  AND ($wage_max IS NULL OR j.wage_min <= $wage_max)
  AND ($start_before IS NULL OR j.start_date <= $start_before)
  AND ($start_after IS NULL OR j.start_date >= $start_after)
  AND ($q IS NULL OR j.search @@ websearch_to_tsquery('simple', $q))
ORDER BY j.start_date ASC, j.created_at DESC
LIMIT $limit OFFSET $offset;
```

The `websearch_to_tsquery('simple', ...)` is locale-agnostic (matches both EN and ES content because the FTS column is built from both). For per-locale relevance scoring, switch to `english` / `spanish` configs based on caller's locale — out of scope for MVP.

## Recommendations query

For the dashboard "Recommended for you" section: join `worker_profiles` to `job_postings` by county overlap and skill intersection, ordered by skill-match count.

```sql
SELECT j.*, cardinality(j.skills & wp.skills) AS match_score
FROM job_postings j
JOIN worker_profiles wp ON wp.id = $worker_id
WHERE j.tenant_id = wp.tenant_id
  AND j.status = 'active'
  AND j.deleted_at IS NULL
  AND j.county = wp.county
ORDER BY match_score DESC, j.created_at DESC
LIMIT 5;
```
