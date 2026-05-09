import { getTranslations } from 'next-intl/server';
import Link from 'next/link';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faArrowRight,
    faArrowUpRightFromSquare,
    faBan,
    faClipboardList,
    faHandshake,
    faShieldHalved,
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

const LAST_REVIEWED = '2026-05-09';

interface Subprocessor {
    key: string;
    name: string;
    location: string;
    dpaUrl: string;
}

const SUBPROCESSORS: Subprocessor[] = [
    { key: 'supabase', name: 'Supabase', location: 'United States', dpaUrl: 'https://supabase.com/legal/dpa' },
    { key: 'gcp', name: 'Google Cloud Platform', location: 'us-west1 · Oregon, USA', dpaUrl: 'https://cloud.google.com/terms/data-processing-addendum' },
    { key: 'cloudflare', name: 'Cloudflare', location: 'Global edge network', dpaUrl: 'https://www.cloudflare.com/cloudflare-customer-dpa/' },
    { key: 'clerk', name: 'Clerk', location: 'United States', dpaUrl: 'https://clerk.com/legal/dpa' },
    { key: 'google_oauth', name: 'Google (OAuth sign-in)', location: 'Global', dpaUrl: 'https://policies.google.com/privacy' },
    { key: 'twilio', name: 'Twilio', location: 'United States', dpaUrl: 'https://www.twilio.com/legal/data-protection-addendum' },
    { key: 'resend', name: 'Resend', location: 'United States', dpaUrl: 'https://resend.com/legal/dpa' },
    { key: 'stripe', name: 'Stripe', location: 'United States', dpaUrl: 'https://stripe.com/legal/dpa' },
    { key: 'posthog', name: 'PostHog', location: 'United States · us.i.posthog.com', dpaUrl: 'https://posthog.com/dpa' },
    { key: 'sentry', name: 'Sentry', location: 'United States', dpaUrl: 'https://sentry.io/legal/dpa/' },
];

const COMMITMENTS = [
    { id: 'dpa', icon: faHandshake },
    { id: 'scope', icon: faShieldHalved },
    { id: 'notify', icon: faClipboardList },
    { id: 'no_sale', icon: faBan },
] as const;

export async function generateMetadata({ params }: RouteProps) {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: 'marketing.subprocessors' });
    return marketingMetadata({
        locale,
        title: t('meta.title'),
        description: t('meta.description'),
        pathByLocale: (l) => `/${l}/subprocessors`,
    });
}

