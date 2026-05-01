import { getTranslations, getLocale } from 'next-intl/server';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowRight } from '@fortawesome/free-solid-svg-icons';
import { EyebrowLabel } from '@/components/primitives/EyebrowLabel';
import { getImpact, type Impact } from '@/lib/api/landing';

type Tile = { id: 'workersPlaced' | 'medianWage' | 'trainingsCompleted' | 'verifiedEmployers'; value: string | null };

function buildTiles(impact: Impact | null, locale: 'en' | 'es'): Tile[] {
    const numberFmt = new Intl.NumberFormat(locale === 'es' ? 'es-MX' : 'en-US');
    const wageFmt = new Intl.NumberFormat(locale === 'es' ? 'es-MX' : 'en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
    });
    return [
        {
            id: 'workersPlaced',
            value: impact?.workersPlaced != null ? `${numberFmt.format(impact.workersPlaced)}+` : null,
        },
        {
            id: 'medianWage',
            value: impact?.medianWage != null ? wageFmt.format(impact.medianWage) : null,
        },
        {
            id: 'trainingsCompleted',
            value: impact?.trainingsCompleted != null ? numberFmt.format(impact.trainingsCompleted) : null,
        },
        {
            id: 'verifiedEmployers',
            value: impact?.verifiedEmployers != null ? numberFmt.format(impact.verifiedEmployers) : null,
        },
    ];
}

export async function ImpactNumbers() {
    const [t, locale, impact] = await Promise.all([
        getTranslations('landing.impact'),
        getLocale(),
        getImpact(),
    ]);
    const tiles = buildTiles(impact, locale as 'en' | 'es');
    const allSuppressed = tiles.every((tile) => tile.value === null);

    return (
        <section className="bg-primary text-primary-content w-full">
            <div className="container mx-auto flex flex-col gap-16 px-5 py-24 md:px-8 md:py-28 lg:px-20 lg:py-30">
                <div className="flex flex-col items-start gap-10 lg:flex-row lg:items-end lg:gap-16">
                    <div className="flex flex-1 flex-col gap-4">
                        <EyebrowLabel tone="honey" withRule>
                            {t('eyebrow')}
                        </EyebrowLabel>
                        <h2 className="font-serif text-4xl font-semibold tracking-tight md:text-5xl">
                            {t('headline')}
                        </h2>
                    </div>
                    <p className="text-primary-content/70 flex-1 font-sans text-base leading-relaxed lg:pb-4">
                        {t('body')}
                    </p>
                </div>

                {allSuppressed ? (
                    <div className="border-secondary border-y py-12 text-center">
                        <p className="text-primary-content/80 font-serif text-2xl italic">
                            {t('coming_soon')}
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
                        {tiles.map((tile, i) => (
                            <div
                                key={tile.id}
                                className={`flex flex-col gap-3 px-8 py-9 ${i < tiles.length - 1 ? 'border-secondary lg:border-r' : ''}`}
                            >
                                {tile.value === null ? (
                                    <p className="text-primary-content/60 font-serif text-3xl italic leading-none">
                                        {t('tile_coming_soon')}
                                    </p>
                                ) : (
                                    <p className="text-accent font-serif text-5xl font-semibold leading-none tabular-nums tracking-tight md:text-6xl">
                                        {tile.value}
                                    </p>
                                )}
                                <p className="text-primary-content font-sans text-base font-semibold">
                                    {t(`tile.${tile.id}.label`)}
                                </p>
                                <p className="text-primary-content/70 font-sans text-sm leading-relaxed">
                                    {t(`tile.${tile.id}.body`)}
                                </p>
                            </div>
                        ))}
                    </div>
                )}

                <div className="border-secondary flex flex-col items-start gap-4 border-t pt-6 lg:flex-row lg:items-center lg:gap-6">
                    <p className="text-primary-content/70 font-sans text-sm">{t('cta.dashboard')}</p>
                    <a href={`/${locale}/impact`} className="btn btn-accent">
                        <span>{t('cta.link')}</span>
                        <FontAwesomeIcon icon={faArrowRight} className="text-sm" />
                    </a>
                    <p className="text-accent font-mono text-xs tracking-wider lg:ml-auto">
                        {impact?.source ?? t('source')}
                    </p>
                </div>
            </div>
        </section>
    );
}
