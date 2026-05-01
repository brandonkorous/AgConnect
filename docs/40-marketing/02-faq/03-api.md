# 02 — FAQ: API

The standalone FAQ page is fully static — no API calls. Content comes from i18n keys at build time.

## Routes

No backend endpoints. The page is RSC-rendered from static config.

## Page integration

```tsx
// apps/web/src/app/[locale]/(marketing)/faq/page.tsx
import { getTranslations } from 'next-intl/server';
import { faqMetadata } from '@/lib/seo/metadata';
import { faqPageJsonLd } from '@/lib/seo/json-ld';
import { FAQ_IDS, FAQ_EXTRA_IDS } from '../_data/faq';
import { FaqAccordion } from '@/components/landing/FaqAccordion';

export const dynamicParams = false;
export const revalidate = 86400; // 1 day

export async function generateMetadata({ params }: { params: Promise<{ locale: 'en' | 'es' }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'marketing.faq_page' });
  return faqMetadata({ locale, title: t('meta.title'), description: t('meta.description') });
}

export default async function FaqPage({ params }: { params: Promise<{ locale: 'en' | 'es' }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale });

  const entries = [
    ...FAQ_IDS.map((id) => ({ id, question: t(`landing.faq.${id}.question`), answer: t(`landing.faq.${id}.answer`) })),
    ...FAQ_EXTRA_IDS.map((id) => ({ id, question: t(`marketing.faq_extras.${id}.question`), answer: t(`marketing.faq_extras.${id}.answer`) })),
  ];
  const jsonLd = faqPageJsonLd({ entries, locale });

  return (
    <>
      <script type='application/ld+json' dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <FaqAccordion entries={entries} initialOpen={[]} />
    </>
  );
}
```

## JSON-LD

The page emits a single `FAQPage` schema covering every entry:

```ts
{
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  inLanguage: locale === 'es' ? 'es-MX' : 'en-US',
  mainEntity: entries.map((e) => ({
    '@type': 'Question',
    name: e.question,
    acceptedAnswer: { '@type': 'Answer', text: e.answer },
  })),
}
```

> **Inferred:** Strip Markdown / HTML from `answer` text before stringifying — `Answer.text` should be plain or HTML-escaped per [Google's FAQPage guidelines](https://developers.google.com/search/docs/appearance/structured-data/faqpage). Source answers are plain text in the i18n files; if HTML lands in v2, add a sanitizer.

## Metadata

```ts
// packages/shared-types/src/seo/metadata.ts (added)
export function faqMetadata(args: { locale: Locale; title: string; description: string }): Metadata {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://agconn.com';
  const path = '/faq';
  return {
    title: args.title,
    description: args.description.slice(0, 160),
    alternates: {
      canonical: `${baseUrl}/${args.locale}${path}`,
      languages: {
        en: `${baseUrl}/en${path}`,
        es: `${baseUrl}/es${path}`,
        'x-default': `${baseUrl}/es${path}`,
      },
    },
    openGraph: {
      title: args.title,
      description: args.description,
      url: `${baseUrl}/${args.locale}${path}`,
      siteName: 'AgConn',
      images: [{ url: `${baseUrl}/og/landing?locale=${args.locale}`, width: 1200, height: 630 }],
      locale: args.locale === 'es' ? 'es_MX' : 'en_US',
      type: 'website',
    },
    twitter: { card: 'summary_large_image' },
    robots: { index: true, follow: true },
  };
}
```

> **Inferred:** `/faq` reuses `/og/landing` for OG image. A dedicated `/og/faq` is overkill — the FAQ page shares the brand identity with landing, and Twitter/LinkedIn cache OG images aggressively, so a single image per locale is faster to invalidate.

## Sitemap

The sitemap (`apps/web/src/app/sitemap.ts`) adds entries for `/en/faq` and `/es/faq`, weekly change-frequency, priority 0.8.

## Errors

N/A — static page, no error states.
