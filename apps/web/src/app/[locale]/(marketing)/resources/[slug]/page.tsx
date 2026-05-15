import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import Link from 'next/link';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft, faArrowRight, faBookmark } from '@fortawesome/free-solid-svg-icons';
import { EyebrowLabel } from '@/components/primitives/EyebrowLabel';
import { JsonLd } from '@/components/seo/JsonLd';
import { marketingMetadata } from '@/lib/seo/metadata';
import { organizationJsonLd } from '@/lib/seo/json-ld';
import {
    getAllResourceSlugs,
    getResourceBySlug,
    getAllResources,
} from '@/content/resources';
import { pickLocale } from '@/content/types';

type Locale = 'en' | 'es';
type RouteProps = { params: Promise<{ locale: Locale; slug: string }> };

export const dynamicParams = false;
export const revalidate = 86400;

export function generateStaticParams() {
    const slugs = getAllResourceSlugs();
    return slugs.flatMap((slug) => [
        { locale: 'en', slug },
        { locale: 'es', slug },
    ]);
}

export async function generateMetadata({ params }: RouteProps) {
    const { locale, slug } = await params;
    const article = getResourceBySlug(slug);
    if (!article) return {};
    return marketingMetadata({
        locale,
        title: pickLocale(article.title, locale),
        description: pickLocale(article.summary, locale),
        pathByLocale: (l) => `/${l}/resources/${slug}`,
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

export default async function ResourceArticlePage({ params }: RouteProps) {
    const { locale, slug } = await params;
    const article = getResourceBySlug(slug);
    if (!article) notFound();

    const t = await getTranslations({ locale, namespace: 'marketing.resources' });
    const related = getAllResources()
        .filter((a) => a.slug !== slug && a.category === article.category)
        .slice(0, 3);

    return (
        <>
            <JsonLd data={organizationJsonLd()} />
            <JsonLd
                data={{
                    '@context': 'https://schema.org',
                    '@type': 'Article',
                    headline: pickLocale(article.title, locale),
                    datePublished: article.publishedAt,
                    inLanguage: locale === 'es' ? 'es-MX' : 'en-US',
                    description: pickLocale(article.summary, locale),
                    author: { '@type': 'Organization', name: 'AGCONN' },
                    publisher: { '@type': 'Organization', name: 'AGCONN' },
                }}
            />

            <article>
                <header className="bg-base-100 w-full">
                    <div className="container mx-auto px-5 pt-16 pb-12 md:px-8 md:pt-20 md:pb-16 lg:px-20 lg:pt-24 lg:pb-20">
                        <Link
                            href={`/${locale}/resources`}
                            className="text-secondary hover:text-base-content mb-8 inline-flex items-center gap-2 font-sans text-sm font-medium"
                        >
                            <FontAwesomeIcon icon={faArrowLeft} className="text-xs" />
                            <span>{t('detail.back_to_list')}</span>
                        </Link>

                        <div className="flex flex-col gap-6 max-w-4xl">
                            <div className="flex flex-wrap items-center gap-4">
                                <EyebrowLabel tone="soil" withRule>
                                    {t(`categories.${article.category}.label`)}
                                </EyebrowLabel>
                                <span className="text-secondary font-mono text-xs uppercase tracking-[0.18em]">
                                    {t('detail.published', { date: formatDate(article.publishedAt, locale) })}
                                </span>
                                <span className="text-secondary font-mono text-xs uppercase tracking-[0.18em]">
                                    {t('detail.reading_time', { n: article.readingMinutes })}
                                </span>
                            </div>
                            <h1 className="text-base-content font-serif text-4xl font-semibold leading-[1.1] tracking-tight md:text-5xl lg:text-6xl">
                                {pickLocale(article.title, locale)}
                            </h1>
                            <p className="text-base-content max-w-prose font-sans text-lg leading-relaxed">
                                {pickLocale(article.summary, locale)}
                            </p>
                        </div>
                    </div>
                </header>

                <div className="bg-base-100 w-full border-secondary/15 border-t">
                    <div className="container mx-auto grid grid-cols-1 gap-12 px-5 py-16 md:px-8 md:py-20 lg:grid-cols-[minmax(0,0.25fr)_minmax(0,1fr)] lg:px-20 lg:gap-16 lg:py-24">
                        <aside className="hidden lg:block">
                            <nav aria-label="Sections" className="sticky top-24 flex flex-col gap-3 border-secondary/15 border-l pl-6">
                                <span className="text-secondary font-mono text-xs font-bold uppercase tracking-[0.22em]">
                                    {t('list.eyebrow')}
                                </span>
                                <ul className="flex flex-col gap-2.5">
                                    {article.sections.map((s, i) => (
                                        <li key={i}>
                                            <a
                                                href={`#section-${i}`}
                                                className="text-secondary hover:text-primary font-sans text-sm leading-snug"
                                            >
                                                {pickLocale(s.heading, locale)}
                                            </a>
                                        </li>
                                    ))}
                                </ul>
                            </nav>
                        </aside>

                        <div className="flex flex-col gap-12 max-w-prose">
                            {article.sections.map((s, i) => (
                                <section key={i} id={`section-${i}`} className="flex flex-col gap-4 scroll-mt-24">
                                    <h2 className="text-base-content font-serif text-2xl font-medium leading-tight tracking-tight md:text-3xl">
                                        {pickLocale(s.heading, locale)}
                                    </h2>
                                    <p className="text-base-content font-sans text-base leading-relaxed">
                                        {pickLocale(s.body, locale)}
                                    </p>
                                </section>
                            ))}

                            <p className="text-secondary border-secondary/15 mt-8 border-t pt-8 font-sans text-sm italic leading-relaxed">
                                {t('detail.disclaimer')}
                            </p>
                        </div>
                    </div>
                </div>
            </article>

            {related.length > 0 ? (
                <section className="bg-base-200 w-full border-secondary/15 border-t">
                    <div className="container mx-auto flex flex-col gap-10 px-5 py-20 md:px-8 md:py-24 lg:px-20 lg:py-28">
                        <div className="flex flex-col gap-3">
                            <EyebrowLabel tone="soil" withRule>
                                {t('detail.related_eyebrow')}
                            </EyebrowLabel>
                            <h2 className="text-base-content font-serif text-3xl font-medium leading-tight tracking-tight md:text-4xl">
                                {t('detail.related_headline')}
                            </h2>
                        </div>
                        <ul className="grid grid-cols-1 gap-px bg-secondary/15 md:grid-cols-3">
                            {related.map((a) => (
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
                                        <h3 className="text-base-content font-serif text-xl font-medium leading-tight tracking-tight group-hover:text-primary transition-colors">
                                            {pickLocale(a.title, locale)}
                                        </h3>
                                        <span className="text-primary mt-auto inline-flex items-center gap-2 self-start font-sans text-sm font-semibold">
                                            <span>{t('card.read_article')}</span>
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
