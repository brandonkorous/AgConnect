# 03 — Job Discovery: API

## GET /v1/jobs

List active jobs in the current tenant. Authenticated and unauthenticated; unauthenticated returns the same data minus personalized recommendation ordering.

Query params:

```ts
const JobsQuery = z.object({
  county:      z.array(CountyEnum).optional(),       // ?county=Fresno&county=Kern
  skills:      z.array(z.string()).optional(),
  wageMin:     z.coerce.number().min(0).optional(),
  wageMax:     z.coerce.number().min(0).optional(),
  startBefore: z.string().date().optional(),
  startAfter:  z.string().date().optional(),
  q:           z.string().max(120).optional(),
  limit:       z.coerce.number().min(1).max(50).default(20),
  cursor:      z.string().optional(),     // cursor pagination on (created_at, id)
}).strict();
```

Response:

```ts
const JobsResponse = z.object({
  jobs: z.array(JobCardSchema),
  nextCursor: z.string().nullable(),
  total: z.number().optional(),     // omitted for unauthenticated to save query cost
});

const JobCardSchema = z.object({
  id: z.string().uuid(),
  seoSlug: z.string(),
  titleEn: z.string(),
  titleEs: z.string(),
  county: CountyEnum,
  wageMin: z.number(),
  wageMax: z.number(),
  startDate: z.string().date(),
  endDate: z.string().date().nullable(),
  employerName: z.string(),
  employerVerified: z.boolean(),
  skills: z.array(z.string()),
  createdAt: z.string().datetime(),
});
```

Side effect: writes a `search_views` row with the filters and result count.

## GET /v1/jobs/:slug

Single job detail. Slug-based, not ID-based, because public URLs use slugs.

Response: full `JobPostingFullSchema` including bilingual descriptions, employer profile snippet, and (for authenticated workers) `applicationStatus` if the worker has already applied.

## GET /v1/jobs/recommended

Authenticated workers only. Returns up to 5 jobs ranked by skill-match score against `worker_profiles.skills` and `county`.

```ts
const RecommendedResponse = z.object({
  jobs: z.array(JobCardSchema.extend({
    matchScore: z.number().int(),       // skill intersection count
  })),
});
```

## POST /v1/saved-searches

Create a saved search.

Request:

```ts
const CreateSavedSearchBody = z.object({
  name: z.string().max(60).optional(),
  filters: SavedSearchFiltersSchema,
  alertChannel: z.enum(['sms', 'email', 'both']).default('sms'),
  alertActive: z.boolean().default(true),
});
```

Response: created `SavedSearch`.

If the worker has no phone and `alertChannel` includes `sms`, return 422 `phone_required`.

## GET /v1/saved-searches

List the worker's saved searches.

## PATCH /v1/saved-searches/:id

Update name, filters, or alert state. Pause/resume alerts via `alertActive`.

## DELETE /v1/saved-searches/:id

Soft-delete.

## POST /v1/jobs/:id/apply

Apply to a job. Detailed in [04-application-tracker/03-api.md](../04-application-tracker/03-api.md).

## Job alert dispatcher (background)

Runs as a `pg-boss` cron job every 5 minutes:

```ts
// apps/api/src/workers/saved-search-dispatcher.ts
pgBoss.schedule('saved-search-dispatch', '*/5 * * * *', {});

pgBoss.work('saved-search-dispatch', async () => {
  // Find all (saved_search, new matching job) pairs since the search was last notified
  const pairs = await db.$queryRaw<...>`
    SELECT s.id AS search_id, s.worker_id, s.tenant_id, j.id AS job_id, j.seo_slug, j.title_en, j.title_es, j.county, j.wage_min, j.wage_max
    FROM saved_searches s
    JOIN job_postings j ON
         j.tenant_id = s.tenant_id
         AND j.status = 'active'
         AND j.deleted_at IS NULL
         AND j.created_at > COALESCE(s.last_notified_at, s.created_at)
         AND <filter predicates derived from s.filters JSONB>
    WHERE s.alert_active = true AND s.deleted_at IS NULL
    LIMIT 1000`;

  // Group by worker; cap at 3 alerts per worker per dispatch (prevent flood)
  // Enqueue SMS alerts via enqueueSms with template 'job.alert'
  // Update s.last_notified_at to now() for each search that fired
});
```

> **Inferred:** 5-minute dispatch cadence balances responsiveness with batching. Fewer alerts, faster delivery: 1 minute. More alerts, slower batching: 15 minutes. 5 is a defensible middle.

## Errors

| code | http | when |
|---|---|---|
| `phone_required` | 422 | saved search SMS alert without phone |
| `not_found` | 404 | job slug not in active set |
| `already_applied` | 409 | worker apply but already applied (see application-tracker) |
| `not_authenticated` | 401 | apply without sign-in |
