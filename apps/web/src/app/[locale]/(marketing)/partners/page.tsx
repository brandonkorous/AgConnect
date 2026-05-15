import { getTranslations } from 'next-intl/server';
import Link from 'next/link';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowRight } from '@fortawesome/free-solid-svg-icons';
import { EyebrowLabel } from '@/components/primitives/EyebrowLabel';
import { JsonLd } from '@/components/seo/JsonLd';
import { Breadcrumb } from '@/components/seo/Breadcrumb';
import { marketingMetadata } from '@/lib/seo/metadata';
import { organizationJsonLd } from '@/lib/seo/json-ld';
import { MarketingPageHero } from '@/components/marketing/MarketingPageHero';

type Locale = 'en' | 'es';
type RouteProps = { params: Promise<{ locale: Locale }> };

export const dynamicParams = false;
export const revalidate = 86400;

export async function generateMetadata({ params }: RouteProps) {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: 'marketing.partners_page' });
    return marketingMetadata({
        locale,
        title: t('meta.title'),
        description: t('meta.description'),
        pathByLocale: (l) => `/${l}/partners`,
    });
}

export default async function PartnersPage({ params }: RouteProps) {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: 'marketing.partners_page' });

    return (
        <>
            <JsonLd data={organizationJsonLd()} />
            <Breadcrumb locale={locale} path="/partners" />

            <MarketingPageHero eyebrow={t('eyebrow')} headline={t('headline')} intro={t('intro')} />

            <section id="training-orgs" className="bg-base-200 w-full border-secondary/15 border-t scroll-mt-24">
                <div className="container mx-auto grid grid-cols-1 gap-12 px-5 py-20 md:px-8 md:py-24 lg:grid-cols-[minmax(0,0.55fr)_minmax(0,1fr)] lg:px-20 lg:gap-20 lg:py-28">
                    <div className="flex flex-col gap-4">
                        <EyebrowLabel tone="soil" withRule>
                            {t('training_orgs.eyebrow')}
                        </EyebrowLabel>
                        <h2 className="text-base-content font-serif text-3xl font-medium leading-tight tracking-tight md:text-4xl lg:text-5xl">
                            {t('training_orgs.headline')}
                        </h2>
                    </div>
                    <div className="flex flex-col gap-6 lg:pt-2">
                        <p className="text-base-content max-w-prose font-sans text-base leading-relaxed">
                            {t('training_orgs.body')}
                        </p>
                        <a
                            href="mailto:partnerships@agconn.com?subject=Training%20org%20account"
                            className="text-primary mt-2 inline-flex items-center gap-2 self-start font-sans text-base font-semibold hover:underline"
                        >
                            <span>{t('training_orgs.cta')}</span>
                            <FontAwesomeIcon icon={faArrowRight} className="text-sm" />
                        </a>
                    </div>
                </div>
            </section>

            <section id="workforce-boards" className="bg-base-100 w-full scroll-mt-24">
                <div className="container mx-auto grid grid-cols-1 gap-12 px-5 py-20 md:px-8 md:py-24 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.55fr)] lg:px-20 lg:gap-20 lg:py-28">
                    <div className="flex flex-col gap-6">
                        <EyebrowLabel tone="soil" withRule>
                            {t('workforce_boards.eyebrow')}
                        </EyebrowLabel>
                        <h2 className="text-base-content font-serif text-3xl font-medium leading-tight tracking-tight md:text-4xl lg:text-5xl">
                            {t('workforce_boards.headline')}
                        </h2>
                        <p className="text-base-content max-w-prose font-sans text-base leading-relaxed">
                            {t('workforce_boards.body')}
                        </p>
                    </div>
                    <div className="border-secondary/20 bg-base-200 flex flex-col gap-3 self-start border p-6 lg:p-8">
                        <span className="text-secondary font-mono text-xs font-bold uppercase tracking-[0.22em]">
                            {t('workforce_boards.eyebrow')}
                        </span>
                        <a
                            href="mailto:partnerships@agconn.com?subject=Tenant%20instance"
                            className="text-primary inline-flex items-center gap-2 self-start font-sans text-base font-semibold hover:underline"
                        >
                            <span>{t('workforce_boards.cta')}</span>
                            <FontAwesomeIcon icon={faArrowRight} className="text-sm" />
                        </a>
                    </div>
                </div>
            </section>

            <section id="wioa-exports" className="bg-primary text-primary-content w-full scroll-mt-24">
                <div className="container mx-auto grid grid-cols-1 gap-12 px-5 py-20 md:px-8 md:py-24 lg:grid-cols-[minmax(0,0.55fr)_minmax(0,1fr)] lg:px-20 lg:gap-20 lg:py-28">
                    <div className="flex flex-col gap-4">
                        <span className="text-accent font-mono text-xs font-bold uppercase tracking-[0.22em]">
                            {t('wioa.eyebrow')}
                        </span>
                        <h2 className="text-primary-content font-serif text-3xl font-medium leading-tight tracking-tight md:text-4xl lg:text-5xl">
                            {t('wioa.headline')}
                        </h2>
                    </div>
                    <div className="flex flex-col gap-6 lg:pt-2">
                        <p className="text-primary-content/85 max-w-prose font-sans text-base leading-relaxed">
                            {t('wioa.body')}
                        </p>
                        <Link
                            href={`/${locale}/impact`}
                            className="text-accent mt-2 inline-flex items-center gap-2 self-start font-sans text-base font-semibold hover:underline"
                        >
                            <span>{t('wioa.cta')}</span>
                            <FontAwesomeIcon icon={faArrowRight} className="text-sm" />
                        </Link>
                    </div>
                </div>
            </section>
        </>
    );
}
