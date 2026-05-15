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

export function jobPostingJsonLd(args: { locale: Locale; slug: string; job: PublicJobDetail }) {
    const base = getSiteUrl();
    const { locale, slug, job } = args;
    const title = locale === 'es' ? job.titleEs : job.titleEn;
    const description = locale === 'es' ? job.descriptionEs : job.descriptionEn;
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
        datePosted: job.publishedAt ?? job.createdAt,
        validThrough: job.applyBy ?? undefined,
        employmentType: 'SEASONAL',
        hiringOrganization: { '@type': 'Organization', name: job.employerName },
        jobLocation: {
            '@type': 'Place',
            address: {
                '@type': 'PostalAddress',
                addressLocality: job.city ?? `${job.county} County`,
                addressRegion: 'CA',
                addressCountry: 'US',
            },
        },
        baseSalary: {
            '@type': 'MonetaryAmount',
            currency: 'USD',
            value: {
                '@type': 'QuantitativeValue',
                minValue: job.wageMin,
                maxValue: job.wageMax,
                unitText: job.wageUnit.toUpperCase(),
            },
        },
        industry: 'Agriculture',
        inLanguage: inLanguage(locale),
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
