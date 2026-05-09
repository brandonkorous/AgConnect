import { getTranslations } from 'next-intl/server';
import Link from 'next/link';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowRight, faFilePdf, faComments, faIdCard } from '@fortawesome/free-solid-svg-icons';
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
    const t = await getTranslations({ locale, namespace: 'marketing.promotora' });
    return marketingMetadata({
        locale,
        title: t('meta.title'),
        description: t('meta.description'),
        pathByLocale: (l) => `/${l}/promotora`,
    });
}

const MATERIALS = [
    { id: 'flyer', icon: faFilePdf, href: 'mailto:partnerships@agconn.com?subject=Promotora%20flyer%20request' },
    { id: 'script', icon: faComments, href: 'mailto:partnerships@agconn.com?subject=Promotora%20conversation%20script%20request' },
    { id: 'cards', icon: faIdCard, href: 'mailto:partnerships@agconn.com?subject=Wallet%20cards%20request' },
] as const;

export default async function PromotoraPage({ params }: RouteProps) {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: 'marketing.promotora' });

    return (
        <>
            <JsonLd data={organizationJsonLd()} />

            <MarketingPageHero
                eyebrow={t('eyebrow')}
                headline={t('headline')}
                intro={t('intro')}
            />

            <section className="bg-base-200 w-full border-secondary/15 border-t">
                <div className="container mx-auto flex flex-col gap-12 px-5 py-20 md:px-8 md:py-24 lg:px-20 lg:py-28">
                    <div className="flex flex-col gap-4">
                        <EyebrowLabel tone="soil" withRule>
                            {t('materials.eyebrow')}
                        </EyebrowLabel>
                        <h2 className="text-base-content font-serif text-3xl font-medium leading-tight tracking-tight md:text-4xl lg:text-5xl">
                            {t('materials.headline')}
                        </h2>
                    </div>

                    <div className="grid grid-cols-1 gap-px bg-secondary/15 md:grid-cols-3">
                        {MATERIALS.map((m) => (
                            <article key={m.id} className="bg-base-100 flex flex-col gap-4 p-8 lg:p-10">
                                <FontAwesomeIcon icon={m.icon} className="text-primary text-2xl" />
                                <h3 className="text-base-content font-serif text-xl font-semibold leading-tight tracking-tight">
                                    {t(`materials.${m.id}.title`)}
                                </h3>
                                <p className="text-secondary font-sans text-sm leading-relaxed">
                                    {t(`materials.${m.id}.body`)}
                                </p>
                                <a
                                    href={m.href}
                                    className="text-primary mt-auto inline-flex items-center gap-2 self-start font-sans text-sm font-semibold hover:underline"
                                >
                                    <span>{t(`materials.${m.id}.cta`)}</span>
                                    <FontAwesomeIcon icon={faArrowRight} className="text-xs" />
                                </a>
                            </article>
                        ))}
                    </div>
                </div>
            </section>

            <section className="bg-base-100 w-full">
                <div className="container mx-auto grid grid-cols-1 gap-12 px-5 py-20 md:px-8 md:py-24 lg:grid-cols-[minmax(0,0.55fr)_minmax(0,1fr)] lg:px-20 lg:gap-20 lg:py-28">
                    <div className="flex flex-col gap-4">
                        <EyebrowLabel tone="soil" withRule>
                            {t('training.eyebrow')}
                        </EyebrowLabel>
                        <h2 className="text-base-content font-serif text-3xl font-medium leading-tight tracking-tight md:text-4xl lg:text-5xl">
                            {t('training.headline')}
                        </h2>
                    </div>
                    <div className="flex flex-col gap-4 lg:pt-6">
                        <p className="text-base-content max-w-prose font-sans text-lg leading-relaxed">
                            {t('training.body')}
                        </p>
                        <Link
                            href={`/${locale}/resources`}
                            className="text-primary mt-4 inline-flex items-center gap-2 self-start font-sans text-base font-semibold hover:underline"
                        >
                            <span>{t('training.cta')}</span>
                            <FontAwesomeIcon icon={faArrowRight} className="text-sm" />
                        </Link>
                    </div>
                </div>
            </section>

            <section className="bg-primary text-primary-content w-full">
                <div className="container mx-auto flex flex-col items-start gap-6 px-5 py-16 md:flex-row md:items-center md:justify-between md:gap-12 md:px-8 md:py-20 lg:px-20">
                    <div className="flex flex-col gap-2">
                        <span className="text-accent font-mono text-xs font-bold uppercase tracking-[0.22em]">
                            {t('partner.eyebrow')}
                        </span>
                        <p className="text-primary-content font-serif text-2xl leading-tight md:text-3xl">
                            {t('partner.headline')}
                        </p>
                        <p className="text-primary-content/80 max-w-prose font-sans text-base leading-relaxed">
                            {t('partner.body')}
                        </p>
                    </div>
                    <a
                        href="mailto:partnerships@agconn.com"
                        className="btn btn-accent shrink-0"
                    >
                        <span>{t('partner.cta')}</span>
                        <FontAwesomeIcon icon={faArrowRight} className="text-xs" />
                    </a>
                </div>
            </section>
        </>
    );
}
