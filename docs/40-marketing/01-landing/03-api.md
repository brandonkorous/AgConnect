# 01 — Landing Page: API

The landing page is mostly a Next.js RSC page tree under `apps/web/app/[locale]/(marketing)/`. Backend touchpoints are a small set of public, unauthenticated endpoints.

## Public endpoints under `/v1/landing/*`

These endpoints do NOT require authentication. They run with `app.role = 'service'` (a service-account RLS bypass scoped read-only to the default public tenant).

### GET /v1/landing/featured-jobs

Top 4 active job postings from the default tenant for the homepage.

Response:

```ts
const FeaturedJobsResponse = z.object({
    jobs: z.array(
        z.object({
            id: z.string().uuid(),
            seoSlug: z.string(),
            titleEn: z.string(),
            titleEs: z.string(),
            county: CountyEnum,
            wageMin: z.number(),
            wageMax: z.number(),
            startDate: z.string().date(),
            employerName: z.string(),
            employerVerified: z.literal(true), // landing only shows verified employers' jobs
            skills: z.array(z.string()),
            publishedAt: z.string().datetime(),
        }),
    ),
});
```

Cache: `revalidate: 300` (5 minutes).

### GET /v1/landing/featured-training

Same shape but for `training_programs`.

```ts
const FeaturedTrainingResponse = z.object({
    programs: z.array(
        z.object({
            id: z.string().uuid(),
            seoSlug: z.string(),
            titleEn: z.string(),
            titleEs: z.string(),
            funder: FunderEnum,
            county: CountyEnum,
            startDate: z.string().date(),
            endDate: z.string().date(),
            capacity: z.number(),
            enrolledCount: z.number(),
            orgName: z.string(),
        }),
    ),
});
```

Cache: `revalidate: 600`.

### GET /v1/landing/impact

Public-safe rounded subset of the KPI summary.

Response:

```ts
const ImpactResponse = z.object({
    workersPlaced: z.number(), // last 12 months, rounded to nearest 10
    medianWage: z.number(), // hourly USD, last 12 months
    trainingsCompleted: z.number(), // last 12 months, rounded to nearest 10
    verifiedEmployers: z.number(), // current, exact
    generatedAt: z.string().datetime(),
    windowMonths: z.literal(12),
    source: z.literal('WIOA-aligned · nightly · tenant=central-valley'),
});
```

Cache: `revalidate: 86400` (1 day).

Suppression rule: if any tile counts fewer than 25 individuals, return `null` for that field; UI renders "Coming soon" copy.

### POST /v1/landing/waitlist

Public waitlist signup — for visitors outside the served counties or pre-launch.

Request:

```ts
const WaitlistBody = z
    .object({
        email: z.string().email().optional(),
        phone: z.string().optional(),
        county: z.string().min(2).max(80),
        preferredLang: z.enum(['en', 'es']).default('es'),
        source: z.enum(['landing.final_cta', 'landing.coming_soon', 'landing.waitlist_form']).default('landing.final_cta'),
    })
    .strict()
    .refine((b) => b.email || b.phone, 'email_or_phone_required');
```

Server logic:

1. Rate-limit by IP: max 10 requests/hour, max 30/day. Return `429 too_many_requests` if exceeded.
2. Insert `waitlist` row (nullable `tenant_id`).
3. If email provided, enqueue waitlist confirmation email (see [06-messaging.md](06-messaging.md)).
4. Return `{ status: 'queued' }`.

Response: `200 { status: 'queued' }`.

Errors:

| code                      | http |
| ------------------------- | ---- |
| `email_or_phone_required` | 422  |
| `too_many_requests`       | 429  |
| `validation_failed`       | 422  |

### GET /og/landing

Per-locale OG image for the landing page itself, rendered on the edge runtime via `next/og` (`@vercel/og`).

```tsx
// apps/web/app/og/landing/route.tsx
export const runtime = 'edge';
export const revalidate = 86400;

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const locale = (searchParams.get('locale') as Locale) ?? 'es';
    const headline = locale === 'es' ? 'Del campo, a tu futuro.' : 'From the field, to your future.';
    return new ImageResponse(<LandingOG locale={locale} headline={headline} />, { width: 1200, height: 630 });
}
```

