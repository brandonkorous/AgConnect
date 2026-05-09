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

## RLS roles for unauthenticated public reads

Three-bucket tenancy retired the `PUBLIC_TENANT_ID` "default tenant" pattern (see `migrations/20260504200000_three_bucket_tenancy`). Landing routes now use one of two RLS roles, both without a pinned `app.tenant_id`:

- **`anonymous`** — marketplace SELECT only. The `job_postings_marketplace_read` and `training_programs_marketplace_read` policies grant `app.role IN ('authenticated','anonymous','service') AND status='active' AND deleted_at IS NULL`. The `waitlist_anonymous_insert` policy grants INSERT when `tenant_id IS NULL`. No other tables are reachable.
- **`service` (no pinned tenant)** — used by `/impact` (cross-tenant aggregates over `applications`, `enrollments`, `employer_profiles` whose service policies are role-only) and by `/waitlist` + confirm/unsubscribe (NULL-tenant rows on `waitlist` and `email_log`, gated by NULLIF in the relaxed service policies).

Middleware in [services/api/src/middleware/tenantContext.ts](../../../services/api/src/middleware/tenantContext.ts):

```ts
export const anonymousMiddleware = (poolName) =>
  createMiddleware(async (c, next) => {
    c.set('db', dbClients[poolName]);
    c.set('role', 'anonymous');
    await runWithRlsContext({ role: 'anonymous' }, () => next());
  });

export const serviceNoTenantMiddleware = (poolName) =>
  createMiddleware(async (c, next) => {
    c.set('db', dbClients[poolName]);
    c.set('role', 'service');
    await runWithRlsContext({ role: 'service' }, () => next());
  });
```

Marketplace policies (active rows only, cross-tenant):

```sql
CREATE POLICY job_postings_marketplace_read ON job_postings FOR SELECT
  USING (
    current_setting('app.role', true) IN ('authenticated', 'anonymous', 'service')
    AND status = 'active'
    AND deleted_at IS NULL
  );

-- Same shape for training_programs (status IN ('active','full')).
```

NULL-tenant policies on waitlist + email_log (NULLIF coerces empty `app.tenant_id` to NULL):

```sql
CREATE POLICY waitlist_service ON waitlist
  USING (
    current_setting('app.role', true) = 'service'
    AND (
      tenant_id IS NULL
      OR tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid
    )
  );
```

## Errors

| code                      | http | when                                       |
| ------------------------- | ---- | ------------------------------------------ |
| `email_or_phone_required` | 422  | waitlist body missing both email and phone |
| `too_many_requests`       | 429  | IP rate-limit                              |
| `validation_failed`       | 422  | Zod schema fail                            |
