import { getTranslations } from 'next-intl/server';
import {
    faMoneyBill1Wave,
    faClock,
    faMugSaucer,
    faBus,
    faShieldHalved,
    faIdCard,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
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
    const t = await getTranslations({ locale, namespace: 'marketing.worker_rights' });
    return marketingMetadata({
        locale,
        title: t('meta.title'),
        description: t('meta.description'),
        pathByLocale: (l) => `/${l}/worker-rights`,
    });
}

const TOPICS = [
    { id: 'wage', icon: faMoneyBill1Wave },
    { id: 'overtime', icon: faClock },
    { id: 'breaks', icon: faMugSaucer },
    { id: 'transport', icon: faBus },
    { id: 'retaliation', icon: faShieldHalved },
    { id: 'immigration', icon: faIdCard },
] as const;

const HELP = ['crla', 'dlse'] as const;

export default async function WorkerRightsPage({ params }: RouteProps) {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: 'marketing.worker_rights' });

    return (
        <>
            <JsonLd data={organizationJsonLd()} />
            <Breadcrumb locale={locale} path="/worker-rights" />

            <MarketingPageHero
                eyebrow={t('eyebrow')}
                headline={t('headline')}
                intro={t('intro')}
            />

            <section className="bg-base-200 w-full border-secondary/15 border-t">
                <div className="container mx-auto flex flex-col gap-12 px-5 py-20 md:px-8 md:py-24 lg:px-20 lg:py-28">
                    <div className="flex flex-col gap-4">
                        <EyebrowLabel tone="soil" withRule>
                            {t('topics.eyebrow')}
                        </EyebrowLabel>
                        <h2 className="text-base-content font-serif text-3xl font-medium leading-tight tracking-tight md:text-4xl lg:text-5xl">
                            {t('topics.headline')}
                        </h2>
                    </div>

                    <div className="grid grid-cols-1 gap-px bg-secondary/15 md:grid-cols-2 lg:grid-cols-3">
                        {TOPICS.map((topic) => (
                            <article key={topic.id} className="bg-base-100 flex flex-col gap-4 p-8 lg:p-10">
                                <FontAwesomeIcon icon={topic.icon} className="text-primary text-2xl" />
                                <h3 className="text-base-content font-serif text-xl font-semibold leading-tight tracking-tight">
                                    {t(`topics.${topic.id}.title`)}
                                </h3>
                                <p className="text-secondary font-sans text-sm leading-relaxed">
                                    {t(`topics.${topic.id}.body`)}
                                </p>
                            </article>
                        ))}
                    </div>
                </div>
            </section>

            <section className="bg-base-100 w-full">
                <div className="container mx-auto flex flex-col gap-10 px-5 py-20 md:px-8 md:py-24 lg:px-20 lg:py-28">
                    <div className="flex flex-col gap-4">
                        <EyebrowLabel tone="soil" withRule>
                            {t('help.eyebrow')}
                        </EyebrowLabel>
                        <h2 className="text-base-content font-serif text-3xl font-medium leading-tight tracking-tight md:text-4xl lg:text-5xl">
                            {t('help.headline')}
                        </h2>
                    </div>

                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 md:gap-8">
                        {HELP.map((id) => (
                            <article
                                key={id}
                                className="border-secondary/20 bg-base-100 flex flex-col gap-4 border p-8 lg:p-10"
                            >
                                <h3 className="text-base-content font-serif text-2xl font-medium leading-tight tracking-tight">
                                    {t(`help.${id}.name`)}
                                </h3>
                                <p className="text-secondary font-sans text-base leading-relaxed">
                                    {t(`help.${id}.body`)}
                                </p>
                                <p className="text-primary font-mono text-sm font-bold uppercase tracking-[0.18em]">
                                    {t(`help.${id}.cta`)}
                                </p>
                            </article>
                        ))}
                    </div>

                    <p className="text-secondary border-secondary/15 mt-4 border-t pt-6 font-sans text-sm italic leading-relaxed">
                        {t('help.disclaimer')}
                    </p>
                </div>
            </section>
        </>
    );
}
