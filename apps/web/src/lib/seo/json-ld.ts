import { brandName, getSiteUrl, type Locale } from './metadata';
import type { FeaturedJob, FeaturedProgram } from '@/lib/api/landing';
import type { PublicJobDetail } from '@/lib/api/public-jobs';

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
            {
                '@type': 'ContactPoint',
                email: 'partnerships@agconn.com',
                contactType: 'sales',
                availableLanguage: ['en', 'es'],
            },
            {
                '@type': 'ContactPoint',
                email: 'press@agconn.com',
                contactType: 'press',
                availableLanguage: ['en', 'es'],
            },
            {
                '@type': 'ContactPoint',
                email: 'security@agconn.com',
                contactType: 'security',
                availableLanguage: ['en', 'es'],
            },
        ],
        address: {
            '@type': 'PostalAddress',
            addressLocality: 'Visalia',
            addressRegion: 'CA',
            addressCountry: 'US',
        },
        areaServed: ['Fresno County', 'Tulare County', 'Kern County', 'Kings County', 'Madera County'],
    };
}

export function impactDatasetJsonLd(args: {
    locale: Locale;
    generatedAt: string;
    windowMonths: number;
}) {
    const base = getSiteUrl();
    const apiBase =
        process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, '') ??
        base.replace('://', '://api.');
    const name =
        args.locale === 'es'
            ? 'AGCONN Panel de impacto público'
            : 'AGCONN public impact dashboard';
    const description =
        args.locale === 'es'
            ? `Colocaciones, salarios medianos, capacitaciones completadas y empleadores verificados de AGCONN en el Valle Central de California. Ventana móvil de ${args.windowMonths} meses, refrescado todas las noches, alineado con WIOA.`
            : `AGCONN placements, median wages, training completions, and verified employers in the California Central Valley. Trailing ${args.windowMonths}-month window, refreshed nightly, WIOA-aligned.`;
    return {
        '@context': 'https://schema.org',
        '@type': 'Dataset',
        name,
        description,
        url: `${base}/${args.locale}/impact`,
        identifier: `${base}/${args.locale}/impact`,
        inLanguage: inLanguage(args.locale),
        license: 'https://creativecommons.org/licenses/by/4.0/',
        creator: {
            '@type': 'Organization',
            name: 'AGCONN',
            url: base,
        },
        publisher: {
            '@type': 'Organization',
            name: 'AGCONN',
            url: base,
        },
        temporalCoverage: `P${args.windowMonths}M`,
        spatialCoverage: {
            '@type': 'Place',
            name: 'Central Valley, California, United States',
            geo: {
                '@type': 'GeoShape',
                addressCountry: 'US',
                addressRegion: 'CA',
            },
            containsPlace: [
                'Fresno County, CA',
                'Tulare County, CA',
                'Kern County, CA',
                'Kings County, CA',
                'Madera County, CA',
            ],
        },
        dateModified: args.generatedAt,
        keywords: [
            'farmworker placements',
            'agricultural wages',
            'CDFA training',
            'WIOA',
            'Central Valley',
            'verified employers',
        ],
        distribution: [
            {
                '@type': 'DataDownload',
                encodingFormat: 'application/json',
                contentUrl: `${apiBase}/v1/landing/impact`,
            },
        ],
    };
}

export type BreadcrumbTrail = ReadonlyArray<{ name: string; path: string }>;

