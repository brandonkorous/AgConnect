import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import Link from 'next/link';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft, faArrowRight, faEnvelope } from '@fortawesome/free-solid-svg-icons';
import { EyebrowLabel } from '@/components/primitives/EyebrowLabel';
import { JsonLd } from '@/components/seo/JsonLd';
import { marketingMetadata } from '@/lib/seo/metadata';
import { organizationJsonLd } from '@/lib/seo/json-ld';
import {
    getAllPressSlugs,
    getPressReleaseBySlug,
    getAllPressReleases,
} from '@/content/press';
import { pickLocale, type Locale } from '@/content/types';

type RouteProps = { params: Promise<{ locale: Locale; slug: string }> };

export const dynamicParams = false;
export const revalidate = 86400;

export function generateStaticParams() {
    const slugs = getAllPressSlugs();
    return slugs.flatMap((slug) => [
        { locale: 'en', slug },
        { locale: 'es', slug },
    ]);
}

export async function generateMetadata({ params }: RouteProps) {
    const { locale, slug } = await params;
    const release = getPressReleaseBySlug(slug);
    if (!release) return {};
    return marketingMetadata({
        locale,
        title: pickLocale(release.headline, locale),
        description: pickLocale(release.summary, locale),
        pathByLocale: (l) => `/${l}/press/${slug}`,
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

export default async function PressReleasePage({ params }: RouteProps) {
    const { locale, slug } = await params;
    const release = getPressReleaseBySlug(slug);
    if (!release) notFound();

    const t = await getTranslations({ locale, namespace: 'marketing.press' });
    const others = getAllPressReleases().filter((r) => r.slug !== slug).slice(0, 3);
    const formattedDate = formatDate(release.publishedAt, locale);

    return (
        <>
            <JsonLd data={organizationJsonLd()} />
            <JsonLd
                data={{
                    '@context': 'https://schema.org',
                    '@type': 'NewsArticle',
                    headline: pickLocale(release.headline, locale),
                    datePublished: release.publishedAt,
                    dateline: release.location,
                    inLanguage: locale === 'es' ? 'es-MX' : 'en-US',
                    description: pickLocale(release.summary, locale),
                    author: { '@type': 'Organization', name: 'AGCONN' },
                    publisher: { '@type': 'Organization', name: 'AGCONN' },
                }}
            />

            <article>
                <header className="bg-base-100 w-full">
                    <div className="container mx-auto px-5 pt-16 pb-12 md:px-8 md:pt-20 md:pb-16 lg:px-20 lg:pt-24 lg:pb-20">
                        <Link
                            href={`/${locale}/press`}
                            className="text-secondary hover:text-base-content mb-8 inline-flex items-center gap-2 font-sans text-sm font-medium"
                        >
                            <FontAwesomeIcon icon={faArrowLeft} className="text-xs" />
                            <span>{t('detail.back_to_list')}</span>
                        </Link>

                        <div className="flex flex-col gap-6 max-w-4xl">
                            <EyebrowLabel tone="soil" withRule>
                                {t('eyebrow')}
                            </EyebrowLabel>
                            <h1 className="text-base-content font-serif text-4xl font-semibold leading-[1.1] tracking-tight md:text-5xl lg:text-6xl">
                                {pickLocale(release.headline, locale)}
                            </h1>
                            <div className="border-secondary/20 flex flex-wrap items-center gap-x-6 gap-y-2 border-y py-4">
                                <span className="text-base-content font-mono text-sm font-bold uppercase tracking-[0.18em]">
                                    {release.location}
                                </span>
                                <span className="text-secondary/60" aria-hidden>·</span>
                                <span className="text-secondary font-mono text-sm uppercase tracking-[0.18em]">
                                    {formattedDate}
                                </span>
                            </div>
                            <p className="text-base-content max-w-prose font-sans text-lg leading-relaxed">
                                {pickLocale(release.summary, locale)}
                            </p>
                        </div>
                    </div>
                </header>

                <div className="bg-base-100 w-full border-secondary/15 border-t">
                    <div className="container mx-auto px-5 py-16 md:px-8 md:py-20 lg:px-20 lg:py-24">
                        <div className="flex flex-col gap-8 max-w-prose">
                            {release.body.map((paragraph, i) => (
                                <p
                                    key={i}
                                    className={
                                        i === 0
                                            ? 'text-base-content font-sans text-lg leading-relaxed first-letter:font-serif first-letter:text-5xl first-letter:font-semibold first-letter:float-left first-letter:mr-3 first-letter:leading-none first-letter:text-primary'
                                            : 'text-base-content font-sans text-base leading-relaxed'
                                    }
                                >
                                    {pickLocale(paragraph, locale)}
                                </p>
                            ))}

                            <div className="border-secondary/15 mt-8 flex flex-col gap-3 border-t pt-8">
                                <span className="text-secondary font-mono text-xs font-bold uppercase tracking-[0.22em]">
                                    {t('detail.about_label')}
                                </span>
                                <p className="text-base-content font-sans text-sm leading-relaxed">
                                    {t('detail.about_body')}
                                </p>
                            </div>

                            <div className="border-secondary/15 flex flex-col gap-3 border-t pt-8">
                                <span className="text-secondary font-mono text-xs font-bold uppercase tracking-[0.22em]">
                                    {t('detail.media_contact')}
                                </span>
                                <p className="text-base-content font-sans text-sm leading-relaxed">
                                    {t('detail.media_contact_body')}
                                </p>
                                <a
                                    href="mailto:press@agconn.com"
                                    className="btn btn-primary mt-2 self-start"
                                >
                                    <FontAwesomeIcon icon={faEnvelope} className="text-sm" />
                                    <span>press@agconn.com</span>
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </article>

            {others.length > 0 ? (
                <section className="bg-base-200 w-full border-secondary/15 border-t">
                    <div className="container mx-auto flex flex-col gap-10 px-5 py-20 md:px-8 md:py-24 lg:px-20 lg:py-28">
                        <div className="flex flex-col gap-3">
                            <EyebrowLabel tone="soil" withRule>
                                {t('releases.eyebrow')}
                            </EyebrowLabel>
                            <h2 className="text-base-content font-serif text-3xl font-medium leading-tight tracking-tight md:text-4xl">
                                {t('releases.headline')}
                            </h2>
                        </div>
                        <ul className="grid grid-cols-1 gap-px bg-secondary/15 md:grid-cols-3">
                            {others.map((r) => (
                                <li key={r.slug} className="bg-base-100">
                                    <Link
                                        href={`/${locale}/press/${r.slug}`}
                                        className="group flex h-full flex-col gap-3 p-8 lg:p-10"
                                    >
                                        <span className="text-secondary font-mono text-xs font-bold uppercase tracking-[0.22em]">
                                            {formatDate(r.publishedAt, locale)}
                                        </span>
                                        <h3 className="text-base-content font-serif text-lg font-medium leading-tight tracking-tight group-hover:text-primary transition-colors">
                                            {pickLocale(r.headline, locale)}
                                        </h3>
                                        <span className="text-primary mt-auto inline-flex items-center gap-2 self-start font-sans text-sm font-semibold">
                                            <span>{t('releases.read_release')}</span>
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
