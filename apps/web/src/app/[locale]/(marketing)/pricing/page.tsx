import { getTranslations } from 'next-intl/server';
import Link from 'next/link';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowRight, faCheck } from '@fortawesome/free-solid-svg-icons';
import { EyebrowLabel } from '@/components/primitives/EyebrowLabel';
import { JsonLd } from '@/components/seo/JsonLd';
import { marketingMetadata } from '@/lib/seo/metadata';
import { organizationJsonLd } from '@/lib/seo/json-ld';
import { MarketingPageHero } from '@/components/marketing/MarketingPageHero';

type Locale = 'en' | 'es';
type RouteProps = { params: Promise<{ locale: Locale }> };

export const dynamicParams = false;
export const revalidate = 86400;

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

type PlanId = 'worker' | 'starter' | 'verified' | 'training' | 'workforce';

interface PlanConfig {
    id: PlanId;
    href: string;
    highlighted?: boolean;
}

const PLANS: PlanConfig[] = [
    { id: 'worker', href: '/worker/sign-up' },
    { id: 'starter', href: '/employer/sign-up' },
    { id: 'verified', href: 'mailto:sales@agconn.com?subject=Verified%20employer%20plan', highlighted: true },
    { id: 'training', href: 'mailto:partnerships@agconn.com?subject=Training%20program' },
    { id: 'workforce', href: 'mailto:partnerships@agconn.com?subject=Workforce%20board%20partnership' },
];

const FEATURES = ['f1', 'f2', 'f3', 'f4'] as const;
const FAQ = ['q1', 'q2', 'q3', 'q4', 'q5'] as const;

export default async function PricingPage({ params }: RouteProps) {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: 'marketing.pricing_page' });

    return (
        <>
            <JsonLd data={organizationJsonLd()} />

            <MarketingPageHero eyebrow={t('eyebrow')} headline={t('headline')} intro={t('intro')} />

            <section className="bg-base-200 w-full border-secondary/15 border-t">
                <div className="container mx-auto flex flex-col gap-12 px-5 py-20 md:px-8 md:py-24 lg:px-20 lg:py-28">
                    <div className="flex flex-col gap-4">
                        <EyebrowLabel tone="soil" withRule>
                            {t('plans.eyebrow')}
                        </EyebrowLabel>
                        <h2 className="text-base-content font-serif text-3xl font-medium leading-tight tracking-tight md:text-4xl lg:text-5xl">
                            {t('plans.headline')}
                        </h2>
                    </div>

                    <div className="grid grid-cols-1 gap-px bg-secondary/15 md:grid-cols-2 lg:grid-cols-5">
                        {PLANS.map((plan) => {
                            const isHighlighted = plan.highlighted;
                            const isMailto = plan.href.startsWith('mailto:');
                            const cardClasses = isHighlighted
                                ? 'bg-primary text-primary-content lg:-my-4 lg:py-12'
                                : 'bg-base-100 text-base-content';
                            const eyebrowClasses = isHighlighted ? 'text-accent' : 'text-secondary';
                            const bodyTextClasses = isHighlighted ? 'text-primary-content/85' : 'text-secondary';
                            const checkColor = isHighlighted ? 'text-accent' : 'text-primary';
                            const featureTextClasses = isHighlighted ? 'text-primary-content/95' : 'text-base-content';
                            const periodClasses = isHighlighted ? 'text-primary-content/70' : 'text-secondary';

                            return (
                                <article
                                    key={plan.id}
                                    className={`${cardClasses} flex flex-col gap-6 p-8 lg:p-10 relative`}
                                >
                                    {isHighlighted ? (
                                        <span className="bg-accent text-neutral absolute -top-3 left-8 font-mono text-xs font-bold uppercase tracking-[0.22em] px-3 py-1">
                                            {t('plans.verified.badge')}
                                        </span>
                                    ) : null}

                                    <div className="flex flex-col gap-2">
                                        <span className={`${eyebrowClasses} font-mono text-xs font-bold uppercase tracking-[0.22em]`}>
                                            {t(`plans.${plan.id}.label`)}
                                        </span>
                                        <h3 className="font-serif text-2xl font-semibold leading-tight tracking-tight">
                                            {t(`plans.${plan.id}.name`)}
                                        </h3>
                                    </div>

                                    <div className="flex flex-col gap-1">
                                        <span className={`${isHighlighted ? 'text-accent' : 'text-base-content'} font-mono text-4xl font-bold leading-none tracking-tight tabular-nums`}>
                                            {t(`plans.${plan.id}.price`)}
                                        </span>
                                        <span className={`${periodClasses} font-mono text-xs uppercase tracking-[0.18em]`}>
                                            {t(`plans.${plan.id}.period`)}
                                        </span>
                                    </div>

                                    <p className={`${bodyTextClasses} font-sans text-sm leading-relaxed`}>
                                        {t(`plans.${plan.id}.body`)}
                                    </p>

                                    <ul className={`${isHighlighted ? 'border-accent/30' : 'border-secondary/20'} flex flex-col gap-3 border-t pt-6`}>
                                        {FEATURES.map((f) => (
                                            <li key={f} className="flex items-start gap-2">
                                                <FontAwesomeIcon icon={faCheck} className={`${checkColor} mt-1 text-xs shrink-0`} />
                                                <span className={`${featureTextClasses} font-sans text-sm leading-snug`}>
                                                    {t(`plans.${plan.id}.${f}`)}
                                                </span>
                                            </li>
                                        ))}
                                    </ul>

                                    {isMailto ? (
                                        <a
                                            href={plan.href}
                                            className={`${isHighlighted ? 'btn btn-accent' : 'btn btn-outline btn-primary'} mt-auto self-stretch`}
                                        >
                                            <span>{t(`plans.${plan.id}.cta`)}</span>
                                            <FontAwesomeIcon icon={faArrowRight} className="text-xs" />
                                        </a>
                                    ) : (
                                        <Link
                                            href={`/${locale}${plan.href}`}
                                            className={`${isHighlighted ? 'btn btn-accent' : 'btn btn-outline btn-primary'} mt-auto self-stretch`}
                                        >
                                            <span>{t(`plans.${plan.id}.cta`)}</span>
                                            <FontAwesomeIcon icon={faArrowRight} className="text-xs" />
                                        </Link>
                                    )}
                                </article>
                            );
                        })}
                    </div>
                </div>
            </section>

            <section className="bg-base-100 w-full">
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
