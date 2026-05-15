import { getTranslations } from 'next-intl/server';
import Link from 'next/link';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowRight, faBookmark } from '@fortawesome/free-solid-svg-icons';
import { EyebrowLabel } from '@/components/primitives/EyebrowLabel';
import { JsonLd } from '@/components/seo/JsonLd';
import { Breadcrumb } from '@/components/seo/Breadcrumb';
import { resourcesMetadata } from '@/lib/seo/metadata';
import { organizationJsonLd } from '@/lib/seo/json-ld';
import { WaitlistForm } from '@/components/landing/WaitlistForm';
import { getAllResources, RESOURCE_CATEGORIES } from '@/content/resources';
import { pickLocale } from '@/content/types';

type Locale = 'en' | 'es';
type RouteProps = { params: Promise<{ locale: Locale }> };

export const dynamicParams = false;
export const revalidate = 86400;

export async function generateMetadata({ params }: RouteProps) {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: 'marketing.resources' });
    const base = resourcesMetadata({ locale, title: t('meta.title'), description: t('meta.description') });
    return {
        ...base,
        alternates: {
            ...(base.alternates ?? {}),
            types: {
                'application/rss+xml': `/${locale}/resources/feed.xml`,
            },
        },
    };
}

export default async function ResourcesPage({ params }: RouteProps) {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: 'marketing.resources' });
    const all = getAllResources();
    const [feature, ...rest] = all;
    const grouped = RESOURCE_CATEGORIES.map((cat) => ({
        category: cat,
        articles: rest.filter((a) => a.category === cat),
    }));

    return (
        <>
            <JsonLd data={organizationJsonLd()} />
            <Breadcrumb locale={locale} path="/resources" />

            <section className="bg-base-100 w-full">
                <div className="container mx-auto px-5 pt-20 pb-16 md:px-8 md:pt-24 md:pb-20 lg:px-20 lg:pt-32 lg:pb-24">
                    <div className="flex flex-col gap-6 max-w-3xl">
                        <EyebrowLabel tone="soil" withRule>
                            {t('eyebrow')}
                        </EyebrowLabel>
                        <h1 className="text-base-content font-serif text-5xl font-semibold leading-[1.05] tracking-tight md:text-6xl lg:text-[80px]">
                            {t('headline')}
                        </h1>
                        <p className="text-base-content max-w-prose font-sans text-lg leading-relaxed">
                            {t('intro')}
                        </p>
                        <div className="mt-2 flex flex-wrap items-center gap-3">
                            <span className="bg-accent inline-block size-2 shrink-0 rounded-full" aria-hidden />
                            <span className="text-secondary font-mono text-xs uppercase tracking-[0.18em]">
                                {t('cadence_label')}
                            </span>
                        </div>
                    </div>
                </div>
            </section>

            {feature ? (
                <section className="bg-primary text-primary-content w-full">
                    <div className="container mx-auto px-5 py-20 md:px-8 md:py-24 lg:px-20 lg:py-28">
                        <Link
                            href={`/${locale}/resources/${feature.slug}`}
                            className="group grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,0.55fr)_minmax(0,1fr)] lg:items-center lg:gap-20"
                        >
                            <div className="flex flex-col gap-4">
                                <span className="text-accent font-mono text-xs font-bold uppercase tracking-[0.22em]">
                                    {t(`categories.${feature.category}.label`)}
                                </span>
                                <span className="text-primary-content/70 font-mono text-xs uppercase tracking-[0.18em]">
                                    {t('card.minutes', { n: feature.readingMinutes })}
                                </span>
                            </div>
                            <div className="flex flex-col gap-6">
                                <h2 className="text-primary-content font-serif text-3xl font-medium leading-tight tracking-tight md:text-4xl lg:text-5xl group-hover:text-accent transition-colors">
                                    {pickLocale(feature.title, locale)}
                                </h2>
                                <p className="text-primary-content/85 max-w-prose font-sans text-base leading-relaxed">
                                    {pickLocale(feature.summary, locale)}
                                </p>
                                <span className="text-accent inline-flex items-center gap-2 font-sans text-base font-semibold">
                                    <span>{t('card.read_article')}</span>
                                    <FontAwesomeIcon icon={faArrowRight} className="text-sm transition-transform group-hover:translate-x-1" />
                                </span>
                            </div>
                        </Link>
                    </div>
                </section>
            ) : null}

            <section className="bg-base-100 w-full">
                <div className="container mx-auto flex flex-col gap-20 px-5 py-20 md:px-8 md:py-24 lg:px-20 lg:py-28">
                    {grouped.map(({ category, articles }) => (
                        <div key={category} className="flex flex-col gap-10">
                            <div className="flex flex-wrap items-end justify-between gap-6 border-secondary/15 border-b pb-6">
                                <div className="flex flex-col gap-3">
                                    <EyebrowLabel tone="soil">{t(`categories.${category}.label`)}</EyebrowLabel>
                                    <Link
                                        href={`/${locale}/resources/category/${category}`}
                                        className="group"
                                    >
                                        <h3 className="text-base-content font-serif text-2xl font-medium leading-tight tracking-tight md:text-3xl group-hover:text-primary transition-colors">
                                            {t(`preview.categories.${category}.title`)}
                                        </h3>
                                    </Link>
                                </div>
                                <p className="text-secondary max-w-md font-sans text-sm leading-relaxed">
                                    {t(`preview.categories.${category}.body`)}
                                </p>
                            </div>

                            {articles.length === 0 ? (
                                <p className="text-secondary font-sans text-sm">{t('list.empty')}</p>
                            ) : (
                                <ul className="grid grid-cols-1 gap-px bg-secondary/15 md:grid-cols-2 lg:grid-cols-3">
                                    {articles.map((a) => (
                                        <li key={a.slug} className="bg-base-100">
                                            <Link
                                                href={`/${locale}/resources/${a.slug}`}
                                                className="group flex h-full flex-col gap-4 p-8 lg:p-10"
                                            >
                                                <div className="flex items-center gap-2">
                                                    <FontAwesomeIcon icon={faBookmark} className="text-accent text-xs" />
                                                    <span className="text-secondary font-mono text-xs font-bold uppercase tracking-[0.22em]">
                                                        {t('card.minutes', { n: a.readingMinutes })}
                                                    </span>
                                                </div>
                                                <h4 className="text-base-content font-serif text-xl font-medium leading-tight tracking-tight group-hover:text-primary transition-colors">
                                                    {pickLocale(a.title, locale)}
                                                </h4>
                                                <p className="text-secondary font-sans text-sm leading-relaxed">
                                                    {pickLocale(a.summary, locale)}
                                                </p>
                                                <span className="text-primary mt-auto inline-flex items-center gap-2 self-start border-secondary/30 border-t pt-4 font-sans text-sm font-semibold">
                                                    <span>{t('card.read_article')}</span>
                                                    <FontAwesomeIcon icon={faArrowRight} className="text-xs transition-transform group-hover:translate-x-1" />
                                                </span>
                                            </Link>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    ))}
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
                                inputLabel={t('form_label')}
                                inputPlaceholder={t('form_placeholder')}
                                ctaText={t('form_cta')}
                                helpText={t('form_help')}
                                successText={t('form_success')}
                            />
                        </div>
                    </div>
                </div>
            </section>

            <section className="bg-primary text-primary-content w-full">
                <div className="container mx-auto flex flex-col items-start gap-6 px-5 py-16 md:flex-row md:items-center md:justify-between md:gap-12 md:px-8 md:py-20 lg:px-20">
                    <div className="flex flex-col gap-2">
                        <span className="text-accent font-mono text-xs font-bold uppercase tracking-[0.22em]">
                            {t('editorial.label')}
                        </span>
                        <p className="text-primary-content font-serif text-2xl leading-tight md:text-3xl">
                            {t('editorial.body')}
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-3">
                        <a
                            href="mailto:editorial@agconn.com?subject=Topic%20suggestion"
                            className="btn btn-accent"
                        >
                            <span>{t('editorial.cta')}</span>
                            <FontAwesomeIcon icon={faArrowRight} className="text-xs" />
                        </a>
                        <Link href={`/${locale}`} className="btn btn-outline border-accent text-accent hover:bg-accent hover:text-neutral">
                            <span>{t('editorial.home')}</span>
                        </Link>
                    </div>
                </div>
            </section>
        </>
    );
}
