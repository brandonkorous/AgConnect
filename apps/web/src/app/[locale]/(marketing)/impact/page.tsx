import { getTranslations } from 'next-intl/server';
import Link from 'next/link';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowRight } from '@fortawesome/free-solid-svg-icons';
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

export default async function ImpactPage({ params }: RouteProps) {
    const { locale } = await params;
    const [pageT, tileT, sourceT, impact] = await Promise.all([
        getTranslations({ locale, namespace: 'marketing.impact_page' }),
        getTranslations({ locale, namespace: 'landing.impact.tile' }),
        getTranslations({ locale, namespace: 'landing.impact' }),
        getImpact(),
    ]);

    const tiles: Array<{ key: TileKey; value: string | null }> = (
        ['workersPlaced', 'medianWage', 'trainingsCompleted', 'verifiedEmployers'] as TileKey[]
    ).map((key) => ({ key, value: formatTile(key, impact, locale) }));

    return (
        <section className="bg-base-100 w-full">
            <JsonLd data={organizationJsonLd()} />

            <div className="mx-auto flex max-w-5xl flex-col gap-16 px-5 py-24 md:px-8 md:py-28 lg:py-32">
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

                <div className="grid grid-cols-1 gap-px bg-base-300 md:grid-cols-2">
                    {tiles.map((tile) => (
                        <article key={tile.key} className="bg-base-100 flex flex-col gap-3 p-8 md:p-10">
                            {tile.value === null ? (
                                <p className="text-secondary font-serif text-3xl italic leading-none">
                                    {sourceT('tile_coming_soon')}
                                </p>
                            ) : (
                                <p className="text-primary font-serif text-5xl font-semibold leading-none tabular-nums tracking-tight md:text-6xl">
                                    {tile.value}
                                </p>
                            )}
                            <p className="text-base-content font-sans text-base font-semibold">
                                {tileT(`${tile.key}.label`)}
                            </p>
                            <p className="text-secondary font-sans text-sm leading-relaxed">
                                {tileT(`${tile.key}.body`)}
                            </p>
                        </article>
                    ))}
                </div>

                <footer className="border-base-300 flex flex-col gap-4 border-t pt-6 md:flex-row md:items-center md:justify-between">
                    <p className="text-secondary font-mono text-xs uppercase tracking-[0.18em]">
                        {impact?.source ?? sourceT('source')}
                    </p>
                    <Link href={`/${locale}`} className="link link-hover text-primary font-sans text-sm font-semibold">
                        <span>{pageT('back_home')}</span>
                        <FontAwesomeIcon icon={faArrowRight} className="ml-2 text-xs" />
                    </Link>
                </footer>
            </div>
        </section>
    );
}
