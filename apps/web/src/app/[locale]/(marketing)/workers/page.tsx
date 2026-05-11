import { getTranslations } from 'next-intl/server';
import Link from 'next/link';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faArrowRight,
    faWallet,
    faShieldHalved,
    faCommentSms,
    faLanguage,
} from '@fortawesome/free-solid-svg-icons';
import { EyebrowLabel } from '@/components/primitives/EyebrowLabel';
import { JsonLd } from '@/components/seo/JsonLd';
import { marketingMetadata } from '@/lib/seo/metadata';
import { organizationJsonLd } from '@/lib/seo/json-ld';
import { MarketingPageHero } from '@/components/marketing/MarketingPageHero';
import { SmsOptInCallout } from '@/components/landing/SmsOptInCallout';

type Locale = 'en' | 'es';
type RouteProps = { params: Promise<{ locale: Locale }> };

export const dynamicParams = false;
export const revalidate = 86400;

export async function generateMetadata({ params }: RouteProps) {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: 'marketing.workers_page' });
    return marketingMetadata({
        locale,
        title: t('meta.title'),
        description: t('meta.description'),
        pathByLocale: (l) => `/${l}/workers`,
    });
}

const BENEFITS = [
    { id: 'wallet', icon: faWallet },
    { id: 'search', icon: faShieldHalved },
    { id: 'sms', icon: faCommentSms },
    { id: 'bilingual', icon: faLanguage },
] as const;

const STEPS = ['s1', 's2', 's3', 's4'] as const;

export default async function WorkersPage({ params }: RouteProps) {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: 'marketing.workers_page' });

    return (
        <>
            <JsonLd data={organizationJsonLd()} />

            <MarketingPageHero
                eyebrow={t('eyebrow')}
                headline={t('headline')}
                intro={t('intro')}
                accent={
                    <div className="mt-2 flex flex-wrap gap-3">
                        <Link href={`/${locale}/worker/sign-up`} className="btn btn-primary">
                            <span>{t('cta_primary')}</span>
                            <FontAwesomeIcon icon={faArrowRight} className="text-xs" />
                        </Link>
                        <Link href={`/${locale}/jobs`} className="btn btn-outline">
                            <span>{t('cta_secondary')}</span>
                        </Link>
                    </div>
                }
            />

            <section className="bg-base-200 w-full border-secondary/15 border-t">
                <div className="container mx-auto px-5 py-12 md:px-8 md:py-16 lg:px-20">
                    <SmsOptInCallout locale={locale} variant="hero" />
                </div>
            </section>

            <section className="bg-base-200 w-full border-secondary/15 border-t">
                <div className="container mx-auto flex flex-col gap-12 px-5 py-20 md:px-8 md:py-24 lg:px-20 lg:py-28">
                    <div className="flex flex-col gap-4">
                        <EyebrowLabel tone="soil" withRule>
                            {t('benefits.eyebrow')}
                        </EyebrowLabel>
                        <h2 className="text-base-content font-serif text-3xl font-medium leading-tight tracking-tight md:text-4xl lg:text-5xl">
                            {t('benefits.headline')}
                        </h2>
                    </div>
                    <div className="grid grid-cols-1 gap-px bg-secondary/15 md:grid-cols-2 lg:grid-cols-4">
                        {BENEFITS.map((b) => (
                            <article key={b.id} className="bg-base-100 flex flex-col gap-4 p-8 lg:p-10">
                                <FontAwesomeIcon icon={b.icon} className="text-primary text-2xl" />
                                <h3 className="text-base-content font-serif text-xl font-semibold leading-tight tracking-tight">
                                    {t(`benefits.${b.id}.title`)}
                                </h3>
                                <p className="text-secondary font-sans text-sm leading-relaxed">
                                    {t(`benefits.${b.id}.body`)}
                                </p>
                            </article>
                        ))}
                    </div>
                </div>
            </section>

            <section className="bg-base-100 w-full">
                <div className="container mx-auto flex flex-col gap-12 px-5 py-20 md:px-8 md:py-24 lg:px-20 lg:py-28">
                    <div className="flex flex-col gap-4">
                        <EyebrowLabel tone="soil" withRule>
                            {t('steps.eyebrow')}
                        </EyebrowLabel>
                        <h2 className="text-base-content font-serif text-3xl font-medium leading-tight tracking-tight md:text-4xl lg:text-5xl">
                            {t('steps.headline')}
                        </h2>
                    </div>
                    <ol className="border-secondary/20 flex flex-col border-y">
                        {STEPS.map((s) => (
                            <li
                                key={s}
                                className="border-secondary/15 grid grid-cols-1 gap-4 border-b py-8 last:border-b-0 md:grid-cols-[minmax(0,0.4fr)_minmax(0,1fr)] md:gap-12 md:py-10"
                            >
                                <h3 className="text-base-content font-serif text-2xl font-medium leading-tight tracking-tight md:text-3xl">
                                    {t(`steps.${s}.title`)}
                                </h3>
                                <p className="text-base-content max-w-prose font-sans text-base leading-relaxed">
                                    {t(`steps.${s}.body`)}
                                </p>
                            </li>
                        ))}
                    </ol>
                </div>
            </section>

            <section className="bg-primary text-primary-content w-full">
                <div className="container mx-auto grid grid-cols-1 gap-10 px-5 py-20 md:px-8 md:py-24 lg:grid-cols-[minmax(0,0.55fr)_minmax(0,1fr)] lg:px-20 lg:gap-20 lg:py-28">
                    <div className="flex flex-col gap-4">
                        <span className="text-accent font-mono text-xs font-bold uppercase tracking-[0.22em]">
                            {t('protection.eyebrow')}
                        </span>
                        <h2 className="text-primary-content font-serif text-3xl font-medium leading-tight tracking-tight md:text-4xl lg:text-5xl">
                            {t('protection.headline')}
                        </h2>
                    </div>
                    <div className="flex flex-col gap-6 lg:pt-2">
                        <p className="text-primary-content/85 max-w-prose font-sans text-base leading-relaxed">
                            {t('protection.body')}
                        </p>
                        <Link
                            href={`/${locale}/trust`}
                            className="text-accent mt-2 inline-flex items-center gap-2 self-start font-sans text-base font-semibold hover:underline"
                        >
                            <span>{t('protection.cta')}</span>
                            <FontAwesomeIcon icon={faArrowRight} className="text-sm" />
                        </Link>
                    </div>
                </div>
            </section>

            <section className="bg-base-200 w-full border-secondary/15 border-t">
                <div className="container mx-auto flex flex-col items-start gap-6 px-5 py-16 md:flex-row md:items-center md:justify-between md:gap-12 md:px-8 md:py-20 lg:px-20">
                    <div className="flex flex-col gap-2">
                        <span className="text-secondary font-mono text-xs font-bold uppercase tracking-[0.22em]">
                            {t('cta_section.eyebrow')}
                        </span>
                        <p className="text-base-content font-serif text-2xl leading-tight md:text-3xl">
                            {t('cta_section.headline')}
                        </p>
                        <p className="text-secondary max-w-prose font-sans text-base leading-relaxed">
                            {t('cta_section.body')}
                        </p>
                    </div>
                    <Link href={`/${locale}/worker/sign-up`} className="btn btn-primary shrink-0">
                        <span>{t('cta_section.button')}</span>
                        <FontAwesomeIcon icon={faArrowRight} className="text-xs" />
                    </Link>
                </div>
            </section>
        </>
    );
}
