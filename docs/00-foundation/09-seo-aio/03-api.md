# 09 — SEO & AIO: Routes & Helpers

## generateMetadata helpers

Per-feature pages call into a shared helper that builds Next.js Metadata.

```ts
// packages/shared-types/src/metadata.ts
import type { Metadata } from 'next';

export function jobMetadata(posting: JobPostingWithEmployer, locale: Locale): Metadata {
    const title = locale === 'es' ? posting.titleEs : posting.titleEn;
    const description = (locale === 'es' ? posting.descriptionEs : posting.descriptionEn).slice(0, 160);
    const baseUrl = 'https://agconn.com';
    const canonical = `${baseUrl}/${locale}/${locale === 'es' ? 'trabajos' : 'jobs'}/${posting.seoSlug}`;

    return {
        title: `${title} — ${posting.county} County | AGCONN`,
        description,
        alternates: {
            canonical,
            languages: {
                en: `${baseUrl}/en/jobs/${posting.seoSlug}`,
                es: `${baseUrl}/es/trabajos/${posting.seoSlug}`,
                'x-default': `${baseUrl}/es/trabajos/${posting.seoSlug}`,
            },
        },
        openGraph: {
            title,
            description,
            url: canonical,
            siteName: 'AGCONN',
            images: [{ url: `${baseUrl}/og/job/${posting.id}`, width: 1200, height: 630 }],
            locale: locale === 'es' ? 'es_MX' : 'en_US',
            type: 'website',
        },
        twitter: { card: 'summary_large_image', title, description, images: [`${baseUrl}/og/job/${posting.id}`] },
        robots: { index: true, follow: true },
    };
}
```

Similar helpers: `trainingMetadata`, `employerMetadata`, `landingMetadata`, `faqMetadata`.

## Page integration pattern

```tsx
// apps/web/app/[locale]/jobs/[slug]/page.tsx
import { jobMetadata, jobPostingJsonLd } from '@agconn/shared-types/seo';
import { db } from '@agconn/db';
import { notFound } from 'next/navigation';

export async function generateMetadata({ params }: { params: { locale: Locale; slug: string } }) {
    const posting = await db.jobPosting.findUnique({ where: { seoSlug: params.slug }, include: { employer: true } });
    return posting ? jobMetadata(posting, params.locale) : {};
}

export default async function JobPage({ params }: { params: { locale: Locale; slug: string } }) {
    const posting = await db.jobPosting.findUnique({
        where: { seoSlug: params.slug, status: 'active', deletedAt: null },
        include: { employer: { include: { employerProfile: true } } },
    });
    if (!posting) notFound();

    const ld = jobPostingJsonLd(posting, params.locale);

    return (
        <>
            <script type='application/ld+json' dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }} />
            {/* page UI */}
        </>
    );
}
```

## Sitemap

`apps/web/app/sitemap.ts` — see [02-data-model.md](02-data-model.md) for the implementation. Next.js auto-routes this to `/sitemap.xml`. ISR-cached for 1 hour:

```ts
export const revalidate = 3600;
```

For very large sitemaps (> 50k URLs), Next.js supports sitemap index files (`app/sitemap/[id]/sitemap.ts`). Out of scope for MVP.

## Robots

`apps/web/app/robots.ts`:

```ts
import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
    return {
        rules: [
            { userAgent: '*', allow: '/', disallow: ['/admin/', '/api/'] },
            // Explicit allow for known AI crawlers — even though '*' allows them, this signals intent
            { userAgent: 'GPTBot', allow: '/' },
            { userAgent: 'PerplexityBot', allow: '/' },
            { userAgent: 'ClaudeBot', allow: '/' },
            { userAgent: 'Google-Extended', allow: '/' },
        ],
        sitemap: 'https://agconn.com/sitemap.xml',
        host: 'https://agconn.com',
    };
}
```

> **Inferred:** Allowing AI crawlers is a deliberate AIO investment. Some sites block these by default; AGCONN chooses discoverability over training-data control because the platform's mission is reach.

## llms.txt

`apps/web/app/llms.txt/route.ts`:

```ts
import { db } from '@agconn/db';

export async function GET() {
    const tenant = await db.tenant.findFirst({ where: { slug: 'central-valley' } });
    const body = renderLlmsTxt(tenant);
    return new Response(body, { headers: { 'content-type': 'text/plain; charset=utf-8', 'cache-control': 'public, max-age=3600' } });
}
```

## OG image generation

`apps/web/app/og/job/[id]/route.tsx` (edge runtime):

```tsx
import { ImageResponse } from 'next/og';
import { db } from '@agconn/db';

export const runtime = 'edge';

export async function GET(_: Request, { params }: { params: { id: string } }) {
    const posting = await db.jobPosting.findUnique({ where: { id: params.id }, include: { employer: { include: { employerProfile: true } } } });
    if (!posting) return new Response(null, { status: 404 });

    return new ImageResponse(
        <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: 60, background: '#fff', color: '#111' }}>
            <div style={{ fontSize: 28, color: '#666' }}>{posting.county} County, CA</div>
            <div>
                <div style={{ fontSize: 56, fontWeight: 700, lineHeight: 1.1 }}>{posting.titleEn}</div>
                <div style={{ fontSize: 32, marginTop: 16 }}>{posting.employer.employerProfile.businessName}</div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                <div style={{ fontSize: 28 }}>
                    ${Number(posting.wageMin).toFixed(2)} – ${Number(posting.wageMax).toFixed(2)}/hr
                </div>
                <div style={{ fontSize: 22, color: '#666' }}>AGCONN</div>
            </div>
        </div>,
        { width: 1200, height: 630 },
    );
}
```

## Hreflang in HTML

Set via Next's `alternates.languages` in metadata; Next renders the corresponding `<link rel="alternate" hreflang="...">` tags. For locale-prefixed routes, every page MUST include both `en` and `es` alternates plus `x-default`.

## FAQ page

`apps/web/app/[locale]/faq/page.tsx` — bilingual FAQ entries from a static config file (could move to DB if frequent edits needed):

```ts
// apps/web/app/[locale]/faq/data.ts
export const faqEntries: Record<Locale, { q: string; a: string }[]> = {
    en: [
        { q: 'How do I find seasonal farm work in Fresno?', a: '...' },
        { q: 'What is a Farm Labor Contractor (FLC) license?', a: '...' },
        // ...
    ],
    es: [
        /* ES versions */
    ],
};
```

Renders the FAQ visually AND emits the `FAQPage` JSON-LD via [02-data-model.md](02-data-model.md) helper.

## Authority pages (resources)

`apps/web/app/[locale]/resources/[slug]/page.tsx` — static MDX content for now (Phase 5). Each MDX file has frontmatter with title, description, schema type. Out of scope for MVP code; structure ready for Phase 5.
