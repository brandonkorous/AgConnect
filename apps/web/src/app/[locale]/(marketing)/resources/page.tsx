import { getTranslations } from 'next-intl/server';
import { EyebrowLabel } from '@/components/primitives/EyebrowLabel';
import { JsonLd } from '@/components/seo/JsonLd';
import { resourcesMetadata } from '@/lib/seo/metadata';
import { organizationJsonLd } from '@/lib/seo/json-ld';
import { WaitlistForm } from '@/components/landing/WaitlistForm';

type Locale = 'en' | 'es';
type RouteProps = { params: Promise<{ locale: Locale }> };

export const dynamicParams = false;
export const revalidate = 86400;

export async function generateMetadata({ params }: RouteProps) {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: 'marketing.resources' });
    return resourcesMetadata({ locale, title: t('meta.title'), description: t('meta.description') });
}

export default async function ResourcesPage({ params }: RouteProps) {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: 'marketing.resources' });

    return (
        <section className="bg-base-100 w-full">
            <JsonLd data={organizationJsonLd()} />

            <div className="mx-auto flex max-w-3xl flex-col gap-10 px-5 py-24 md:px-8 md:py-28 lg:py-32">
                <header className="flex flex-col gap-6">
                    <EyebrowLabel tone="soil" withRule>
                        {t('eyebrow')}
                    </EyebrowLabel>
                    <h1 className="text-base-content font-serif text-5xl font-semibold leading-tight tracking-tight md:text-6xl">
                        {t('headline')}
                    </h1>
                    <p className="text-base-content font-sans text-lg leading-relaxed">{t('intro')}</p>
                </header>

                <div className="card bg-base-200 max-w-xl">
                    <div className="card-body p-8 gap-4">
                        <WaitlistForm
                            audience="worker"
                            title=""
                            inputLabel={t('form_label')}
                            inputPlaceholder={t('form_placeholder')}
                            ctaText={t('form_cta')}
                            helpText={t('form_help')}
                            successText={t('form_success')}
                        />
                    </div>
                </div>

                <p className="text-secondary font-sans text-sm">
                    <a
                        href="mailto:editorial@agconn.com?subject=Topic%20suggestion"
                        className="link link-hover text-primary"
                    >
                        {t('suggest_topic')}
                    </a>
                </p>
            </div>
        </section>
    );
}
