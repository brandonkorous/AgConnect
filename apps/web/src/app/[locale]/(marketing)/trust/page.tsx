import { getTranslations } from 'next-intl/server';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faArrowRight,
    faBan,
    faIdCard,
    faLock,
    faRightFromBracket,
    faShieldHalved,
    faKey,
    faServer,
    faClipboardList,
} from '@fortawesome/free-solid-svg-icons';
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
    const t = await getTranslations({ locale, namespace: 'marketing.trust' });
    return marketingMetadata({
        locale,
        title: t('meta.title'),
        description: t('meta.description'),
        pathByLocale: (l) => `/${l}/trust`,
    });
}

const PRINCIPLES = [
    { id: 'no_sale', icon: faBan },
    { id: 'no_immigration', icon: faIdCard },
    { id: 'no_share', icon: faLock },
    { id: 'no_lockin', icon: faRightFromBracket },
    { id: 'no_dark_patterns', icon: faShieldHalved },
] as const;

const TECH = [
    { id: 'isolation', icon: faServer },
    { id: 'encryption', icon: faKey },
    { id: 'audit', icon: faClipboardList },
] as const;

export default async function TrustPage({ params }: RouteProps) {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: 'marketing.trust' });

    return (
        <>
            <JsonLd data={organizationJsonLd()} />

            <MarketingPageHero eyebrow={t('eyebrow')} headline={t('headline')} intro={t('intro')} />

            <section className="bg-base-200 w-full border-secondary/15 border-t">
                <div className="container mx-auto flex flex-col gap-12 px-5 py-20 md:px-8 md:py-24 lg:px-20 lg:py-28">
                    <div className="flex flex-col gap-4">
                        <EyebrowLabel tone="soil" withRule>
                            {t('principles.eyebrow')}
                        </EyebrowLabel>
                        <h2 className="text-base-content font-serif text-3xl font-medium leading-tight tracking-tight md:text-4xl lg:text-5xl">
                            {t('principles.headline')}
                        </h2>
                    </div>
                    <div className="grid grid-cols-1 gap-px bg-secondary/15 md:grid-cols-2 lg:grid-cols-5">
                        {PRINCIPLES.map((p) => (
                            <article key={p.id} className="bg-base-100 flex flex-col gap-4 p-6 lg:p-8">
                                <FontAwesomeIcon icon={p.icon} className="text-primary text-xl" />
                                <h3 className="text-base-content font-serif text-lg font-semibold leading-tight tracking-tight">
                                    {t(`principles.${p.id}.title`)}
                                </h3>
                                <p className="text-secondary font-sans text-sm leading-relaxed">
                                    {t(`principles.${p.id}.body`)}
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
                            {t('tech.eyebrow')}
                        </EyebrowLabel>
                        <h2 className="text-base-content font-serif text-3xl font-medium leading-tight tracking-tight md:text-4xl lg:text-5xl">
                            {t('tech.headline')}
                        </h2>
                    </div>
                    <div className="grid grid-cols-1 gap-px bg-secondary/15 md:grid-cols-3">
                        {TECH.map((tech) => (
                            <article key={tech.id} className="bg-base-100 flex flex-col gap-4 p-8 lg:p-10">
                                <FontAwesomeIcon icon={tech.icon} className="text-primary text-2xl" />
                                <h3 className="text-base-content font-serif text-xl font-semibold leading-tight tracking-tight">
                                    {t(`tech.${tech.id}.title`)}
                                </h3>
                                <p className="text-secondary font-sans text-sm leading-relaxed">
                                    {t(`tech.${tech.id}.body`)}
                                </p>
                            </article>
                        ))}
                    </div>
                </div>
            </section>

            <section className="bg-primary text-primary-content w-full">
                <div className="container mx-auto flex flex-col items-start gap-6 px-5 py-16 md:flex-row md:items-center md:justify-between md:gap-12 md:px-8 md:py-20 lg:px-20">
                    <div className="flex flex-col gap-2">
                        <span className="text-accent font-mono text-xs font-bold uppercase tracking-[0.22em]">
                            {t('report.eyebrow')}
                        </span>
                        <p className="text-primary-content font-serif text-2xl leading-tight md:text-3xl">
                            {t('report.headline')}
                        </p>
                        <p className="text-primary-content/80 max-w-prose font-sans text-base leading-relaxed">
                            {t('report.body')}
                        </p>
                    </div>
                    <a href="mailto:security@agconn.com" className="btn btn-accent shrink-0">
                        <span>{t('report.cta')}</span>
                        <FontAwesomeIcon icon={faArrowRight} className="text-xs" />
                    </a>
                </div>
            </section>
        </>
    );
}
