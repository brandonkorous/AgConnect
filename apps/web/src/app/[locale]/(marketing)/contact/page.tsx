import { getTranslations } from 'next-intl/server';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEnvelope, faArrowRight } from '@fortawesome/free-solid-svg-icons';
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
    const t = await getTranslations({ locale, namespace: 'marketing.contact' });
    return marketingMetadata({
        locale,
        title: t('meta.title'),
        description: t('meta.description'),
        pathByLocale: (l) => `/${l}/contact`,
    });
}

const ROUTES = ['support', 'sales', 'partnerships', 'press', 'editorial'] as const;

export default async function ContactPage({ params }: RouteProps) {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: 'marketing.contact' });

    return (
        <>
            <JsonLd data={organizationJsonLd()} />

            <MarketingPageHero eyebrow={t('eyebrow')} headline={t('headline')} intro={t('intro')} />

            <section className="bg-base-200 w-full border-secondary/15 border-t">
                <div className="container mx-auto flex flex-col gap-12 px-5 py-20 md:px-8 md:py-24 lg:px-20 lg:py-28">
                    <div className="flex flex-col gap-4">
                        <EyebrowLabel tone="soil" withRule>
                            {t('routes.eyebrow')}
                        </EyebrowLabel>
                        <h2 className="text-base-content font-serif text-3xl font-medium leading-tight tracking-tight md:text-4xl lg:text-5xl">
                            {t('routes.headline')}
                        </h2>
                    </div>

                    <ul className="border-secondary/20 flex flex-col border-y">
                        {ROUTES.map((route) => (
                            <li key={route} className="border-secondary/15 border-b last:border-b-0">
                                <a
                                    href={`mailto:${t(`routes.${route}.email`)}`}
                                    className="hover:bg-base-100 flex flex-col gap-3 px-2 py-6 transition-colors md:flex-row md:items-center md:gap-8 md:py-8"
                                >
                                    <div className="flex flex-col gap-1 md:w-72 md:shrink-0">
                                        <span className="text-secondary font-mono text-xs font-bold uppercase tracking-[0.22em]">
                                            {t(`routes.${route}.label`)}
                                        </span>
                                        <span className="text-base-content font-mono text-base font-semibold">
                                            {t(`routes.${route}.email`)}
                                        </span>
                                    </div>
                                    <p className="text-base-content flex-1 font-sans text-base leading-relaxed">
                                        {t(`routes.${route}.body`)}
                                    </p>
                                    <FontAwesomeIcon
                                        icon={faEnvelope}
                                        className="text-secondary hidden text-base md:block"
                                    />
                                </a>
                            </li>
                        ))}
                    </ul>
                </div>
            </section>

            <section className="bg-base-100 w-full">
                <div className="container mx-auto flex flex-col gap-6 px-5 py-20 md:px-8 md:py-24 lg:px-20 lg:py-28">
                    <EyebrowLabel tone="soil" withRule>
                        {t('nap.eyebrow')}
                    </EyebrowLabel>
                    <h2 className="text-base-content font-serif text-3xl font-medium leading-tight tracking-tight md:text-4xl lg:text-5xl">
                        {t('nap.headline')}
                    </h2>
                    <p className="text-base-content font-sans text-lg leading-relaxed">{t('nap.body')}</p>
                    <p className="text-secondary font-sans text-sm italic">{t('nap.note')}</p>
                </div>
            </section>
        </>
    );
}
