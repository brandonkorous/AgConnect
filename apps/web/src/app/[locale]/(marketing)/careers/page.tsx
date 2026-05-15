import { getTranslations } from 'next-intl/server';
import Link from 'next/link';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faArrowRight,
    faLanguage,
    faMapPin,
    faDollarSign,
    faBriefcase,
    faLocationDot,
} from '@fortawesome/free-solid-svg-icons';
import { EyebrowLabel } from '@/components/primitives/EyebrowLabel';
import { JsonLd } from '@/components/seo/JsonLd';
import { marketingMetadata } from '@/lib/seo/metadata';
import { organizationJsonLd } from '@/lib/seo/json-ld';
import { MarketingPageHero } from '@/components/marketing/MarketingPageHero';
import { WaitlistForm } from '@/components/landing/WaitlistForm';
import { getAllCareerRoles } from '@/content/careers';
import { pickLocale, type Locale } from '@/content/types';

type RouteProps = { params: Promise<{ locale: Locale }> };

export const dynamicParams = false;
export const revalidate = 86400;

export async function generateMetadata({ params }: RouteProps) {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: 'marketing.careers' });
    return marketingMetadata({
        locale,
        title: t('meta.title'),
        description: t('meta.description'),
        pathByLocale: (l) => `/${l}/careers`,
    });
}

const VALUES = [
    { id: 'bilingual', icon: faLanguage },
    { id: 'local', icon: faMapPin },
    { id: 'transparent', icon: faDollarSign },
] as const;

