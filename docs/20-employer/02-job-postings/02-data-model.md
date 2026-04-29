# 02 — Job Postings: Data Model

## job_postings (canonical, full)

```prisma
model JobPosting {
  id              String      @id @default(uuid()) @db.Uuid
  tenantId        String      @db.Uuid              @map("tenant_id")
  employerId      String      @db.Uuid              @map("employer_id")     // FK → users (employer role)
  titleEn         String      @db.VarChar(120)      @map("title_en")
  titleEs         String      @db.VarChar(120)      @map("title_es")
  descriptionEn   String                              @map("description_en")
  descriptionEs   String                              @map("description_es")
  county          County
  wageMin         Decimal     @db.Decimal(8, 2)    @map("wage_min")
  wageMax         Decimal     @db.Decimal(8, 2)    @map("wage_max")
  startDate       DateTime    @db.Date              @map("start_date")
  endDate         DateTime?   @db.Date              @map("end_date")
  status          JobStatus   @default(draft)
  skills          String[]                                                  // canonical or custom skill tags
  positionsTotal  Int         @default(1)            @map("positions_total")
  hireCount       Int         @default(0)            @map("hire_count")     // tracks fills toward total
  seoSlug         String?     @unique                @map("seo_slug")        // null until published
  publishedAt     DateTime?                          @map("published_at")
  filledAt        DateTime?                          @map("filled_at")
  closedAt        DateTime?                          @map("closed_at")
  createdAt       DateTime    @default(now())        @map("created_at")
  updatedAt       DateTime    @updatedAt             @map("updated_at")
  deletedAt       DateTime?                          @map("deleted_at")

  // Generated bilingual FTS column
  search          Unsupported("tsvector")?

  employer        User                                @relation(fields: [employerId], references: [id])
  applications    Application[]

  @@index([tenantId])
  @@index([employerId])
  @@index([status, county])
  @@index([startDate])
  @@map("job_postings")
}

enum JobStatus { draft active filled closed }
```

The `search` tsvector + GIN index defined in [00-foundation/04-i18n/02-data-model.md](../../00-foundation/04-i18n/02-data-model.md).

## CHECK constraints

```sql
ALTER TABLE job_postings
  ADD CONSTRAINT title_en_present CHECK (length(trim(title_en)) > 0),
  ADD CONSTRAINT title_es_present CHECK (length(trim(title_es)) > 0),
  ADD CONSTRAINT desc_en_present CHECK (length(trim(description_en)) >= 20),
  ADD CONSTRAINT desc_es_present CHECK (length(trim(description_es)) >= 20),
  ADD CONSTRAINT wage_order CHECK (wage_min <= wage_max),
  ADD CONSTRAINT date_order CHECK (end_date IS NULL OR end_date >= start_date),
  ADD CONSTRAINT positions_positive CHECK (positions_total >= 1),
  ADD CONSTRAINT slug_when_active CHECK ((status = 'draft' AND seo_slug IS NULL) OR (status != 'draft' AND seo_slug IS NOT NULL));
```

## State machine

```
draft → active   (publish)
active → filled  (employer marks)
active → closed  (employer closes early)
filled → active  (admin only — re-opens)
draft → closed   (employer abandons draft) — actually use deletedAt
```

## RLS

```sql
-- Public can read active jobs only
CREATE POLICY jp_public ON job_postings FOR SELECT
  USING (status = 'active' AND deleted_at IS NULL);

-- Employer can manage their own (any status)
CREATE POLICY jp_self_employer ON job_postings FOR ALL
  USING (employer_id = current_setting('app.user_id', true)::uuid);

-- Admin
CREATE POLICY jp_admin ON job_postings USING (current_setting('app.role', true) = 'admin');
```

## Plan-tier enforcement

Free tier = 2 active postings max. Atomic check on publish:

```ts
// In publish handler
const result = await tx.$queryRaw<{ count: number }[]>`
  SELECT COUNT(*)::int AS count
  FROM job_postings
  WHERE employer_id = ${employerId}
  AND status = 'active'
  AND deleted_at IS NULL`;

const limit = employer.plan === 'free' ? 2 : Infinity;
if (result[0].count >= limit) throw new HTTPException(402, { message: 'plan_posting_limit' });
```

For atomicity, wrap in a transaction with `SELECT ... FOR UPDATE` on the employer row:

```sql
BEGIN;
SELECT * FROM employer_profiles WHERE id = $1 FOR UPDATE;
SELECT count(*) FROM job_postings WHERE employer_id = $1 AND status = 'active' AND deleted_at IS NULL;
-- check limit, then UPDATE job_postings SET status = 'active' WHERE id = $jobId;
COMMIT;
```

## Indexes

- `job_postings(employer_id, status)` — employer dashboard
- `job_postings(tenant_id, status, county, start_date)` — public listing
- `job_postings(seo_slug)` unique — public detail
- `job_postings(search)` GIN — FTS
- `job_postings(skills)` GIN — skill match
- Partial: `WHERE status = 'active' AND deleted_at IS NULL` for hot rows

## Job edit constraints

While `status = 'active'`, ONLY these fields are editable:

- `descriptionEn`, `descriptionEs` (extending description allowed)
- `endDate` (extending allowed; shortening warns)
- `skills` (additive only — removing skills requires admin)

Other fields require closing the posting and creating a new one. Enforced at API layer.

> **Inferred:** Restricting active-job edits prevents bait-and-switch (post a $25/hr job, then edit to $15/hr after applications come in). The trade-off is rigidity. Adjust based on operator feedback post-launch.
