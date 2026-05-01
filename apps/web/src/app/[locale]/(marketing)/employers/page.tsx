import { getTranslations } from 'next-intl/server';
import Link from 'next/link';
import type { Route } from 'next';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowRight, faCircleCheck } from '@fortawesome/free-solid-svg-icons';
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
    const t = await getTranslations({ locale, namespace: 'marketing.employers_page' });
    return marketingMetadata({
        locale,
        title: t('meta.title'),
        description: t('meta.description'),
        pathByLocale: (l) => `/${l}/employers`,
    });
}

const FLC_FIELDS = [
    { id: 'license', value: 'FLC-LIC-2026-04829' },
    { id: 'issued', value: '2026-01-14' },
    { id: 'expires', value: '2027-01-13' },
    { id: 'mspa', value: 'DOL-MSPA-CA-04829-26' },
] as const;

export default async function EmployersPage({ params }: RouteProps) {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: 'marketing.employers_page' });

    return (
        <>
            <JsonLd data={organizationJsonLd()} />

            <MarketingPageHero
                eyebrow={t('eyebrow')}
                headline={t('headline')}
                intro={t('intro')}
                accent={
                    <Link
                        href={`/${locale}/employer/sign-up`}
                        className="btn btn-primary mt-2 self-start"
                    >
                        <span>{t('posting.cta')}</span>
                        <FontAwesomeIcon icon={faArrowRight} className="text-xs" />
                    </Link>
                }
            />

            <section className="bg-base-200 w-full border-secondary/15 border-t">
                <div className="container mx-auto grid grid-cols-1 gap-12 px-5 py-20 md:px-8 md:py-24 lg:grid-cols-[minmax(0,0.55fr)_minmax(0,1fr)] lg:px-20 lg:gap-20 lg:py-28">
                    <div className="flex flex-col gap-4">
                        <EyebrowLabel tone="soil" withRule>
                            {t('posting.eyebrow')}
                        </EyebrowLabel>
                        <h2 className="text-base-content font-serif text-3xl font-medium leading-tight tracking-tight md:text-4xl lg:text-5xl">
                            {t('posting.headline')}
                        </h2>
                    </div>
                    <p className="text-base-content max-w-prose font-sans text-base leading-relaxed lg:pt-2">
                        {t('posting.body')}
                    </p>
                </div>
            </section>

            <section id="flc-verification" className="bg-base-100 w-full scroll-mt-24">
                <div className="container mx-auto grid grid-cols-1 gap-12 px-5 py-20 md:px-8 md:py-24 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.65fr)] lg:px-20 lg:gap-20 lg:py-28">
                    <div className="flex flex-col gap-4">
                        <EyebrowLabel tone="soil" withRule>
                            {t('flc.eyebrow')}
                        </EyebrowLabel>
                        <h2 className="text-base-content font-serif text-3xl font-medium leading-tight tracking-tight md:text-4xl lg:text-5xl">
                            {t('flc.headline')}
                        </h2>
                        <p className="text-base-content max-w-prose font-sans text-base leading-relaxed">
                            {t('flc.body')}
                        </p>
                    </div>

                    <div className="border-secondary/20 bg-base-200 flex flex-col gap-5 border p-8 lg:p-10 lg:self-start">
                        <div className="flex items-center gap-3">
                            <FontAwesomeIcon icon={faCircleCheck} className="text-primary text-2xl" />
                            <span className="text-secondary font-mono text-xs font-bold uppercase tracking-[0.22em]">
                                {t('flc.record_label')}
                            </span>
                        </div>
                        <ul className="border-secondary/20 flex flex-col gap-0 border-y">
                            {FLC_FIELDS.map((f) => (
                                <li
                                    key={f.id}
                                    className="border-secondary/15 flex items-center justify-between gap-4 border-b py-3 last:border-b-0"
                                >
                                    <span className="text-secondary font-sans text-xs uppercase tracking-wider">
                                        {t(`flc.fields.${f.id}`)}
                                    </span>
                                    <span className="text-base-content font-mono text-sm font-semibold">
                                        {f.value}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </section>

            <section id="worker-search" className="bg-base-200 w-full border-secondary/15 border-t scroll-mt-24">
                <div className="container mx-auto grid grid-cols-1 gap-12 px-5 py-20 md:px-8 md:py-24 lg:grid-cols-[minmax(0,0.55fr)_minmax(0,1fr)] lg:px-20 lg:gap-20 lg:py-28">
                    <div className="flex flex-col gap-4">
                        <EyebrowLabel tone="soil" withRule>
                            {t('search.eyebrow')}
                        </EyebrowLabel>
                        <h2 className="text-base-content font-serif text-3xl font-medium leading-tight tracking-tight md:text-4xl lg:text-5xl">
                            {t('search.headline')}
                        </h2>
                    </div>
                    <p className="text-base-content max-w-prose font-sans text-base leading-relaxed lg:pt-2">
                        {t('search.body')}
                    </p>
                </div>
            </section>

            <section className="bg-primary text-primary-content w-full">
                <div className="container mx-auto flex flex-col items-start gap-6 px-5 py-16 md:flex-row md:items-center md:justify-between md:gap-12 md:px-8 md:py-20 lg:px-20">
                    <div className="flex flex-col gap-2">
                        <span className="text-accent font-mono text-xs font-bold uppercase tracking-[0.22em]">
                            {t('pricing.eyebrow')}
                        </span>
                        <p className="text-primary-content font-serif text-2xl leading-tight md:text-3xl">
                            {t('pricing.headline')}
                        </p>
                        <p className="text-primary-content/80 max-w-prose font-sans text-base leading-relaxed">
                            {t('pricing.body')}
                        </p>
                    </div>
                    <Link href={`/${locale}/#pricing` as Route} className="btn btn-accent shrink-0">
                        <span>{t('pricing.cta')}</span>
                        <FontAwesomeIcon icon={faArrowRight} className="text-xs" />
                    </Link>
                </div>
            </section>
        </>
    );
}
