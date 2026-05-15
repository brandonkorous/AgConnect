import { getTranslations } from 'next-intl/server';
import Link from 'next/link';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowRight, faShieldHalved } from '@fortawesome/free-solid-svg-icons';
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
    const t = await getTranslations({ locale, namespace: 'marketing.how_it_works' });
    return marketingMetadata({
        locale,
        title: t('meta.title'),
        description: t('meta.description'),
        pathByLocale: (l) => `/${l}/how-it-works`,
    });
}

const SECTIONS = [
    { id: 'workers', steps: ['s1', 's2', 's3', 's4'], background: 'bg-base-200' },
    { id: 'employers', steps: ['s1', 's2', 's3', 's4'], background: 'bg-base-100' },
    { id: 'training', steps: ['s1', 's2', 's3'], background: 'bg-base-200' },
    { id: 'workforce', steps: ['s1', 's2', 's3'], background: 'bg-base-100' },
] as const;

export default async function HowItWorksPage({ params }: RouteProps) {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: 'marketing.how_it_works' });

    return (
        <>
            <JsonLd data={organizationJsonLd()} />
            <Breadcrumb locale={locale} path="/how-it-works" />

            <MarketingPageHero eyebrow={t('eyebrow')} headline={t('headline')} intro={t('intro')} />

            {SECTIONS.map((s, i) => (
                <section
                    key={s.id}
                    id={s.id}
                    className={`${s.background} ${i > 0 ? 'border-secondary/15 border-t' : ''} w-full scroll-mt-24`}
                >
                    <div className="container mx-auto flex flex-col gap-12 px-5 py-20 md:px-8 md:py-24 lg:px-20 lg:py-28">
                        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,0.45fr)_minmax(0,1fr)] lg:gap-16">
                            <div className="flex flex-col gap-4">
                                <EyebrowLabel tone="soil" withRule>
                                    {t(`${s.id}.eyebrow`)}
                                </EyebrowLabel>
                                <h2 className="text-base-content font-serif text-3xl font-medium leading-tight tracking-tight md:text-4xl lg:text-5xl">
                                    {t(`${s.id}.headline`)}
                                </h2>
                            </div>
                            <ol className="border-secondary/20 flex flex-col border-y">
                                {s.steps.map((step) => (
                                    <li
                                        key={step}
                                        className="border-secondary/15 grid grid-cols-1 gap-3 border-b py-6 last:border-b-0 md:grid-cols-[minmax(0,0.45fr)_minmax(0,1fr)] md:gap-8 md:py-7"
                                    >
                                        <h3 className="text-base-content font-serif text-xl font-medium leading-tight tracking-tight md:text-2xl">
                                            {t(`${s.id}.${step}.title`)}
                                        </h3>
                                        <p className="text-base-content max-w-prose font-sans text-base leading-relaxed">
                                            {t(`${s.id}.${step}.body`)}
                                        </p>
                                    </li>
                                ))}
                            </ol>
                        </div>
                    </div>
                </section>
            ))}

            <section id="trust" className="bg-primary text-primary-content w-full scroll-mt-24">
                <div className="container mx-auto grid grid-cols-1 gap-10 px-5 py-20 md:px-8 md:py-24 lg:grid-cols-[minmax(0,0.55fr)_minmax(0,1fr)] lg:px-20 lg:gap-20 lg:py-28">
                    <div className="flex flex-col gap-4">
                        <span className="text-accent font-mono text-xs font-bold uppercase tracking-[0.22em]">
                            {t('trust.eyebrow')}
                        </span>
                        <h2 className="text-primary-content font-serif text-3xl font-medium leading-tight tracking-tight md:text-4xl lg:text-5xl">
                            {t('trust.headline')}
                        </h2>
                    </div>
                    <div className="flex flex-col gap-6 lg:pt-2">
                        <FontAwesomeIcon icon={faShieldHalved} className="text-accent text-3xl" />
                        <p className="text-primary-content/85 max-w-prose font-sans text-base leading-relaxed">
                            {t('trust.body')}
                        </p>
                        <Link
                            href={`/${locale}/trust`}
                            className="text-accent mt-2 inline-flex items-center gap-2 self-start font-sans text-base font-semibold hover:underline"
                        >
                            <span>Trust commitments</span>
                            <FontAwesomeIcon icon={faArrowRight} className="text-sm" />
                        </Link>
                    </div>
                </div>
            </section>

            <section className="bg-base-200 w-full border-secondary/15 border-t">
                <div className="container mx-auto flex flex-col gap-10 px-5 py-20 md:px-8 md:py-24 lg:px-20 lg:py-28">
                    <div className="flex flex-col gap-4">
                        <EyebrowLabel tone="soil" withRule>
                            {t('cta.eyebrow')}
                        </EyebrowLabel>
                        <h2 className="text-base-content font-serif text-3xl font-medium leading-tight tracking-tight md:text-4xl lg:text-5xl">
                            {t('cta.headline')}
                        </h2>
                    </div>
                    <div className="grid grid-cols-1 gap-px bg-secondary/15 md:grid-cols-2 lg:grid-cols-4">
                        <Link
                            href={`/${locale}/workers`}
                            className="bg-base-100 hover:bg-base-200 group flex flex-col gap-3 p-8 transition-colors lg:p-10"
                        >
                            <span className="text-secondary font-mono text-xs font-bold uppercase tracking-[0.22em]">
                                {t('workers.eyebrow')}
                            </span>
                            <span className="text-base-content font-serif text-xl font-medium leading-tight tracking-tight">
                                {t('cta.button_workers')}
                            </span>
                            <FontAwesomeIcon
                                icon={faArrowRight}
                                className="text-primary mt-auto text-sm transition-transform group-hover:translate-x-1"
                            />
                        </Link>
                        <Link
                            href={`/${locale}/employers`}
                            className="bg-base-100 hover:bg-base-200 group flex flex-col gap-3 p-8 transition-colors lg:p-10"
                        >
                            <span className="text-secondary font-mono text-xs font-bold uppercase tracking-[0.22em]">
                                {t('employers.eyebrow')}
                            </span>
                            <span className="text-base-content font-serif text-xl font-medium leading-tight tracking-tight">
                                {t('cta.button_employers')}
                            </span>
                            <FontAwesomeIcon
                                icon={faArrowRight}
                                className="text-primary mt-auto text-sm transition-transform group-hover:translate-x-1"
                            />
                        </Link>
                        <Link
                            href={`/${locale}/partners#training-orgs`}
                            className="bg-base-100 hover:bg-base-200 group flex flex-col gap-3 p-8 transition-colors lg:p-10"
                        >
                            <span className="text-secondary font-mono text-xs font-bold uppercase tracking-[0.22em]">
                                {t('training.eyebrow')}
                            </span>
                            <span className="text-base-content font-serif text-xl font-medium leading-tight tracking-tight">
                                {t('cta.button_training')}
                            </span>
                            <FontAwesomeIcon
                                icon={faArrowRight}
                                className="text-primary mt-auto text-sm transition-transform group-hover:translate-x-1"
                            />
                        </Link>
                        <Link
                            href={`/${locale}/partners#workforce-boards`}
                            className="bg-base-100 hover:bg-base-200 group flex flex-col gap-3 p-8 transition-colors lg:p-10"
                        >
                            <span className="text-secondary font-mono text-xs font-bold uppercase tracking-[0.22em]">
                                {t('workforce.eyebrow')}
                            </span>
                            <span className="text-base-content font-serif text-xl font-medium leading-tight tracking-tight">
                                {t('cta.button_workforce')}
                            </span>
                            <FontAwesomeIcon
                                icon={faArrowRight}
                                className="text-primary mt-auto text-sm transition-transform group-hover:translate-x-1"
                            />
                        </Link>
                    </div>
                </div>
            </section>
        </>
    );
}