`<LandingOG>` mirrors the hero composition: bone background, large Fraunces italic display headline, AgConn wordmark, "Central Valley" subhead, honey accent dot.

### GET /sitemap.xml

Defined in [00-foundation/09-seo-aio/03-api.md](../../00-foundation/09-seo-aio/03-api.md). The landing page contributes the static URLs (`/`, `/en`, `/es`, `/en/faq`, `/es/faq`).

### GET /robots.txt

Defined in [00-foundation/09-seo-aio/03-api.md](../../00-foundation/09-seo-aio/03-api.md). Landing page is `Allow: /`.

### GET /llms.txt

Defined in [00-foundation/09-seo-aio/02-data-model.md](../../00-foundation/09-seo-aio/02-data-model.md). Includes a paragraph about the landing page surface.

## RSC data-loading pattern

The landing-page RSC composes server-side fetches:

```tsx
// apps/web/app/[locale]/(marketing)/page.tsx
import { unstable_cache } from 'next/cache';

export const revalidate = 300; // page revalidates every 5 minutes

const loadFeaturedJobs = unstable_cache(async () => fetch(`${API_URL}/v1/landing/featured-jobs`, { next: { revalidate: 300 } }).then((r) => r.json()), ['landing.featured-jobs'], { revalidate: 300 });
const loadFeaturedTraining = unstable_cache(async () => fetch(`${API_URL}/v1/landing/featured-training`).then((r) => r.json()), ['landing.featured-training'], { revalidate: 600 });
const loadImpact = unstable_cache(async () => fetch(`${API_URL}/v1/landing/impact`).then((r) => r.json()), ['landing.impact'], { revalidate: 86400 });

export default async function LandingPage({ params: { locale } }) {
    const [jobs, training, impact] = await Promise.all([loadFeaturedJobs(), loadFeaturedTraining(), loadImpact()]);
    return <Landing locale={locale} jobs={jobs} training={training} impact={impact} />;
}
```

For v1, the three loaders return the static mock data behind the feature flags described in [02-data-model.md](02-data-model.md).

## Service-role read pattern (for unauthenticated public reads)

`apps/api/src/middleware/public-tenant.ts`:

```ts
export const publicTenantMiddleware = createMiddleware(async (c, next) => {
    // Resolve the public tenant from env (single tenant for MVP)
    const tenantId = process.env.PUBLIC_TENANT_ID!;
    c.set('tenantId', tenantId);
    c.set('userRole', 'service');
    await db.$transaction(async (tx) => {
        await tx.$executeRawUnsafe(`SET LOCAL app.tenant_id = '${tenantId}'`);
        await tx.$executeRawUnsafe(`SET LOCAL app.role = 'service'`);
        c.set('db', tx);
        await next();
    });
});

api.use('/v1/landing/*', publicTenantMiddleware);
```

The `'service'` role only matches read policies on `job_postings (status = 'active')`, `training_programs (status = 'active')`, and aggregations against `applications` / `enrollments` for the public KPI subset.

```sql
CREATE POLICY landing_jobs_public ON job_postings FOR SELECT
  USING (
    current_setting('app.role', true) = 'service'
    AND status = 'active'
    AND deleted_at IS NULL
    AND tenant_id = current_setting('app.tenant_id', true)::uuid
  );

-- Similar for training_programs.

-- For aggregates, no row return — only counts via aggregate functions are exposed,
-- and only via specific stored procedures called by /v1/landing/impact.
```

> **Inferred:** Aggregates over private tables (applications, enrollments) should be exposed via stored functions (`get_landing_impact()`) that the `service` role has EXECUTE on, NOT via direct table SELECT. This is more constrained than a generic RLS read policy and prevents any column from leaking. Implementation should use `CREATE FUNCTION ... SECURITY DEFINER` with explicit return shape.

## Errors

| code                      | http | when                                       |
| ------------------------- | ---- | ------------------------------------------ |
| `email_or_phone_required` | 422  | waitlist body missing both email and phone |
| `too_many_requests`       | 429  | IP rate-limit                              |
| `validation_failed`       | 422  | Zod schema fail                            |
| `tenant_not_configured`   | 500  | `PUBLIC_TENANT_ID` env missing             |