export default async function SubprocessorsPage({ params }: RouteProps) {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: 'marketing.subprocessors' });

    return (
        <>
            <JsonLd data={organizationJsonLd()} />

            <MarketingPageHero
                eyebrow={t('eyebrow')}
                headline={t('headline')}
                intro={t('intro')}
                accent={
                    <p className="text-secondary font-mono text-xs uppercase tracking-[0.18em]">
                        {t('last_reviewed_label')} · {LAST_REVIEWED}
                    </p>
                }
            />

            <section className="bg-base-200 w-full">
                <div className="container mx-auto px-5 py-20 md:px-8 md:py-24 lg:px-20 lg:py-28">
                    <div className="border-secondary/15 hidden grid-cols-[minmax(0,1fr)_minmax(0,2fr)_minmax(0,1.6fr)_minmax(0,1fr)_auto] gap-6 border-b pb-3 lg:grid">
                        {(['name', 'purpose', 'data', 'location', 'dpa'] as const).map((col) => (
                            <span
                                key={col}
                                className="text-secondary font-mono text-xs font-bold uppercase tracking-[0.22em]"
                            >
                                {t(`table.col.${col}`)}
                            </span>
                        ))}
                    </div>

                    <ul className="flex flex-col gap-px bg-secondary/15 mt-0 lg:mt-px">
                        {SUBPROCESSORS.map((sp) => (
                            <li
                                key={sp.key}
                                className="bg-base-100 grid grid-cols-1 gap-3 p-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)_minmax(0,1.6fr)_minmax(0,1fr)_auto] lg:items-start lg:gap-6 lg:p-8"
                            >
                                <div className="flex flex-col gap-1">
                                    <span className="text-secondary font-mono text-[10px] font-bold uppercase tracking-[0.22em] lg:hidden">
                                        {t('table.col.name')}
                                    </span>
                                    <span className="text-base-content font-serif text-lg font-semibold leading-tight">
                                        {sp.name}
                                    </span>
                                </div>

                                <div className="flex flex-col gap-1">
                                    <span className="text-secondary font-mono text-[10px] font-bold uppercase tracking-[0.22em] lg:hidden">
                                        {t('table.col.purpose')}
                                    </span>
                                    <p className="text-base-content font-sans text-sm leading-relaxed">
                                        {t(`row.${sp.key}.purpose`)}
                                    </p>
                                </div>

                                <div className="flex flex-col gap-1">
                                    <span className="text-secondary font-mono text-[10px] font-bold uppercase tracking-[0.22em] lg:hidden">
                                        {t('table.col.data')}
                                    </span>
                                    <p className="text-base-content/80 font-sans text-sm leading-relaxed">
                                        {t(`row.${sp.key}.data`)}
                                    </p>
                                </div>

                                <div className="flex flex-col gap-1">
                                    <span className="text-secondary font-mono text-[10px] font-bold uppercase tracking-[0.22em] lg:hidden">
                                        {t('table.col.location')}
                                    </span>
                                    <p className="text-base-content/80 font-sans text-sm leading-relaxed">
                                        {sp.location}
                                    </p>
                                </div>

                                <a
                                    href={sp.dpaUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-primary inline-flex items-center gap-2 self-start font-sans text-sm font-semibold hover:underline"
                                >
                                    <span>{t('dpa_link_label')}</span>
                                    <FontAwesomeIcon icon={faArrowUpRightFromSquare} className="text-xs" />
                                </a>
                            </li>
                        ))}
                    </ul>
                </div>
            </section>

            <section className="bg-base-100 w-full">
                <div className="container mx-auto flex flex-col gap-12 px-5 py-20 md:px-8 md:py-24 lg:px-20 lg:py-28">
                    <div className="flex flex-col gap-4">
                        <EyebrowLabel tone="soil" withRule>
                            {t('commitments.headline')}
                        </EyebrowLabel>
                        <p className="text-base-content max-w-prose font-sans text-base leading-relaxed">
                            {t('commitments.intro')}
                        </p>
                    </div>

                    <div className="grid grid-cols-1 gap-px bg-secondary/15 md:grid-cols-2">
                        {COMMITMENTS.map((c) => (
                            <article
                                key={c.id}
                                className="bg-base-100 flex flex-col gap-3 p-8 lg:p-10"
                            >
                                <FontAwesomeIcon icon={c.icon} className="text-primary text-2xl" />
                                <h3 className="text-base-content font-serif text-xl font-semibold leading-tight tracking-tight">
                                    {t(`commitments.${c.id}.title`)}
                                </h3>
                                <p className="text-secondary font-sans text-sm leading-relaxed">
                                    {t(`commitments.${c.id}.body`)}
                                </p>
                            </article>
                        ))}
                    </div>
                </div>
            </section>

            <section className="bg-neutral text-neutral-content w-full">
                <div className="container mx-auto flex flex-col gap-6 px-5 py-20 md:px-8 md:py-24 lg:px-20 lg:py-28">
                    <h2 className="font-serif text-3xl font-medium leading-tight tracking-tight md:text-4xl lg:text-5xl max-w-3xl">
                        {t('note.headline')}
                    </h2>
                    <p className="font-sans text-base leading-relaxed max-w-prose opacity-85">
                        {t('note.body')}
                    </p>
                    <div className="border-neutral-content/20 mt-6 flex flex-col gap-4 border-t pt-8 sm:flex-row sm:items-center sm:gap-8">
                        <Link
                            href={`/${locale}/privacy`}
                            className="text-accent inline-flex items-center gap-2 font-sans text-sm font-semibold hover:underline"
                        >
                            <span>{t('related.privacy')}</span>
                            <FontAwesomeIcon icon={faArrowRight} className="text-xs" />
                        </Link>
                        <Link
                            href={`/${locale}/trust`}
                            className="text-accent inline-flex items-center gap-2 font-sans text-sm font-semibold hover:underline"
                        >
                            <span>{t('related.trust')}</span>
                            <FontAwesomeIcon icon={faArrowRight} className="text-xs" />
                        </Link>
                    </div>
                </div>
            </section>
        </>
    );
}
