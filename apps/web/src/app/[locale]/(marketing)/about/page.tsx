import { getTranslations } from 'next-intl/server';
import Link from 'next/link';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowRight, faLanguage, faShieldHalved, faRotateLeft } from '@fortawesome/free-solid-svg-icons';
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
    const t = await getTranslations({ locale, namespace: 'marketing.about' });
    return marketingMetadata({
        locale,
        title: t('meta.title'),
        description: t('meta.description'),
        pathByLocale: (l) => `/${l}/about`,
    });
}

const VALUES = [
    { id: 'bilingual', icon: faLanguage },
    { id: 'verified', icon: faShieldHalved },
    { id: 'portable', icon: faRotateLeft },
] as const;

export default async function AboutPage({ params }: RouteProps) {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: 'marketing.about' });

    return (
        <>
            <JsonLd data={organizationJsonLd()} />
            <Breadcrumb locale={locale} path="/about" />

            <MarketingPageHero
                eyebrow={t('eyebrow')}
                headline={t('headline')}
                intro={t('intro')}
            />

            <section id="mission" className="bg-primary text-primary-content w-full">
                <div className="container mx-auto grid grid-cols-1 gap-12 px-5 py-20 md:px-8 md:py-24 lg:grid-cols-[minmax(0,0.55fr)_minmax(0,1fr)] lg:px-20 lg:gap-20 lg:py-28">
                    <div className="flex flex-col gap-4">
                        <span className="text-accent font-mono text-xs font-bold uppercase tracking-[0.22em]">
                            {t('mission.eyebrow')}
                        </span>
                        <h2 className="text-primary-content font-serif text-3xl font-medium leading-tight tracking-tight md:text-4xl lg:text-5xl">
                            {t('mission.headline')}
                        </h2>
                    </div>
                    <p className="text-primary-content/85 font-sans text-lg leading-relaxed lg:pt-2">
                        {t('mission.body')}
                    </p>
                </div>
            </section>

            <section className="bg-base-100 w-full">
                <div className="container mx-auto flex flex-col gap-12 px-5 py-20 md:px-8 md:py-24 lg:px-20 lg:py-28">
                    <div className="flex flex-col gap-4">
                        <EyebrowLabel tone="soil" withRule>
                            {t('values.eyebrow')}
                        </EyebrowLabel>
                        <h2 className="text-base-content font-serif text-3xl font-medium leading-tight tracking-tight md:text-4xl lg:text-5xl">
                            {t('values.headline')}
                        </h2>
                    </div>
                    <div className="grid grid-cols-1 gap-px bg-secondary/15 md:grid-cols-3">
                        {VALUES.map((v) => (
                            <article key={v.id} className="bg-base-100 flex flex-col gap-4 p-8 lg:p-10">
                                <FontAwesomeIcon icon={v.icon} className="text-primary text-2xl" />
                                <h3 className="text-base-content font-serif text-xl font-semibold leading-tight tracking-tight">
                                    {t(`values.${v.id}.title`)}
                                </h3>
                                <p className="text-secondary font-sans text-sm leading-relaxed">
                                    {t(`values.${v.id}.body`)}
                                </p>
                            </article>
                        ))}
                    </div>
                </div>
            </section>

            <section className="bg-base-200 w-full border-secondary/15 border-t">
                <div className="container mx-auto grid grid-cols-1 gap-12 px-5 py-20 md:px-8 md:py-24 lg:grid-cols-[minmax(0,0.55fr)_minmax(0,1fr)] lg:px-20 lg:gap-20 lg:py-28">
                    <div className="flex flex-col gap-4">
                        <EyebrowLabel tone="soil" withRule>
                            {t('org.eyebrow')}
                        </EyebrowLabel>
                        <h2 className="text-base-content font-serif text-3xl font-medium leading-tight tracking-tight md:text-4xl lg:text-5xl">
                            {t('org.headline')}
                        </h2>
                    </div>
                    <div className="flex flex-col gap-4 lg:pt-2">
                        <p className="text-base-content max-w-prose font-sans text-base leading-relaxed">
                            {t('org.body')}
                        </p>
                        <Link
                            href={`/${locale}/impact`}
                            className="text-primary mt-4 inline-flex items-center gap-2 self-start font-sans text-base font-semibold hover:underline"
                        >
                            <span>{t('org.cta')}</span>
                            <FontAwesomeIcon icon={faArrowRight} className="text-sm" />
                        </Link>
                    </div>
                </div>
            </section>
        </>
    );
}
