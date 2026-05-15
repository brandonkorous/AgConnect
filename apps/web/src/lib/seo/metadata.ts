import type { Metadata } from 'next';

export type Locale = 'en' | 'es';

const DEFAULT_BASE = 'https://agconn.com';

function siteUrl(): string {
    return (process.env.NEXT_PUBLIC_SITE_URL ?? DEFAULT_BASE).replace(/\/$/, '');
}

export function brandName(): string {
    return process.env.NEXT_PUBLIC_BRAND_NAME ?? 'AGCONN';
}

type LocalizedPath = (locale: Locale) => string;

const samePath = (path: string): LocalizedPath => () => path;

interface MarketingMetadataInput {
    locale: Locale;
    title: string;
    description: string;
    pathByLocale: LocalizedPath;
    ogPath?: string;
    keywords?: string[];
    noIndex?: boolean;
}

export function marketingMetadata(args: MarketingMetadataInput): Metadata {
    const base = siteUrl();
    const path = args.pathByLocale(args.locale);
    const enPath = args.pathByLocale('en');
    const esPath = args.pathByLocale('es');
    const ogImage = `${base}${args.ogPath ?? `/og/landing?locale=${args.locale}`}`;
    return {
        title: args.title,
        description: args.description.slice(0, 160),
        keywords: args.keywords,
        alternates: {
            canonical: `${base}${path}`,
            languages: {
                en: `${base}${enPath}`,
                es: `${base}${esPath}`,
                'x-default': `${base}${esPath}`,
            },
        },
        openGraph: {
            title: args.title,
            description: args.description,
            url: `${base}${path}`,
            siteName: brandName(),
            images: [{ url: ogImage, width: 1200, height: 630 }],
            locale: args.locale === 'es' ? 'es_MX' : 'en_US',
            type: 'website',
        },
        twitter: { card: 'summary_large_image', title: args.title, description: args.description, images: [ogImage] },
        robots: args.noIndex ? { index: false, follow: false } : { index: true, follow: true },
    };
}

export function landingMetadata(input: { locale: Locale; title: string; description: string }): Metadata {
    return marketingMetadata({ ...input, pathByLocale: (l) => `/${l}` });
}

export function faqMetadata(input: { locale: Locale; title: string; description: string }): Metadata {
    return marketingMetadata({ ...input, pathByLocale: (l) => `/${l}/faq` });
}

export function impactMetadata(input: { locale: Locale; title: string; description: string }): Metadata {
    return marketingMetadata({ ...input, pathByLocale: (l) => `/${l}/impact` });
}

export function resourcesMetadata(input: { locale: Locale; title: string; description: string }): Metadata {
    return marketingMetadata({ ...input, pathByLocale: (l) => `/${l}/resources` });
}

export const samePathFor = samePath;
export const getSiteUrl = siteUrl;