function formatDate(iso: string, locale: Locale): string {
    const fmt = new Intl.DateTimeFormat(locale === 'es' ? 'es-MX' : 'en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    });
    return fmt.format(new Date(iso));
}

export default async function CareersPage({ params }: RouteProps) {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: 'marketing.careers' });
    const resourcesT = await getTranslations({ locale, namespace: 'marketing.resources' });
    const roles = getAllCareerRoles();

    return (
        <>
            <JsonLd data={organizationJsonLd()} />
            {roles.length > 0 ? (
                <JsonLd
                    data={{
                        '@context': 'https://schema.org',
                        '@type': 'ItemList',
                        itemListElement: roles.map((r, i) => ({
                            '@type': 'ListItem',
                            position: i + 1,
                            item: {
                                '@type': 'JobPosting',
                                title: pickLocale(r.title, locale),
                                description: pickLocale(r.summary, locale),
                                datePosted: r.postedAt,
                                employmentType: r.employmentType.toUpperCase(),
                                jobLocation: { '@type': 'Place', address: r.location },
                                hiringOrganization: {
                                    '@type': 'Organization',
                                    name: 'AGCONN',
                                    sameAs: 'https://agconn.com',
                                },
                            },
                        })),
                    }}
                />
            ) : null}

            <MarketingPageHero eyebrow={t('eyebrow')} headline={t('headline')} intro={t('intro')} />

            <section className="bg-base-200 w-full border-secondary/15 border-t">
                <div className="container mx-auto flex flex-col gap-12 px-5 py-20 md:px-8 md:py-24 lg:px-20 lg:py-28">
                    <div className="flex flex-col gap-4">
                        <EyebrowLabel tone="soil" withRule>
                            {t('openings.eyebrow')}
                        </EyebrowLabel>
                        <div className="flex flex-wrap items-end justify-between gap-6">
                            <h2 className="text-base-content font-serif text-3xl font-medium leading-tight tracking-tight md:text-4xl lg:text-5xl">
                                {t('openings.headline')}
                            </h2>
                            <p className="text-secondary max-w-md font-sans text-base leading-relaxed">
                                {t('openings.intro')}
                            </p>
                        </div>
                    </div>

                    {roles.length === 0 ? (
                        <p className="text-secondary font-sans text-base">{t('openings.empty')}</p>
                    ) : (
                        <ul className="border-secondary/20 flex flex-col border-y">
                            {roles.map((r) => (
                                <li key={r.slug} className="border-secondary/15 border-b last:border-b-0">
                                    <Link
                                        href={`/${locale}/careers/${r.slug}`}
                                        className="group flex flex-col gap-4 py-8 md:flex-row md:items-start md:gap-12 md:py-10"
                                    >
                                        <div className="flex flex-col gap-1 md:w-44 md:shrink-0">
                                            <span className="text-secondary font-mono text-xs font-bold uppercase tracking-[0.22em]">
                                                {t(`teams.${r.team}`)}
                                            </span>
                                            <span className="text-secondary/80 font-mono text-xs uppercase tracking-[0.18em]">
                                                {t('openings.posted', { date: formatDate(r.postedAt, locale) })}
                                            </span>
                                        </div>
                                        <div className="flex flex-1 flex-col gap-3">
                                            <h3 className="text-base-content font-serif text-xl font-medium leading-tight tracking-tight md:text-2xl group-hover:text-primary transition-colors">
                                                {pickLocale(r.title, locale)}
                                            </h3>
                                            <p className="text-secondary font-sans text-base leading-relaxed">
                                                {pickLocale(r.summary, locale)}
                                            </p>
                                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-secondary font-mono text-xs uppercase tracking-[0.18em]">
                                                <span className="inline-flex items-center gap-1.5">
                                                    <FontAwesomeIcon icon={faLocationDot} className="text-[10px]" />
                                                    {r.location}
                                                </span>
                                                <span aria-hidden className="opacity-50">·</span>
                                                <span className="inline-flex items-center gap-1.5">
                                                    <FontAwesomeIcon icon={faBriefcase} className="text-[10px]" />
                                                    {t(`employment.${r.employmentType}`)}
                                                </span>
                                                <span aria-hidden className="opacity-50">·</span>
                                                <span className="text-base-content font-bold">{r.salaryRange}</span>
                                            </div>
                                            <span className="text-primary inline-flex items-center gap-2 font-sans text-sm font-semibold pt-1">
                                                <span>{t('openings.see_role')}</span>
                                                <FontAwesomeIcon icon={faArrowRight} className="text-xs transition-transform group-hover:translate-x-1" />
                                            </span>
                                        </div>
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </section>

            <section className="bg-base-100 w-full">
                <div className="container mx-auto flex flex-col gap-12 px-5 py-20 md:px-8 md:py-24 lg:px-20 lg:py-28">
                    <div className="flex flex-col gap-4">
                        <EyebrowLabel tone="soil" withRule>
                            {t('values.eyebrow')}
                        </EyebrowLabel>
                        <h2 className="text-base-content font-serif text-3xl font-medium leading-tight tracking-tight md:text-4xl lg:text-5xl">
                            {t('values.headline')}
                        </h2>
                    </div>
                    <div className="grid grid-cols-1 gap-px bg-secondary/15 md:grid-cols-3">
                        {VALUES.map((v) => (
                            <article key={v.id} className="bg-base-100 flex flex-col gap-4 p-8 lg:p-10">
                                <FontAwesomeIcon icon={v.icon} className="text-primary text-2xl" />
                                <h3 className="text-base-content font-serif text-xl font-semibold leading-tight tracking-tight">
                                    {t(`values.${v.id}.title`)}
                                </h3>
                                <p className="text-secondary font-sans text-sm leading-relaxed">
                                    {t(`values.${v.id}.body`)}
                                </p>
                            </article>
                        ))}
                    </div>
                </div>
            </section>

            <section className="bg-base-200 w-full border-secondary/15 border-t">
                <div className="container mx-auto grid grid-cols-1 gap-12 px-5 py-20 md:px-8 md:py-24 lg:grid-cols-2 lg:px-20 lg:gap-20 lg:py-28">
                    <div className="flex flex-col gap-4">
                        <EyebrowLabel tone="soil" withRule>
                            {t('subscribe.eyebrow')}
                        </EyebrowLabel>
                        <h2 className="text-base-content font-serif text-3xl font-medium leading-tight tracking-tight md:text-4xl lg:text-5xl">
                            {t('subscribe.headline')}
                        </h2>
                        <p className="text-base-content max-w-prose font-sans text-base leading-relaxed">
                            {t('subscribe.body')}
                        </p>
                        <p className="text-secondary mt-2 font-mono text-xs uppercase tracking-[0.18em]">
                            {t('subscribe.unsubscribe')}
                        </p>
                    </div>
                    <div className="flex flex-col gap-4 self-end">
                        <div className="border-secondary/20 bg-base-100 border p-6 lg:p-8">
                            <WaitlistForm
                                audience="worker"
                                title=""
                                inputLabel={resourcesT('form_label')}
                                inputPlaceholder={resourcesT('form_placeholder')}
                                ctaText={resourcesT('form_cta')}
                                helpText={resourcesT('form_help')}
                                successText={resourcesT('form_success')}
                            />
                        </div>
                    </div>
                </div>
            </section>
        </>
    );
}
