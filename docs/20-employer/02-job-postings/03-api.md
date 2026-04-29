# 02 — Job Postings: API (Employer Side)

All endpoints under `/v1/employer/jobs/*`. Worker-facing read endpoints (`/v1/jobs/*`) live in [10-worker/03-job-discovery/03-api.md](../../10-worker/03-job-discovery/03-api.md).

Auth: requires `userRole === 'employer'` and `employer_profile.flcVerifiedAt != null` for publish operations. Drafts allowed even when not yet verified.

## POST /v1/employer/jobs

Create a new job posting (status `draft`).

```ts
const CreateJobBody = z.object({
  titleEn: z.string().min(1).max(120),
  titleEs: z.string().min(1).max(120),
  descriptionEn: z.string().min(20).max(5000),
  descriptionEs: z.string().min(20).max(5000),
  county: CountyEnum,
  wageMin: z.number().min(0).max(500),
  wageMax: z.number().min(0).max(500),
  startDate: z.string().date(),
  endDate: z.string().date().optional(),
  skills: z.array(z.string().min(1).max(60)).max(15),
  positionsTotal: z.number().int().min(1).max(500).default(1),
}).strict()
  .refine((b) => b.wageMin <= b.wageMax, 'wage_order')
  .refine((b) => !b.endDate || b.endDate >= b.startDate, 'date_order');
```

Server: insert with `status = 'draft'`, `seoSlug = null`. Slug generated at publish.

Response: `{ job: JobPostingSchema }`.

## PATCH /v1/employer/jobs/:id

Update a posting. Allowed fields depend on current status:

- `draft` → all fields editable.
- `active` → `descriptionEn/Es`, `endDate` (extend only), `skills` (additive only). Other field changes return 422 `cannot_edit_active_field`.
- `filled` / `closed` → no edits (404 from RLS, since archived).

Body matches `CreateJobBody` with all fields optional.

## POST /v1/employer/jobs/:id/publish

Transition `draft → active`.

Server logic:

1. Verify employer is verified (`flcVerifiedAt != null`).
2. Verify posting validates against the create schema.
3. Atomically check posting count vs plan limit (with `SELECT ... FOR UPDATE`).
4. Generate `seoSlug` (unique).
5. Update `status = 'active'`, `publishedAt = now()`, `seoSlug = ...`.
6. Trigger SEO refresh: invalidate `/sitemap.xml` cache.

Response: `{ job: JobPostingSchema }`.

Errors:

| code | http |
|---|---|
| `employer_not_verified` | 403 |
| `validation_failed` | 422 |
| `plan_posting_limit` | 402 |
| `slug_collision` | 500 (rare; auto-retry once with new suffix) |

## POST /v1/employer/jobs/:id/close

Close an active posting (employer chose to end it; not necessarily filled).

Body: `{ reason?: 'filled' | 'expired' | 'changed_mind' }`.

Server: update `status = 'closed'`, `closedAt = now()`. If `reason === 'filled'`, also set `filledAt`.

## POST /v1/employer/jobs/:id/duplicate

Create a new draft from an existing posting. Phase 2 — out of scope for MVP.

## GET /v1/employer/jobs

List the employer's own postings.

Query: `?status=draft|active|filled|closed&limit=20&cursor=...`

Response includes per-posting application counts:

```ts
const EmployerJobsResponse = z.object({
  jobs: z.array(JobPostingSchema.extend({
    applicationCounts: z.object({
      applied: z.number(),
      reviewed: z.number(),
      hired: z.number(),
      rejected: z.number(),
    }),
  })),
  nextCursor: z.string().nullable(),
});
```

## GET /v1/employer/jobs/:id

Single posting detail with full app counts and recent activity.

## DELETE /v1/employer/jobs/:id

Soft-delete a draft. Active postings must be closed first; drafts can be deleted directly.

## POST /v1/employer/jobs/translate

LLM-assisted translation helper. Used by the create form's "Translate this for me" button.

```ts
const TranslateBody = z.object({
  field: z.enum(['title', 'description']),
  fromLocale: z.enum(['en', 'es']),
  toLocale: z.enum(['en', 'es']),
  text: z.string().min(1).max(5000),
});
```

Server: calls Claude with a focused translation prompt:

```text
Translate this farm-job posting field from {from} to {to}. Keep the tone professional, suitable for Central Valley farmworker audiences. Preserve any specific job titles or certification names. Return only the translated text, no commentary.
```

Response: `{ translation: string }`.

Cost: ~$0.005 per translation. Logged to a `translation_log` table (out of scope for MVP — log to existing pg-boss/Sentry).

> **Inferred:** A simple Claude call is enough — no need for a translation pipeline package since use is small. If translation volume grows, extract to `packages/i18n-translate/` with caching.

## Slug generation

```ts
function generateJobSlug(posting: { county: County; titleEn: string; startDate: Date }): string {
  const base = [
    posting.county.toLowerCase(),
    slugify(posting.titleEn),
    posting.startDate.getFullYear(),
  ].join('-');
  for (let attempt = 0; attempt < 3; attempt++) {
    const suffix = randomBytes(2).toString('hex');
    const candidate = `${base}-${suffix}`.slice(0, 80);
    const exists = await db.jobPosting.findUnique({ where: { seoSlug: candidate } });
    if (!exists) return candidate;
  }
  throw new Error('slug_collision');
}
```

## Errors

| code | http | when |
|---|---|---|
| `employer_not_verified` | 403 | publish before FLC verification |
| `plan_posting_limit` | 402 | free plan over 2 active postings |
| `cannot_edit_active_field` | 422 | edit forbidden field on active posting |
| `wage_order` | 422 | wageMin > wageMax |
| `date_order` | 422 | endDate < startDate |
| `cannot_close_at_status` | 422 | close on filled / closed |
