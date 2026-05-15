# 09 — SEO & AIO: Data Model

## seo_slug column pattern

Every entity with a public page has a `seo_slug`:

```prisma
seoSlug String @unique @map("seo_slug")
```

Used in: `job_postings`, `training_programs`, `employer_profiles`.

Slug rules:

- lowercase, ASCII only, hyphen-separated
- includes county + key noun + identifier suffix to ensure uniqueness
- ≤ 80 characters
- generated server-side at create time; never user-editable post-create (would break inbound links)

Examples:

```
job_postings.seo_slug = "fresno-strawberry-harvest-picker-2026-x4f2"
training_programs.seo_slug = "kern-tractor-safety-cdfa-2026-spring"
employer_profiles.seo_slug = "central-valley-farms-fresno"
```

## Slug generation

```ts
// packages/shared-types/src/slug.ts
export function generateJobSlug(posting: { county: string; titleEn: string; startDate: Date }): string {
    const base = [posting.county.toLowerCase(), slugify(posting.titleEn), posting.startDate.getFullYear()].join('-');
    const suffix = randomBytes(2).toString('hex');
    return `${base}-${suffix}`.slice(0, 80);
}

function slugify(s: string): string {
    return s
        .toLowerCase()
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '') // strip accents
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
        .slice(0, 50);
}
```

> **Inferred:** Slug uses the EN title for SEO. ES users land on `/es/trabajos/<en-slug>` — the slug is locale-agnostic. If we need ES-specific slugs, add `seo_slug_es` later (unused for MVP).

## sitemap data

The sitemap is generated dynamically from the DB:

```ts
// apps/web/app/sitemap.ts
import type { MetadataRoute } from 'next';
import { db } from '@agconn/db';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const baseUrl = 'https://agconn.com';

    const [jobs, training, employers] = await Promise.all([
        db.jobPosting.findMany({ where: { status: 'active', deletedAt: null }, select: { seoSlug: true, updatedAt: true } }),
        db.trainingProgram.findMany({ where: { deletedAt: null }, select: { seoSlug: true, updatedAt: true } }),
        db.employerProfile.findMany({ where: { flcVerifiedAt: { not: null } }, select: { seoSlug: true, updatedAt: true } }),
    ]);

    const staticEntries: MetadataRoute.Sitemap = [
        { url: `${baseUrl}/es`, alternates: { languages: { en: `${baseUrl}/en`, es: `${baseUrl}/es` } }, changeFrequency: 'daily', priority: 1.0 },
        { url: `${baseUrl}/es/jobs`, alternates: { languages: { en: `${baseUrl}/en/jobs`, es: `${baseUrl}/es/trabajos` } }, changeFrequency: 'hourly', priority: 0.9 },
        { url: `${baseUrl}/es/training`, alternates: { languages: { en: `${baseUrl}/en/training`, es: `${baseUrl}/es/capacitacion` } }, changeFrequency: 'daily', priority: 0.8 },
        { url: `${baseUrl}/es/faq`, alternates: { languages: { en: `${baseUrl}/en/faq`, es: `${baseUrl}/es/faq` } }, changeFrequency: 'monthly', priority: 0.7 },
    ];

    const jobEntries: MetadataRoute.Sitemap = jobs.flatMap((j) => [
        {
            url: `${baseUrl}/en/jobs/${j.seoSlug}`,
            lastModified: j.updatedAt,
            alternates: { languages: { en: `${baseUrl}/en/jobs/${j.seoSlug}`, es: `${baseUrl}/es/trabajos/${j.seoSlug}` } },
            changeFrequency: 'daily',
        },
        {
            url: `${baseUrl}/es/trabajos/${j.seoSlug}`,
            lastModified: j.updatedAt,
            alternates: { languages: { en: `${baseUrl}/en/jobs/${j.seoSlug}`, es: `${baseUrl}/es/trabajos/${j.seoSlug}` } },
            changeFrequency: 'daily',
        },
    ]);
    // similar for training, employers

    return [...staticEntries, ...jobEntries /* ... */];
}
```

`changeFrequency`: `daily` for jobs (active postings update often), `hourly` for the listings index, `monthly` for FAQ.

