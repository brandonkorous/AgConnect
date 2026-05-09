import { getTranslations } from 'next-intl/server';
import Link from 'next/link';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faArrowRight,
    faCircleCheck,
    faGavel,
    faLockOpen,
    faMicrochip,
    faScaleBalanced,
    faServer,
    faShieldHalved,
    faUserShield,
} from '@fortawesome/free-solid-svg-icons';
import { EyebrowLabel } from '@/components/primitives/EyebrowLabel';
import { JsonLd } from '@/components/seo/JsonLd';
import { impactMetadata } from '@/lib/seo/metadata';
import { organizationJsonLd } from '@/lib/seo/json-ld';
import { getImpact, type Impact } from '@/lib/api/landing';

type Locale = 'en' | 'es';
type RouteProps = { params: Promise<{ locale: Locale }> };

export const dynamicParams = false;
export const revalidate = 86400;

export async function generateMetadata({ params }: RouteProps) {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: 'marketing.impact_page' });
    return impactMetadata({ locale, title: t('meta.title'), description: t('meta.description') });
}

type TileKey = 'workersPlaced' | 'medianWage' | 'trainingsCompleted' | 'verifiedEmployers';
const TILE_ORDER: TileKey[] = ['workersPlaced', 'medianWage', 'trainingsCompleted', 'verifiedEmployers'];

function formatTile(key: TileKey, impact: Impact | null, locale: Locale): string | null {
    if (!impact) return null;
    const numberFmt = new Intl.NumberFormat(locale === 'es' ? 'es-MX' : 'en-US');
    const wageFmt = new Intl.NumberFormat(locale === 'es' ? 'es-MX' : 'en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
    });
    if (key === 'workersPlaced')
        return impact.workersPlaced != null ? `${numberFmt.format(impact.workersPlaced)}+` : null;
    if (key === 'medianWage')
        return impact.medianWage != null ? wageFmt.format(impact.medianWage) : null;
    if (key === 'trainingsCompleted')
        return impact.trainingsCompleted != null ? numberFmt.format(impact.trainingsCompleted) : null;
    return numberFmt.format(impact.verifiedEmployers);
}

function formatTimestamp(iso: string | undefined, locale: Locale): string {
    if (!iso) return '';
    const fmt = new Intl.DateTimeFormat(locale === 'es' ? 'es-MX' : 'en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'America/Los_Angeles',
        timeZoneName: 'short',
    });
    return fmt.format(new Date(iso)).toUpperCase();
}

