import { brandName, getSiteUrl, type Locale } from './metadata';
import type { FeaturedJob, FeaturedProgram } from '@/lib/api/landing';

const inLanguage = (locale: Locale) => (locale === 'es' ? 'es-MX' : 'en-US');

export function organizationJsonLd() {
    const base = getSiteUrl();
    return {
        '@context': 'https://schema.org',
        '@type': 'Organization',
        name: brandName(),
        url: base,
        logo: `${base}/icons/icon-512.png`,
        contactPoint: [
            {
                '@type': 'ContactPoint',
                email: 'support@agconn.com',
                contactType: 'customer support',
                availableLanguage: ['en', 'es'],
            },
        ],
        address: {
            '@type': 'PostalAddress',
            addressLocality: 'Fresno',
            addressRegion: 'CA',
            addressCountry: 'US',
        },
        areaServed: ['Fresno County', 'Tulare County', 'Kern County', 'Kings County', 'Madera County'],
    };
}

export function websiteJsonLd(locale: Locale) {
    const base = getSiteUrl();
    return {
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        name: brandName(),
        url: `${base}/${locale}`,
        inLanguage: inLanguage(locale),
        potentialAction: {
            '@type': 'SearchAction',
            target: `${base}/${locale}/jobs?q={search_term_string}`,
            'query-input': 'required name=search_term_string',
        },
    };
}

export function faqPageJsonLd(args: {
    locale: Locale;
    entries: ReadonlyArray<{ question: string; answer: string }>;
}) {
    return {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        inLanguage: inLanguage(args.locale),
        mainEntity: args.entries.map((e) => ({
            '@type': 'Question',
            name: e.question,
            acceptedAnswer: { '@type': 'Answer', text: e.answer },
        })),
    };
}

export function jobItemListJsonLd(args: { locale: Locale; jobs: FeaturedJob[] }) {
    const base = getSiteUrl();
    return {
        '@context': 'https://schema.org',
        '@type': 'ItemList',
        itemListElement: args.jobs.map((j, idx) => ({
            '@type': 'ListItem',
            position: idx + 1,
            url: `${base}/${args.locale}/jobs/${j.seoSlug ?? j.id}`,
            name: args.locale === 'es' ? j.titleEs : j.titleEn,
        })),
    };
}

export function trainingItemListJsonLd(args: { locale: Locale; programs: FeaturedProgram[] }) {
    const base = getSiteUrl();
    return {
        '@context': 'https://schema.org',
        '@type': 'ItemList',
        itemListElement: args.programs.map((p, idx) => ({
            '@type': 'ListItem',
            position: idx + 1,
            url: `${base}/${args.locale}/training/${p.seoSlug}`,
            name: args.locale === 'es' ? p.titleEs : p.titleEn,
        })),
    };
}