## JSON-LD schemas

For each entity type, an LD generator function in `packages/shared-types/src/jsonld.ts`:

```ts
export function jobPostingJsonLd(posting: JobPostingWithEmployer, locale: Locale) {
    const baseUrl = 'https://agconn.com';
    return {
        '@context': 'https://schema.org/',
        '@type': 'JobPosting',
        title: locale === 'es' ? posting.titleEs : posting.titleEn,
        description: locale === 'es' ? posting.descriptionEs : posting.descriptionEn,
        datePosted: posting.createdAt.toISOString(),
        validThrough: posting.endDate?.toISOString() ?? new Date(Date.now() + 30 * 86400e3).toISOString(),
        employmentType: 'SEASONAL',
        hiringOrganization: {
            '@type': 'Organization',
            name: posting.employer.businessName,
            sameAs: `${baseUrl}/${locale}/employers/${posting.employer.seoSlug}`,
        },
        jobLocation: {
            '@type': 'Place',
            address: { '@type': 'PostalAddress', addressLocality: posting.county, addressRegion: 'CA', addressCountry: 'US' },
        },
        baseSalary:
            posting.wageMin && posting.wageMax
                ? {
                      '@type': 'MonetaryAmount',
                      currency: 'USD',
                      value: { '@type': 'QuantitativeValue', minValue: Number(posting.wageMin), maxValue: Number(posting.wageMax), unitText: 'HOUR' },
                  }
                : undefined,
        inLanguage: locale === 'es' ? 'es' : 'en',
    };
}

export function trainingProgramJsonLd(program: TrainingProgram, locale: Locale) {
    return {
        '@context': 'https://schema.org/',
        '@type': 'EducationalOccupationalProgram',
        name: locale === 'es' ? program.titleEs : program.titleEn,
        description: locale === 'es' ? program.summaryEs : program.summaryEn,
        provider: { '@type': 'Organization', name: program.org.businessName },
        startDate: program.startDate.toISOString(),
        endDate: program.endDate.toISOString(),
        educationalProgramMode: 'in-person',
        inLanguage: locale === 'es' ? 'es' : 'en',
    };
}

export function organizationJsonLd(tenant: Tenant) {
    return {
        '@context': 'https://schema.org/',
        '@type': 'Organization',
        name: 'AGCONN',
        url: 'https://agconn.com',
        logo: 'https://agconn.com/logo.png',
        sameAs: [
            // social links if applicable
        ],
        contactPoint: {
            '@type': 'ContactPoint',
            contactType: 'customer support',
            email: 'support@agconn.com',
        },
    };
}

export function faqJsonLd(items: { q: string; a: string }[]) {
    return {
        '@context': 'https://schema.org/',
        '@type': 'FAQPage',
        mainEntity: items.map((i) => ({
            '@type': 'Question',
            name: i.q,
            acceptedAnswer: { '@type': 'Answer', text: i.a },
        })),
    };
}
```

## Indexes

- `job_postings(seo_slug)` unique — direct slug lookup
- `training_programs(seo_slug)` unique
- `employer_profiles(seo_slug)` unique

## llms.txt content

Static or generated from settings:

```
# AGCONN

AGCONN is a bilingual (English/Spanish) workforce platform for the Central Valley of California. It connects farmworkers to verified seasonal jobs and CDFA / F3-funded training programs, and provides employers with a vetted worker pool.

## Service area

Fresno, Kern, Kings, Madera, and Tulare counties, California, USA.

## What AI agents can do here

- List active job postings: https://agconn.com/en/jobs
- View training programs: https://agconn.com/en/training
- Read FAQs: https://agconn.com/en/faq
- Verify a certificate: https://agconn.com/verify/<id>   (Phase 2)

## Indexable content

- All public job postings (ld+json: JobPosting)
- All public training programs (ld+json: EducationalOccupationalProgram)
- All verified employer profiles (ld+json: Organization)

## Contact

support@agconn.com
```

The llms.txt route at `apps/web/app/llms.txt/route.ts` returns this with `Content-Type: text/plain; charset=utf-8`.
