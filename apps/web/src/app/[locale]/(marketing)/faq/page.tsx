import { getTranslations } from 'next-intl/server';
import Link from 'next/link';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowRight, faEnvelope } from '@fortawesome/free-solid-svg-icons';
import { EyebrowLabel } from '@/components/primitives/EyebrowLabel';
import { FaqAccordion, type FaqEntry } from '@/components/landing/FaqAccordion';
import { JsonLd } from '@/components/seo/JsonLd';
import { faqMetadata } from '@/lib/seo/metadata';
import { faqPageJsonLd, organizationJsonLd } from '@/lib/seo/json-ld';

const SHARED_IDS = ['1', '2', '3', '4', '5', '6', '7', '8'] as const;
const EXTRA_IDS = [
    'data_privacy',
    'wage_disputes',
    'training_cert_validity',
    'employer_payouts',
    'tenant_onboarding',
    'platform_uptime',
] as const;

type Locale = 'en' | 'es';
type RouteProps = { params: Promise<{ locale: Locale }> };

export const dynamicParams = false;
export const revalidate = 86400;

export async function generateMetadata({ params }: RouteProps) {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: 'marketing.faq_page' });
    return faqMetadata({
        locale,
        title: t('meta.title'),
        description: t('meta.description'),
    });
}

export default async function FaqPage({ params }: RouteProps) {
    const { locale } = await params;
    const sharedT = await getTranslations({ locale, namespace: 'landing.faq.items' });
    const extrasT = await getTranslations({ locale, namespace: 'marketing.faq_extras' });
    const pageT = await getTranslations({ locale, namespace: 'marketing.faq_page' });

    const shared: FaqEntry[] = SHARED_IDS.map((id) => ({
        id: `q${id}`,
        question: sharedT(`${id}.q`),
        answer: sharedT(`${id}.a`),
    }));
    const extras: FaqEntry[] = EXTRA_IDS.map((id) => ({
        id,
        question: extrasT(`${id}.question`),
        answer: extrasT(`${id}.answer`),
    }));

    return (
        <section className="bg-base-100 w-full">
            <JsonLd data={organizationJsonLd()} />
            <JsonLd
                data={faqPageJsonLd({
                    locale,
                    entries: [...shared, ...extras].map((e) => ({ question: e.question, answer: e.answer })),
                })}
            />

            <div className="mx-auto flex max-w-3xl flex-col gap-12 px-5 py-24 md:px-8 md:py-28 lg:py-32">
                <header className="flex flex-col gap-6">
                    <EyebrowLabel tone="soil" withRule>
                        {pageT('eyebrow')}
                    </EyebrowLabel>
                    <h1 className="text-base-content font-serif text-5xl font-semibold leading-tight tracking-tight md:text-6xl">
                        {pageT('headline')}
                    </h1>
                    <p className="text-base-content font-sans text-lg leading-relaxed">
                        {pageT('intro')}
                    </p>
                </header>

                <FaqAccordion entries={shared} initialOpen={[]} />

                <div className="border-base-300 flex items-center gap-3 border-y py-3">
                    <span className="text-secondary font-mono text-xs uppercase tracking-[0.18em]">
                        {pageT('extras_label')}
                    </span>
                </div>

                <FaqAccordion entries={extras} initialOpen={[]} />

                <aside className="card card-bordered border-base-300 bg-base-200">
                    <div className="card-body p-8 gap-3">
                        <h2 className="card-title text-base-content font-serif text-2xl italic font-medium">
                            {pageT('still_questions.headline')}
                        </h2>
                        <p className="text-base-content font-sans text-base leading-relaxed">
                            {pageT('still_questions.body')}
                        </p>
                        <div className="card-actions mt-2 flex flex-wrap gap-3">
                            <a
                                href="mailto:support@agconn.com?subject=AgConn%20FAQ%20question"
                                className="btn btn-primary"
                            >
                                <FontAwesomeIcon icon={faEnvelope} className="text-sm" />
                                <span>{pageT('still_questions.cta_email')}</span>
                            </a>
                            <Link href={`/${locale}`} className="btn btn-ghost">
                                <span>{pageT('still_questions.cta_home')}</span>
                                <FontAwesomeIcon icon={faArrowRight} className="text-sm" />
                            </Link>
                        </div>
                    </div>
                </aside>
            </div>
        </section>
    );
}
