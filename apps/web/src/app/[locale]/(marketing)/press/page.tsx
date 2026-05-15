import { getTranslations } from 'next-intl/server';
import Link from 'next/link';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowRight, faEnvelope } from '@fortawesome/free-solid-svg-icons';
import { EyebrowLabel } from '@/components/primitives/EyebrowLabel';
import { JsonLd } from '@/components/seo/JsonLd';
import { Breadcrumb } from '@/components/seo/Breadcrumb';
import { marketingMetadata } from '@/lib/seo/metadata';
import { organizationJsonLd } from '@/lib/seo/json-ld';
import { MarketingPageHero } from '@/components/marketing/MarketingPageHero';
import { getAllPressReleases } from '@/content/press';
import { pickLocale, type Locale } from '@/content/types';

type RouteProps = { params: Promise<{ locale: Locale }> };

export const dynamicParams = false;
export const revalidate = 86400;

export async function generateMetadata({ params }: RouteProps) {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: 'marketing.press' });
    return marketingMetadata({
        locale,
        title: t('meta.title'),
        description: t('meta.description'),
        pathByLocale: (l) => `/${l}/press`,
    });
}

const FACTS = ['what', 'where', 'who', 'when', 'why'] as const;

function formatDate(iso: string, locale: Locale): string {
    const fmt = new Intl.DateTimeFormat(locale === 'es' ? 'es-MX' : 'en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });
    return fmt.format(new Date(iso));
}

export default async function PressPage({ params }: RouteProps) {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: 'marketing.press' });
    const releases = getAllPressReleases();

    return (
        <>
            <JsonLd data={organizationJsonLd()} />
            <Breadcrumb locale={locale} path="/press" />

            <MarketingPageHero eyebrow={t('eyebrow')} headline={t('headline')} intro={t('intro')} />

            <section className="bg-base-200 w-full border-secondary/15 border-t">
                <div className="container mx-auto flex flex-col gap-12 px-5 py-20 md:px-8 md:py-24 lg:px-20 lg:py-28">
                    <div className="flex flex-col gap-4">
                        <EyebrowLabel tone="soil" withRule>
                            {t('releases.eyebrow')}
                        </EyebrowLabel>
                        <div className="flex flex-wrap items-end justify-between gap-6">
                            <h2 className="text-base-content font-serif text-3xl font-medium leading-tight tracking-tight md:text-4xl lg:text-5xl">
                                {t('releases.headline')}
                            </h2>
                            <p className="text-secondary max-w-md font-sans text-base leading-relaxed">
                                {t('releases.intro')}
                            </p>
                        </div>
                    </div>

                    {releases.length === 0 ? (
                        <p className="text-secondary font-sans text-base">{t('releases.empty')}</p>
                    ) : (
                        <ul className="border-secondary/20 flex flex-col border-y">
                            {releases.map((r) => (
                                <li key={r.slug} className="border-secondary/15 border-b last:border-b-0">
                                    <Link
                                        href={`/${locale}/press/${r.slug}`}
                                        className="group flex flex-col gap-4 py-8 md:flex-row md:items-start md:gap-12 md:py-10"
                                    >
                                        <div className="flex flex-col gap-1 md:w-44 md:shrink-0">
                                            <span className="text-secondary font-mono text-xs font-bold uppercase tracking-[0.22em]">
                                                {formatDate(r.publishedAt, locale)}
                                            </span>
                                            <span className="text-secondary/80 font-mono text-xs uppercase tracking-[0.18em]">
                                                {r.location}
                                            </span>
                                        </div>
                                        <div className="flex flex-1 flex-col gap-3">
                                            <h3 className="text-base-content font-serif text-xl font-medium leading-tight tracking-tight md:text-2xl group-hover:text-primary transition-colors">
                                                {pickLocale(r.headline, locale)}
                                            </h3>
                                            <p className="text-secondary font-sans text-base leading-relaxed">
                                                {pickLocale(r.summary, locale)}
                                            </p>
                                            <span className="text-primary inline-flex items-center gap-2 font-sans text-sm font-semibold pt-1">
                                                <span>{t('releases.read_release')}</span>
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
                            {t('facts.eyebrow')}
                        </EyebrowLabel>
                        <h2 className="text-base-content font-serif text-3xl font-medium leading-tight tracking-tight md:text-4xl lg:text-5xl">
                            {t('facts.headline')}
                        </h2>
                    </div>

                    <ul className="border-secondary/20 flex flex-col border-y">
                        {FACTS.map((id) => (
                            <li key={id} className="border-secondary/15 border-b last:border-b-0">
                                <div className="flex flex-col gap-3 px-2 py-6 md:flex-row md:gap-8 md:py-8">
                                    <div className="md:w-32 md:shrink-0">
                                        <span className="text-secondary font-mono text-xs font-bold uppercase tracking-[0.22em]">
                                            {t(`facts.${id}.label`)}
                                        </span>
                                    </div>
                                    <p className="text-base-content flex-1 font-sans text-base leading-relaxed">
                                        {t(`facts.${id}.body`)}
                                    </p>
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
            </section>

            <section className="bg-base-200 w-full border-secondary/15 border-t">
                <div className="container mx-auto grid grid-cols-1 gap-12 px-5 py-20 md:px-8 md:py-24 lg:grid-cols-2 lg:px-20 lg:gap-20 lg:py-28">
                    <div className="flex flex-col gap-4">
                        <EyebrowLabel tone="soil" withRule>
                            {t('assets.eyebrow')}
                        </EyebrowLabel>
                        <h2 className="text-base-content font-serif text-3xl font-medium leading-tight tracking-tight md:text-4xl lg:text-5xl">
                            {t('assets.headline')}
                        </h2>
                        <p className="text-base-content max-w-prose font-sans text-base leading-relaxed">
                            {t('assets.body')}
                        </p>
                        <a
                            href="mailto:press@agconn.com?subject=Press%20kit%20request"
                            className="btn btn-primary mt-4 self-start"
                        >
                            <FontAwesomeIcon icon={faEnvelope} className="text-sm" />
                            <span>{t('assets.cta')}</span>
                        </a>
                    </div>
                    <div className="border-secondary/20 bg-base-100 flex flex-col gap-4 border p-8 lg:p-10 lg:self-end">
                        <EyebrowLabel tone="soil">{t('contact.eyebrow')}</EyebrowLabel>
                        <h3 className="text-base-content font-serif text-2xl font-medium leading-tight tracking-tight">
                            {t('contact.headline')}
                        </h3>
                        <p className="text-base-content font-sans text-base leading-relaxed">
                            {t('contact.body')}
                        </p>
                        <a
                            href="mailto:press@agconn.com"
                            className="text-primary mt-2 inline-flex items-center gap-2 self-start font-mono text-sm font-bold uppercase tracking-[0.18em] hover:underline"
                        >
                            <span>press@agconn.com</span>
                            <FontAwesomeIcon icon={faArrowRight} className="text-xs" />
                        </a>
                    </div>
                </div>
            </section>
        </>
    );
}
