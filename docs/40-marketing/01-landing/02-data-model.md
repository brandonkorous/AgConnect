# 01 — Landing Page: Data Model

The landing page is mostly read-only; it composes data already owned by other features.

## Reads

| section | source | notes |
|---|---|---|
| Featured Jobs | `job_postings` | top 4 active in default tenant; v2+ |
| Featured Training | `training_programs` | top 4 active in default tenant; v3+ |
| Impact Numbers | `applications` + `enrollments` aggregates | public-safe rounded counts; v3+ |
| Testimonials | static config | v1; replace with DB-backed in v3 |
| FAQ entries | static config (TS / MDX) | v1+ |
| Trust Strip logos | static config + asset files | v1; updated when partners confirm |

## Writes

| section | target | notes |
|---|---|---|
| Waitlist form (Final CTA + Coming-soon redirect) | `waitlist` (defined in [10-worker/01-onboarding/02-data-model.md](../../10-worker/01-onboarding/02-data-model.md)) | nullable `tenant_id` — captures pre-launch + out-of-area interest |

## Static config files

```
apps/web/app/[locale]/(marketing)/_data/
  testimonials.ts        # v1 placeholder testimonials (3 entries: worker, employer, training org)
  faq.ts                 # 8 FAQ entries × 2 locales
  partners.ts            # Trust Strip logos: { name, logoSvg, url, category: 'funder' | 'partner' }
  counties.ts            # the 5 served counties (re-export from shared-types if available)
```

`testimonials.ts` shape:

```ts
export const testimonials: Record<Locale, Testimonial[]> = {
  en: [
    {
      role: 'worker',
      quoteEn: '...',
      attribution: { firstName: 'María', lastInitial: 'R.', county: 'Fresno', context: 'Strawberry harvest, 2026' },
    },
    { role: 'employer', ... },
    { role: 'training_org', ... },
  ],
  es: [/* same shape, ES quote */],
};
```

`faq.ts` shape:

```ts
export const faqEntries: Record<Locale, { q: string; a: string }[]> = {
  en: [
    { q: 'How do I find seasonal farm work in Fresno?', a: '...' },
    // 7 more
  ],
  es: [
    { q: '¿Cómo encuentro trabajo agrícola de temporada en Fresno?', a: '...' },
    // 7 more
  ],
};
```

> **Inferred:** Static FAQ for v1 is sufficient. If editorial cadence increases (more than monthly), migrate to a DB-backed `faq_entries` table with admin CRUD.

## Featured Jobs / Featured Training selection

```ts
// Featured jobs query (run inside the tenant scope of the default tenant)
const featuredJobs = await db.jobPosting.findMany({
  where: { status: 'active', deletedAt: null },
  include: { employer: { include: { employerProfile: true } } },
  orderBy: [{ publishedAt: 'desc' }, { wageMax: 'desc' }],
  take: 4,
});
```

`Featured Training` is the same pattern against `training_programs`.

## Impact Numbers source

The four tiles displayed on the landing page (per the artboard's Impact Numbers section):

| tile | aggregate | source query |
|---|---|---|
| Workers placed | `COUNT(*) FILTER (WHERE status = 'hired')` from `applications` | last 12 months |
| Median wage at placement | `percentile_cont(0.5)` over `wage_offered` for hired apps | last 12 months |
| Trainings completed | `COUNT(*) FILTER (WHERE status = 'completed')` from `enrollments` | last 12 months |
| Verified employers | `COUNT(*)` from `employer_profiles WHERE flc_verified_at IS NOT NULL` | current |

Numbers are **rounded** before display (workers placed → nearest 10; median wage → nearest cent; trainings → nearest 10; employers → exact). Rounding logic ships as a helper in `packages/shared-types/src/landing-stats.ts`.

> **Inferred:** Rounding prevents a privacy footgun where exact small counts could identify individuals. With > 1000 placements, rounding to the nearest 10 is invisible; with < 100, the page should suppress the tile entirely or show a range ("100+"). Suppression threshold: any tile counting fewer than 25 individuals → render placeholder copy "Coming soon" until threshold met.

## Mocked data (v1)

For v1, the four sections that depend on real data render hard-coded mocks visibly labeled.

```ts
// apps/web/app/[locale]/(marketing)/_data/v1-mocks.ts
export const MOCK_FEATURED_JOBS: JobCard[] = [/* 4 entries */];
export const MOCK_FEATURED_TRAINING: ProgramCard[] = [/* 4 entries */];
export const MOCK_IMPACT_NUMBERS = { workersPlaced: 2484, medianWage: 18.20, trainingsCompleted: 1382, verifiedEmployers: 184 };
export const MOCK_TESTIMONIALS = { /* 3 entries */ };
```

Each section reads from a feature flag:

```ts
const useReal = await flag('landing.featured_jobs.real');  // off in v1, on in v2+
```

Flags live in `tenants.settings.featureFlags` ([00-foundation/01-multi-tenancy](../../00-foundation/01-multi-tenancy/)). Toggle once real data is ready.

## RLS

No new tables. Existing policies cover all reads.

The waitlist insert endpoint is unauthenticated and bypasses RLS via a service-role write. The endpoint enforces per-IP rate limiting (10/hour) to prevent spam.

## Indexes

No new indexes. Existing indexes on `job_postings`, `training_programs`, `applications`, `enrollments` cover the landing-page queries.
