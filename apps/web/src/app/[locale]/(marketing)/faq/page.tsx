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

function SunOrnament() {
    return (
        <svg
            className="text-secondary/15 pointer-events-none absolute -top-12 -right-16 hidden lg:block"
            width="240"
            height="240"
            viewBox="0 0 92 92"
            aria-hidden
        >
            <circle cx="46" cy="46" r="46" fill="currentColor" />
            <path
                d="M46 18 C62 28 64 46 58 60 C52 70 46 76 46 76 C46 76 40 70 34 60 C28 46 30 28 46 18 Z"
                className="text-accent/40"
                fill="currentColor"
            />
        </svg>
    );
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
    const allEntries = [...shared, ...extras];

    return (
        <>
            <JsonLd data={organizationJsonLd()} />
            <JsonLd
                data={faqPageJsonLd({
                    locale,
                    entries: allEntries.map((e) => ({ question: e.question, answer: e.answer })),
                })}
            />

            <section className="bg-base-100 w-full">
                <div className="container mx-auto px-5 py-24 md:px-8 md:py-28 lg:px-20 lg:py-30">
                    <div className="grid grid-cols-1 gap-12 lg:grid-cols-[minmax(0,0.55fr)_minmax(0,1fr)] lg:gap-20">
                        <aside className="relative flex flex-col gap-6 lg:sticky lg:top-12 lg:self-start lg:pr-4">
                            <SunOrnament />
                            <EyebrowLabel tone="soil" withRule>
                                {pageT('eyebrow')}
                            </EyebrowLabel>
                            <h1 className="text-base-content font-serif text-5xl font-semibold leading-[1.05] tracking-tight md:text-6xl lg:text-[64px]">
                                {pageT('headline')}
                            </h1>
                            <p className="text-base-content max-w-prose font-sans text-lg leading-relaxed">
                                {pageT('intro')}
                            </p>
                            <div className="border-secondary/20 mt-4 max-w-md border bg-base-200 p-6">
                                <p className="text-secondary font-mono text-xs uppercase tracking-[0.18em]">
                                    {pageT('still_questions.headline')}
                                </p>
                                <p className="text-base-content mt-2 font-sans text-sm leading-relaxed">
                                    {pageT('still_questions.body')}
                                </p>
                                <a
                                    href="mailto:support@agconn.com?subject=AGCONN%20FAQ%20question"
                                    className="text-primary mt-3 inline-flex items-center gap-2 font-sans text-sm font-semibold hover:underline"
                                >
                                    <FontAwesomeIcon icon={faEnvelope} className="text-xs" />
                                    <span>{pageT('still_questions.cta_email')}</span>
                                </a>
                            </div>
                        </aside>

                        <div className="flex max-w-prose flex-col gap-0">
                            <FaqAccordion entries={shared} initialOpen={[]} />

                            <div className="my-12 flex items-center gap-6">
                                <span className="border-secondary/30 flex-1 border-t" aria-hidden />
                                <span className="text-secondary font-mono text-xs uppercase tracking-[0.22em]">
                                    {pageT('extras_label')}
                                </span>
                                <span className="border-secondary/30 flex-1 border-t" aria-hidden />
                            </div>

                            <FaqAccordion entries={extras} initialOpen={[]} />
                        </div>
                    </div>
                </div>
            </section>

            <section className="bg-base-200 w-full border-secondary/15 border-t">
                <div className="container mx-auto grid grid-cols-1 gap-12 px-5 py-20 md:px-8 md:py-24 lg:grid-cols-2 lg:px-20 lg:gap-16">
                    <div className="flex flex-col gap-4">
                        <EyebrowLabel tone="soil">{pageT('still_questions.next_label')}</EyebrowLabel>
                        <h2 className="text-base-content font-serif text-3xl font-medium leading-tight tracking-tight md:text-4xl">
                            {pageT('still_questions.headline')}
                        </h2>
                        <p className="text-base-content font-sans text-base leading-relaxed">
                            {pageT('still_questions.body')}
                        </p>
                        <div className="mt-2 flex flex-wrap gap-3">
                            <a
                                href="mailto:support@agconn.com?subject=AGCONN%20FAQ%20question"
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
                    <div className="flex flex-col gap-3 self-end">
                        <p className="text-secondary font-mono text-xs uppercase tracking-[0.18em]">
                            {pageT('still_questions.next_label')}
                        </p>
                        <ul className="border-secondary/20 flex flex-col border-y">
                            <li className="border-secondary/15 border-b">
                                <Link
                                    href={`/${locale}/impact`}
                                    className="hover:bg-base-100 flex items-center justify-between gap-4 px-2 py-4 transition-colors"
                                >
                                    <span className="text-base-content font-serif text-lg font-medium">
                                        {pageT('next_links.impact')}
                                    </span>
                                    <FontAwesomeIcon icon={faArrowRight} className="text-secondary text-sm" />
                                </Link>
                            </li>
                            <li className="border-secondary/15 border-b">
                                <Link
                                    href={`/${locale}/resources`}
                                    className="hover:bg-base-100 flex items-center justify-between gap-4 px-2 py-4 transition-colors"
                                >
                                    <span className="text-base-content font-serif text-lg font-medium">
                                        {pageT('next_links.resources')}
                                    </span>
                                    <FontAwesomeIcon icon={faArrowRight} className="text-secondary text-sm" />
                                </Link>
                            </li>
                            <li>
                                <Link
                                    href={`/${locale}`}
                                    className="hover:bg-base-100 flex items-center justify-between gap-4 px-2 py-4 transition-colors"
                                >
                                    <span className="text-base-content font-serif text-lg font-medium">
                                        {pageT('next_links.home')}
                                    </span>
                                    <FontAwesomeIcon icon={faArrowRight} className="text-secondary text-sm" />
                                </Link>
                            </li>
                        </ul>
                    </div>
                </div>
            </section>
        </>
    );
}