export default async function ImpactPage({ params }: RouteProps) {
    const { locale } = await params;
    const [pageT, tileT, sourceT, methodT, transparencyT, impact] = await Promise.all([
        getTranslations({ locale, namespace: 'marketing.impact_page' }),
        getTranslations({ locale, namespace: 'landing.impact.tile' }),
        getTranslations({ locale, namespace: 'landing.impact' }),
        getTranslations({ locale, namespace: 'marketing.impact_page.methodology' }),
        getTranslations({ locale, namespace: 'marketing.impact_page.transparency' }),
        getImpact(),
    ]);

    const tiles = TILE_ORDER.map((key) => ({ key, value: formatTile(key, impact, locale) }));
    const allSuppressed = tiles.every((tile) => tile.value === null);
    const lastUpdated = formatTimestamp(impact?.generatedAt, locale);
    const methodologyItems = [
        { id: 'count', icon: faCircleCheck },
        { id: 'round', icon: faScaleBalanced },
        { id: 'suppress', icon: faShieldHalved },
    ] as const;
    const transparencyItems = [
        { id: 'requests', icon: faGavel },
        { id: 'security', icon: faLockOpen },
        { id: 'subprocessors', icon: faServer },
        { id: 'actions', icon: faUserShield },
        { id: 'ai', icon: faMicrochip },
    ] as const;

    return (
        <>
            <JsonLd data={organizationJsonLd()} />

            <section className="bg-base-100 w-full">
                <div className="container mx-auto px-5 pt-20 pb-16 md:px-8 md:pt-24 md:pb-20 lg:px-20 lg:pt-32 lg:pb-24">
                    <div className="grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,0.6fr)_minmax(0,1fr)] lg:items-end lg:gap-20">
                        <div className="flex flex-col gap-6">
                            <EyebrowLabel tone="soil" withRule>
                                {pageT('eyebrow')}
                            </EyebrowLabel>
                            <h1 className="text-base-content font-serif text-5xl font-semibold leading-[1.05] tracking-tight md:text-6xl lg:text-[80px]">
                                {pageT('headline')}
                            </h1>
                        </div>
                        <p className="text-base-content max-w-prose font-sans text-lg leading-relaxed lg:pb-2">
                            {pageT('intro')}
                        </p>
                    </div>
                </div>
            </section>

            <section className="bg-primary text-primary-content w-full">
                <div className="container mx-auto flex flex-col gap-12 px-5 py-20 md:px-8 md:py-24 lg:px-20 lg:py-28">
                    <div className="flex flex-wrap items-center gap-3 lg:gap-4">
                        {allSuppressed ? (
                            <span className="text-accent font-mono text-xs font-bold uppercase tracking-[0.22em]">
                                {pageT('pre_live_label')}
                            </span>
                        ) : (
                            <>
                                <span className="bg-accent inline-block size-2 shrink-0 animate-pulse rounded-full" aria-hidden />
                                <span className="text-accent font-mono text-xs font-bold uppercase tracking-[0.22em]">
                                    {pageT('live_label')}
                                </span>
                                {lastUpdated ? (
                                    <span className="text-primary-content/60 font-mono text-xs uppercase tracking-[0.18em]">
                                        · {pageT('last_updated', { time: lastUpdated })}
                                    </span>
                                ) : null}
                            </>
                        )}
                    </div>

                    {allSuppressed ? (
                        <div className="border-secondary border-y py-16 text-center">
                            <p className="text-primary-content/80 font-serif text-3xl">
                                {sourceT('coming_soon')}
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-px bg-secondary/40 sm:grid-cols-2 lg:grid-cols-4">
                            {tiles.map((tile) => (
                                <article
                                    key={tile.key}
                                    className="bg-primary flex flex-col gap-4 p-8 lg:p-10"
                                >
                                    {tile.value === null ? (
                                        <p className="text-primary-content/50 font-serif text-3xl leading-none">
                                            {sourceT('tile_coming_soon')}
                                        </p>
                                    ) : (
                                        <p className="text-accent font-mono text-5xl font-bold leading-none tracking-tight tabular-nums lg:text-[64px]">
                                            {tile.value}
                                        </p>
                                    )}
                                    <p className="text-primary-content font-sans text-base font-semibold">
                                        {tileT(`${tile.key}.label`)}
                                    </p>
                                    <p className="text-primary-content/70 font-sans text-sm leading-relaxed">
                                        {tileT(`${tile.key}.body`)}
                                    </p>
                                </article>
                            ))}
                        </div>
                    )}

                    <p className="text-accent font-mono text-xs uppercase tracking-[0.22em]">
                        {impact?.source ?? sourceT('source')}
                    </p>
                </div>
            </section>

            <section id="methodology" className="bg-base-100 w-full scroll-mt-24">
                <div className="container mx-auto flex flex-col gap-12 px-5 py-20 md:px-8 md:py-24 lg:px-20 lg:py-28">
                    <div className="flex flex-col gap-4">
                        <EyebrowLabel tone="soil" withRule>
                            {methodT('eyebrow')}
                        </EyebrowLabel>
                        <h2 className="text-base-content font-serif text-3xl font-medium leading-tight tracking-tight md:text-4xl lg:text-5xl">
                            {methodT('headline')}
                        </h2>
                    </div>

                    <div className="grid grid-cols-1 gap-px bg-secondary/15 md:grid-cols-3">
                        {methodologyItems.map((item) => (
                            <div
                                key={item.id}
                                className="bg-base-100 flex flex-col gap-3 p-8 lg:p-10"
                            >
                                <FontAwesomeIcon icon={item.icon} className="text-primary text-2xl" />
                                <h3 className="text-base-content font-serif text-xl font-semibold leading-tight tracking-tight">
                                    {methodT(`${item.id}.title`)}
                                </h3>
                                <p className="text-secondary font-sans text-sm leading-relaxed">
                                    {methodT(`${item.id}.body`)}
                                </p>
                            </div>
                        ))}
                    </div>

                    <div className="border-secondary/15 flex flex-col gap-4 border-t pt-8 md:flex-row md:items-center md:justify-between">
                        <p className="text-secondary font-sans text-sm">{pageT('back_home_label')}</p>
                        <Link
                            href={`/${locale}`}
                            className="text-primary inline-flex items-center gap-2 font-sans text-sm font-semibold hover:underline"
                        >
                            <span>{pageT('back_home')}</span>
                            <FontAwesomeIcon icon={faArrowRight} className="text-xs" />
                        </Link>
                    </div>
                </div>
            </section>

            <section id="transparency" className="bg-base-200 w-full scroll-mt-24">
                <div className="container mx-auto flex flex-col gap-12 px-5 py-20 md:px-8 md:py-24 lg:px-20 lg:py-28">
                    <div className="grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,0.55fr)_minmax(0,1fr)] lg:items-end lg:gap-20">
                        <div className="flex flex-col gap-5">
                            <EyebrowLabel tone="soil" withRule>
                                {transparencyT('eyebrow')}
                            </EyebrowLabel>
                            <h2 className="text-base-content font-serif text-3xl font-medium leading-tight tracking-tight md:text-4xl lg:text-5xl">
                                {transparencyT('headline')}
                            </h2>
                        </div>
                        <p className="text-base-content max-w-prose font-sans text-base leading-relaxed">
                            {transparencyT('intro')}
                        </p>
                    </div>

                    <ul className="flex flex-col gap-px bg-secondary/15">
                        {transparencyItems.map((item) => (
                            <li
                                key={item.id}
                                className="bg-base-100 grid grid-cols-1 gap-4 p-7 md:grid-cols-[auto_minmax(0,1fr)_auto] md:items-start md:gap-8 md:p-9"
                            >
                                <FontAwesomeIcon icon={item.icon} className="text-primary text-2xl" />
                                <div className="flex flex-col gap-2">
                                    <h3 className="text-base-content font-serif text-xl font-semibold leading-tight tracking-tight">
                                        {transparencyT(`${item.id}.title`)}
                                    </h3>
                                    <p className="text-base-content/80 font-sans text-sm leading-relaxed">
                                        {transparencyT(`${item.id}.body`)}
                                    </p>
                                </div>
                                <span className="text-accent font-mono text-xs font-bold uppercase tracking-[0.22em] tabular-nums md:self-center md:text-right">
                                    {transparencyT(`${item.id}.value`)}
                                </span>
                            </li>
                        ))}
                    </ul>

                    <p className="text-secondary font-sans text-sm leading-relaxed">
                        {transparencyT('contact')}
                    </p>
                </div>
            </section>
        </>
    );
}
