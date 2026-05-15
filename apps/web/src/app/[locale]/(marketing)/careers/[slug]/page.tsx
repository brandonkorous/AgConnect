import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import Link from 'next/link';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft, faArrowRight, faCheck, faEnvelope } from '@fortawesome/free-solid-svg-icons';
import { EyebrowLabel } from '@/components/primitives/EyebrowLabel';
import { JsonLd } from '@/components/seo/JsonLd';
import { NestedBreadcrumb } from '@/components/seo/Breadcrumb';
import { marketingMetadata } from '@/lib/seo/metadata';
import { organizationJsonLd } from '@/lib/seo/json-ld';
import {
    getAllCareerSlugs,
    getCareerRoleBySlug,
    getAllCareerRoles,
} from '@/content/careers';
import { pickLocale, type Locale } from '@/content/types';

type RouteProps = { params: Promise<{ locale: Locale; slug: string }> };

export const dynamicParams = false;
export const revalidate = 86400;

export function generateStaticParams() {
    const slugs = getAllCareerSlugs();
    return slugs.flatMap((slug) => [
        { locale: 'en', slug },
        { locale: 'es', slug },
    ]);
}

export async function generateMetadata({ params }: RouteProps) {
    const { locale, slug } = await params;
    const role = getCareerRoleBySlug(slug);
    if (!role) return {};
    return marketingMetadata({
        locale,
        title: pickLocale(role.title, locale),
        description: pickLocale(role.summary, locale),
        pathByLocale: (l) => `/${l}/careers/${slug}`,
    });
}