export function breadcrumbJsonLd(args: { locale: Locale; trail: BreadcrumbTrail }) {
    const base = getSiteUrl();
    return {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        inLanguage: inLanguage(args.locale),
        itemListElement: args.trail.map((node, idx) => ({
            '@type': 'ListItem',
            position: idx + 1,
            name: node.name,
            item: `${base}/${args.locale}${node.path === '/' ? '' : node.path}`,
        })),
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

function wageUnitText(unit: string): string {
    const u = unit.toLowerCase();
    if (u === 'hour') return 'HOUR';
    if (u === 'day') return 'DAY';
    if (u === 'week') return 'WEEK';
    if (u === 'piece') return 'PIECE';
    return unit.toUpperCase();
}

const VALID_THROUGH_DEFAULT_DAYS = 30;

function defaultValidThrough(datePosted: string): string {
    const d = new Date(datePosted);
    if (Number.isNaN(d.getTime())) return datePosted;
    d.setUTCDate(d.getUTCDate() + VALID_THROUGH_DEFAULT_DAYS);
    return d.toISOString();
}

export function jobPostingJsonLd(args: { locale: Locale; slug: string; job: PublicJobDetail }) {
    const base = getSiteUrl();
    const { locale, slug, job } = args;
    const title = locale === 'es' ? job.titleEs : job.titleEn;
    const description = locale === 'es' ? job.descriptionEs : job.descriptionEn;
    const datePosted = job.publishedAt ?? job.createdAt;
    const validThrough = job.applyBy ?? defaultValidThrough(datePosted);
    const benefits = [
        job.housing ? (locale === 'es' ? 'Vivienda proporcionada' : 'Housing provided') : null,
        job.transport ? (locale === 'es' ? 'Transporte proporcionado' : 'Transportation provided') : null,
    ]
        .filter(Boolean)
        .join(', ');
    return {
        '@context': 'https://schema.org',
        '@type': 'JobPosting',
        title,
        description: description || `${job.employerName} hiring ${title}.`,
        identifier: {
            '@type': 'PropertyValue',
            name: 'AGCONN',
            value: job.seoSlug || job.id,
        },
        datePosted,
        validThrough,
        employmentType: ['SEASONAL', 'TEMPORARY'],
        hiringOrganization: {
            '@type': 'Organization',
            name: job.employerName,
            sameAs: `${base}/${locale}/jobs/${slug}`,
        },
        jobLocation: {
            '@type': 'Place',
            address: {
                '@type': 'PostalAddress',
                addressLocality: job.city ?? `${job.county} County`,
                addressRegion: 'CA',
                addressCountry: 'US',
            },
        },
        applicantLocationRequirements: {
            '@type': 'Country',
            name: 'US',
        },
        baseSalary: {
            '@type': 'MonetaryAmount',
            currency: 'USD',
            value: {
                '@type': 'QuantitativeValue',
                minValue: job.wageMin,
                maxValue: job.wageMax,
                unitText: wageUnitText(job.wageUnit),
            },
        },
        industry: 'Agriculture',
        occupationalCategory: '45-2092 Farmworkers and Laborers, Crop',
        inLanguage: inLanguage(locale),
        directApply: true,
        ...(job.skills && job.skills.length ? { skills: job.skills.join(', ') } : {}),
        ...(benefits ? { jobBenefits: benefits } : {}),
        url: `${base}/${locale}/jobs/${slug}`,
    };
}

// Training detail page. Uses EducationalOccupationalProgram (vs. Course) per
// the Phase 3 spec — funder-facing programs report against this schema.
export type TrainingDetailForJsonLd = {
    titleEn: string;
    titleEs: string;
    descriptionEn: string | null;
    descriptionEs: string | null;
    seoSlug: string;
    funder: string;
    orgName: string;
    durationHours?: number | null;
    occupationalCredentialAwarded?: string | null;
};

export function educationalOccupationalProgramJsonLd(args: {
    locale: Locale;
    program: TrainingDetailForJsonLd;
}) {
    const base = getSiteUrl();
    const { locale, program } = args;
    const title = locale === 'es' ? program.titleEs : program.titleEn;
    const description = locale === 'es' ? program.descriptionEs : program.descriptionEn;
    return {
        '@context': 'https://schema.org',
        '@type': 'EducationalOccupationalProgram',
        name: title,
        description: description ?? title,
        provider: { '@type': 'Organization', name: program.orgName },
        ...(program.funder
            ? { sponsor: { '@type': 'Organization', name: program.funder } }
            : {}),
        ...(typeof program.durationHours === 'number' && program.durationHours > 0
            ? { timeRequired: `PT${program.durationHours}H` }
            : {}),
        ...(program.occupationalCredentialAwarded
            ? { occupationalCredentialAwarded: program.occupationalCredentialAwarded }
            : {}),
        educationalProgramMode: 'in-person',
        inLanguage: inLanguage(locale),
        url: `${base}/${locale}/training/${program.seoSlug}`,
    };
}
