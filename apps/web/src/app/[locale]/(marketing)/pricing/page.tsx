import { getTranslations } from 'next-intl/server';
import Link from 'next/link';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowRight, faSeedling } from '@fortawesome/free-solid-svg-icons';
import { EyebrowLabel } from '@/components/primitives/EyebrowLabel';
import { JsonLd } from '@/components/seo/JsonLd';
import { marketingMetadata } from '@/lib/seo/metadata';
import { organizationJsonLd } from '@/lib/seo/json-ld';
import { MarketingPageHero } from '@/components/marketing/MarketingPageHero';
import { getFounderSlots } from '@/lib/api/landing';
import { PricingPlanGrid } from '@/components/marketing/PricingPlanGrid';
import { PricingComparisonTable } from '@/components/marketing/PricingComparisonTable';

type Locale = 'en' | 'es';
type RouteProps = { params: Promise<{ locale: Locale }> };

export const dynamicParams = false;
export const revalidate = 30;

export async function generateMetadata({ params }: RouteProps) {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: 'marketing.pricing_page' });
    return marketingMetadata({
        locale,
        title: t('meta.title'),
        description: t('meta.description'),
        pathByLocale: (l) => `/${l}/pricing`,
    });
}

const FAQ = ['q1', 'q2', 'q3', 'q4', 'q5'] as const;

export default async function PricingPage({ params }: RouteProps) {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: 'marketing.pricing_page' });
    const founderSlots = await getFounderSlots();

    return (
        <>
            <JsonLd data={organizationJsonLd()} />

            <MarketingPageHero eyebrow={t('eyebrow')} headline={t('headline')} intro={t('intro')} />

            <PricingPlanGrid locale={locale} founderSlots={founderSlots} />

            <PricingComparisonTable locale={locale} />

            <section className="bg-base-200 w-full border-secondary/15 border-t">
                <div className="container mx-auto flex flex-col gap-12 px-5 py-20 md:px-8 md:py-24 lg:px-20 lg:py-28">
                    <div className="flex flex-col gap-4">
                        <EyebrowLabel tone="soil" withRule>
                            {t('always_free.eyebrow')}
                        </EyebrowLabel>
                        <h2 className="text-base-content font-serif text-3xl font-medium leading-tight tracking-tight md:text-4xl lg:text-5xl">
                            {t('always_free.headline')}
                        </h2>
                    </div>

                    <div className="grid grid-cols-1 gap-px bg-secondary/15 md:grid-cols-2">
                        <article className="bg-base-100 text-base-content flex flex-col gap-5 p-8 lg:p-10">
                            <FontAwesomeIcon icon={faSeedling} className="text-primary text-2xl" />
                            <h3 className="font-serif text-2xl font-semibold leading-tight tracking-tight">
                                {t('always_free.workers.title')}
                            </h3>
                            <p className="text-secondary font-sans text-base leading-relaxed max-w-prose">
                                {t('always_free.workers.body')}
                            </p>
                            <Link
                                href={`/${locale}/worker/sign-up`}
                                className="btn btn-outline btn-primary self-start mt-auto"
                            >
                                <span>{t('always_free.workers.cta')}</span>
                                <FontAwesomeIcon icon={faArrowRight} className="text-xs" />
                            </Link>
                        </article>
                        <article className="bg-base-100 text-base-content flex flex-col gap-5 p-8 lg:p-10">
                            <FontAwesomeIcon icon={faSeedling} className="text-primary text-2xl" />
                            <h3 className="font-serif text-2xl font-semibold leading-tight tracking-tight">
                                {t('always_free.training.title')}
                            </h3>
                            <p className="text-secondary font-sans text-base leading-relaxed max-w-prose">
                                {t('always_free.training.body')}
                            </p>
                            <a
                                href="mailto:partnerships@agconn.com?subject=Training%20program"
                                className="btn btn-outline btn-primary self-start mt-auto"
                            >
                                <span>{t('always_free.training.cta')}</span>
                                <FontAwesomeIcon icon={faArrowRight} className="text-xs" />
                            </a>
                        </article>
                    </div>
                </div>
            </section>

            <section className="bg-base-100 w-full border-secondary/15 border-t">
                <div className="container mx-auto flex flex-col gap-12 px-5 py-20 md:px-8 md:py-24 lg:px-20 lg:py-28">
                    <div className="flex flex-col gap-4">
                        <EyebrowLabel tone="soil" withRule>
                            {t('faq.eyebrow')}
                        </EyebrowLabel>
                        <h2 className="text-base-content font-serif text-3xl font-medium leading-tight tracking-tight md:text-4xl lg:text-5xl">
                            {t('faq.headline')}
                        </h2>
                    </div>
                    <ul className="border-secondary/20 flex flex-col border-y">
                        {FAQ.map((id) => (
                            <li
                                key={id}
                                className="border-secondary/15 grid grid-cols-1 gap-4 border-b py-8 last:border-b-0 md:grid-cols-[minmax(0,0.45fr)_minmax(0,1fr)] md:gap-12 md:py-10"
                            >
                                <h3 className="text-base-content font-serif text-xl font-medium leading-tight tracking-tight md:text-2xl">
                                    {t(`faq.${id}.q`)}
                                </h3>
                                <p className="text-base-content max-w-prose font-sans text-base leading-relaxed">
                                    {t(`faq.${id}.a`)}
                                </p>
                            </li>
                        ))}
                    </ul>
                </div>
            </section>

            <section className="bg-primary text-primary-content w-full">
                <div className="container mx-auto flex flex-col items-start gap-6 px-5 py-16 md:flex-row md:items-center md:justify-between md:gap-12 md:px-8 md:py-20 lg:px-20">
                    <div className="flex flex-col gap-2">
                        <span className="text-accent font-mono text-xs font-bold uppercase tracking-[0.22em]">
                            {t('closing.eyebrow')}
                        </span>
                        <p className="text-primary-content font-serif text-2xl leading-tight md:text-3xl">
                            {t('closing.headline')}
                        </p>
                        <p className="text-primary-content/80 max-w-prose font-sans text-base leading-relaxed">
                            {t('closing.body')}
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-3">
                        <Link href={`/${locale}/worker/sign-up`} className="btn btn-accent">
                            <span>{t('closing.cta_worker')}</span>
                            <FontAwesomeIcon icon={faArrowRight} className="text-xs" />
                        </Link>
                        <Link
                            href={`/${locale}/employer/sign-up`}
                            className="btn btn-outline border-accent text-accent hover:bg-accent hover:text-neutral"
                        >
                            <span>{t('closing.cta_employer')}</span>
                            <FontAwesomeIcon icon={faArrowRight} className="text-xs" />
                        </Link>
                    </div>
                </div>
            </section>
        </>
    );
}