function formatDate(iso: string, locale: Locale): string {
    const fmt = new Intl.DateTimeFormat(locale === 'es' ? 'es-MX' : 'en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });
    return fmt.format(new Date(iso));
}

export default async function CareerRolePage({ params }: RouteProps) {
    const { locale, slug } = await params;
    const role = getCareerRoleBySlug(slug);
    if (!role) notFound();

    const t = await getTranslations({ locale, namespace: 'marketing.careers' });
    const others = getAllCareerRoles().filter((r) => r.slug !== slug).slice(0, 3);
    const applyMailto = `mailto:careers@agconn.com?subject=${encodeURIComponent(`Application — ${pickLocale(role.title, locale)}`)}`;

    return (
        <>
            <JsonLd data={organizationJsonLd()} />
            <NestedBreadcrumb
                locale={locale}
                parentPath="/careers"
                leafName={pickLocale(role.title, locale)}
                leafPath={`/careers/${slug}`}
            />
            <JsonLd
                data={{
                    '@context': 'https://schema.org',
                    '@type': 'JobPosting',
                    title: pickLocale(role.title, locale),
                    description: pickLocale(role.summary, locale),
                    datePosted: role.postedAt,
                    employmentType: role.employmentType.toUpperCase(),
                    inLanguage: locale === 'es' ? 'es-MX' : 'en-US',
                    hiringOrganization: {
                        '@type': 'Organization',
                        name: 'AGCONN',
                        sameAs: 'https://agconn.com',
                    },
                    jobLocation: { '@type': 'Place', address: role.location },
                    baseSalary: {
                        '@type': 'MonetaryAmount',
                        currency: 'USD',
                        value: { '@type': 'QuantitativeValue', name: role.salaryRange, unitText: 'YEAR' },
                    },
                }}
            />

            <article>
                <header className="bg-base-100 w-full">
                    <div className="container mx-auto px-5 pt-16 pb-12 md:px-8 md:pt-20 md:pb-16 lg:px-20 lg:pt-24 lg:pb-20">
                        <Link
                            href={`/${locale}/careers`}
                            className="text-secondary hover:text-base-content mb-8 inline-flex items-center gap-2 font-sans text-sm font-medium"
                        >
                            <FontAwesomeIcon icon={faArrowLeft} className="text-xs" />
                            <span>{t('detail.back_to_list')}</span>
                        </Link>

                        <div className="grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.45fr)] lg:gap-16">
                            <div className="flex flex-col gap-6">
                                <EyebrowLabel tone="soil" withRule>
                                    {t(`teams.${role.team}`)}
                                </EyebrowLabel>
                                <h1 className="text-base-content font-serif text-4xl font-semibold leading-[1.1] tracking-tight md:text-5xl lg:text-6xl">
                                    {pickLocale(role.title, locale)}
                                </h1>
                                <p className="text-base-content max-w-prose font-sans text-lg leading-relaxed">
                                    {pickLocale(role.summary, locale)}
                                </p>
                            </div>
                            <aside className="border-secondary/20 bg-base-200 flex flex-col gap-0 self-start border lg:p-2">
                                <dl className="border-secondary/15 grid grid-cols-1 divide-y divide-secondary/15">
                                    {[
                                        { label: t('detail.team_label'), value: t(`teams.${role.team}`) },
                                        { label: t('detail.location_label'), value: role.location },
                                        { label: t('detail.employment_label'), value: t(`employment.${role.employmentType}`) },
                                        { label: t('detail.salary_label'), value: role.salaryRange },
                                        { label: t('openings.posted', { date: formatDate(role.postedAt, locale) }).replace(/^[^:]+:?\s*/, ''), value: formatDate(role.postedAt, locale), hideLabel: true },
                                    ].slice(0, 4).map((item) => (
                                        <div key={item.label} className="flex flex-col gap-1 px-6 py-4 lg:px-6">
                                            <dt className="text-secondary font-mono text-xs font-bold uppercase tracking-[0.18em]">
                                                {item.label}
                                            </dt>
                                            <dd className="text-base-content font-sans text-base font-semibold">
                                                {item.value}
                                            </dd>
                                        </div>
                                    ))}
                                </dl>
                                <a
                                    href={applyMailto}
                                    className="btn btn-primary m-2 mt-3"
                                >
                                    <FontAwesomeIcon icon={faEnvelope} className="text-sm" />
                                    <span>{t('detail.apply_cta')}</span>
                                </a>
                            </aside>
                        </div>
                    </div>
                </header>

                <div className="bg-base-100 w-full border-secondary/15 border-t">
                    <div className="container mx-auto px-5 py-16 md:px-8 md:py-20 lg:px-20 lg:py-24">
                        <div className="flex flex-col gap-16 max-w-prose">
                            <section className="flex flex-col gap-6">
                                <h2 className="text-base-content font-serif text-2xl font-medium leading-tight tracking-tight md:text-3xl">
                                    {t('detail.responsibilities')}
                                </h2>
                                <ul className="flex flex-col gap-4">
                                    {role.responsibilities.map((r, i) => (
                                        <li key={i} className="flex items-start gap-3">
                                            <FontAwesomeIcon
                                                icon={faCheck}
                                                className="text-primary mt-1.5 text-sm shrink-0"
                                            />
                                            <span className="text-base-content font-sans text-base leading-relaxed">
                                                {pickLocale(r, locale)}
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                            </section>

                            <section className="flex flex-col gap-6">
                                <h2 className="text-base-content font-serif text-2xl font-medium leading-tight tracking-tight md:text-3xl">
                                    {t('detail.qualifications')}
                                </h2>
                                <ul className="flex flex-col gap-4">
                                    {role.qualifications.map((q, i) => (
                                        <li key={i} className="flex items-start gap-3">
                                            <FontAwesomeIcon
                                                icon={faCheck}
                                                className="text-primary mt-1.5 text-sm shrink-0"
                                            />
                                            <span className="text-base-content font-sans text-base leading-relaxed">
                                                {pickLocale(q, locale)}
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                            </section>

                            {role.niceToHave && role.niceToHave.length > 0 ? (
                                <section className="flex flex-col gap-6">
                                    <h2 className="text-base-content font-serif text-2xl font-medium leading-tight tracking-tight md:text-3xl">
                                        {t('detail.nice_to_have')}
                                    </h2>
                                    <ul className="flex flex-col gap-4">
                                        {role.niceToHave.map((n, i) => (
                                            <li key={i} className="flex items-start gap-3">
                                                <span className="bg-accent mt-2 size-1.5 shrink-0 rounded-full" aria-hidden />
                                                <span className="text-base-content font-sans text-base leading-relaxed">
                                                    {pickLocale(n, locale)}
                                                </span>
                                            </li>
                                        ))}
                                    </ul>
                                </section>
                            ) : null}
                        </div>
                    </div>
                </div>

                <section className="bg-primary text-primary-content w-full">
                    <div className="container mx-auto grid grid-cols-1 gap-10 px-5 py-20 md:px-8 md:py-24 lg:grid-cols-[minmax(0,0.55fr)_minmax(0,1fr)] lg:px-20 lg:gap-20 lg:py-28">
                        <div className="flex flex-col gap-4">
                            <span className="text-accent font-mono text-xs font-bold uppercase tracking-[0.22em]">
                                {t('detail.apply_eyebrow')}
                            </span>
                            <h2 className="text-primary-content font-serif text-3xl font-medium leading-tight tracking-tight md:text-4xl lg:text-5xl">
                                {t('detail.apply_headline')}
                            </h2>
                        </div>
                        <div className="flex flex-col gap-6 lg:pt-2">
                            <p className="text-primary-content/85 max-w-prose font-sans text-base leading-relaxed">
                                {t('detail.apply_body')}
                            </p>
                            <a href={applyMailto} className="btn btn-accent self-start">
                                <FontAwesomeIcon icon={faEnvelope} className="text-sm" />
                                <span>{t('detail.apply_cta')}</span>
                            </a>
                            <p className="text-primary-content/65 mt-4 max-w-prose font-sans text-xs leading-relaxed">
                                {t('detail.equal_opportunity')}
                            </p>
                        </div>
                    </div>
                </section>
            </article>

            {others.length > 0 ? (
                <section className="bg-base-200 w-full border-secondary/15 border-t">
                    <div className="container mx-auto flex flex-col gap-10 px-5 py-20 md:px-8 md:py-24 lg:px-20 lg:py-28">
                        <div className="flex flex-col gap-3">
                            <EyebrowLabel tone="soil" withRule>
                                {t('openings.eyebrow')}
                            </EyebrowLabel>
                            <h2 className="text-base-content font-serif text-3xl font-medium leading-tight tracking-tight md:text-4xl">
                                {t('openings.headline')}
                            </h2>
                        </div>
                        <ul className="grid grid-cols-1 gap-px bg-secondary/15 md:grid-cols-3">
                            {others.map((r) => (
                                <li key={r.slug} className="bg-base-100">
                                    <Link
                                        href={`/${locale}/careers/${r.slug}`}
                                        className="group flex h-full flex-col gap-3 p-8 lg:p-10"
                                    >
                                        <span className="text-secondary font-mono text-xs font-bold uppercase tracking-[0.22em]">
                                            {t(`teams.${r.team}`)}
                                        </span>
                                        <h3 className="text-base-content font-serif text-lg font-medium leading-tight tracking-tight group-hover:text-primary transition-colors">
                                            {pickLocale(r.title, locale)}
                                        </h3>
                                        <span className="text-secondary font-mono text-xs uppercase tracking-[0.18em]">
                                            {r.location}
                                        </span>
                                        <span className="text-primary mt-auto inline-flex items-center gap-2 self-start font-sans text-sm font-semibold">
                                            <span>{t('openings.see_role')}</span>
                                            <FontAwesomeIcon icon={faArrowRight} className="text-xs transition-transform group-hover:translate-x-1" />
                                        </span>
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>
                </section>
            ) : null}
        </>
    );
}
