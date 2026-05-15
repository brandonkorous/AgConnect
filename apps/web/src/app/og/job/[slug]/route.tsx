import { ImageResponse } from 'next/og';
import { fetchPublicJob } from '@/lib/api/public-jobs';
import { OgFrame } from '../../_shared/OgFrame';
import { loadFonts } from '../../_shared/fonts';
import { palette } from '../../_shared/palette';

export const runtime = 'nodejs';
export const revalidate = 86400;

const COPY = {
    en: {
        eyebrow: 'Seasonal job',
        wageLabel: 'Wage',
        locLabel: 'Location',
        startsLabel: 'Starts',
        verified: 'Verified employer',
        fallbackTitle: 'Seasonal work in the Central Valley',
        fallbackLoc: 'Central Valley, California',
    },
    es: {
        eyebrow: 'Trabajo de temporada',
        wageLabel: 'Pago',
        locLabel: 'Ubicación',
        startsLabel: 'Empieza',
        verified: 'Empleador verificado',
        fallbackTitle: 'Trabajo de temporada en el Valle Central',
        fallbackLoc: 'Valle Central, California',
    },
} as const;

type Props = { params: Promise<{ slug: string }> };

function formatWageUnit(unit: string, locale: 'en' | 'es') {
    const u = unit.toLowerCase();
    if (locale === 'es') {
        if (u === 'hour') return '/hora';
        if (u === 'day') return '/día';
        if (u === 'piece') return '/pieza';
        return `/${u}`;
    }
    return `/${u}`;
}

function formatDate(iso: string, locale: 'en' | 'es') {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return new Intl.DateTimeFormat(locale === 'es' ? 'es-MX' : 'en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    }).format(d);
}

export async function GET(req: Request, { params }: Props) {
    const { slug } = await params;
    const { searchParams } = new URL(req.url);
    const locale = searchParams.get('locale') === 'es' ? 'es' : 'en';
    const t = COPY[locale];
    const job = await fetchPublicJob(slug);
    const live = job && job !== 'gone' ? job : null;

    const title = live ? (locale === 'es' ? live.titleEs : live.titleEn) : t.fallbackTitle;
    const location = live
        ? live.city
            ? `${live.city}, ${live.county} County`
            : `${live.county} County, CA`
        : t.fallbackLoc;
    const wage = live ? `$${live.wageMin}–$${live.wageMax}` : '';
    const wageUnit = live ? formatWageUnit(live.wageUnit, locale) : '';
    const starts = live?.startDate ? formatDate(live.startDate, locale) : '';

    const fonts = await loadFonts([
        'interTightBold',
        'interTightSemi',
        'interSemi',
        'interMed',
        'dmMonoBold',
    ]);

    return new ImageResponse(
        (
            <OgFrame
                locale={locale}
                eyebrow={t.eyebrow}
                footerLeft={
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div
                            style={{
                                width: 10,
                                height: 10,
                                borderRadius: 9999,
                                backgroundColor: palette.primary,
                            }}
                        />
                        <span
                            style={{
                                fontFamily: 'Inter',
                                fontSize: 20,
                                fontWeight: 600,
                                color: palette.primary,
                                letterSpacing: 1,
                            }}
                        >
                            {t.verified}
                        </span>
                    </div>
                }
            >
                <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
                    <span
                        style={{
                            fontFamily: 'Inter Tight',
                            fontSize: title.length > 42 ? 72 : 88,
                            fontWeight: 700,
                            color: palette.ink,
                            letterSpacing: -3,
                            lineHeight: 1.02,
                            maxWidth: 1050,
                        }}
                    >
                        {title}
                    </span>

                    {wage ? (
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: 14 }}>
                            <span
                                style={{
                                    fontFamily: 'DM Mono',
                                    fontSize: 64,
                                    fontWeight: 500,
                                    color: palette.primary,
                                    letterSpacing: -2,
                                    lineHeight: 1,
                                }}
                            >
                                {wage}
                            </span>
                            <span
                                style={{
                                    fontFamily: 'Inter',
                                    fontSize: 28,
                                    fontWeight: 500,
                                    color: palette.soil,
                                }}
                            >
                                {wageUnit}
                            </span>
                        </div>
                    ) : null}

                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 56,
                            paddingTop: 8,
                        }}
                    >
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                            <span
                                style={{
                                    fontFamily: 'DM Mono',
                                    fontSize: 14,
                                    fontWeight: 500,
                                    color: palette.soil,
                                    letterSpacing: 3,
                                    textTransform: 'uppercase',
                                }}
                            >
                                {t.locLabel}
                            </span>
                            <span
                                style={{
                                    fontFamily: 'Inter',
                                    fontSize: 26,
                                    fontWeight: 600,
                                    color: palette.ink,
                                }}
                            >
                                {location}
                            </span>
                        </div>
                        {starts ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                <span
                                    style={{
                                        fontFamily: 'DM Mono',
                                        fontSize: 14,
                                        fontWeight: 500,
                                        color: palette.soil,
                                        letterSpacing: 3,
                                        textTransform: 'uppercase',
                                    }}
                                >
                                    {t.startsLabel}
                                </span>
                                <span
                                    style={{
                                        fontFamily: 'Inter',
                                        fontSize: 26,
                                        fontWeight: 600,
                                        color: palette.ink,
                                    }}
                                >
                                    {starts}
                                </span>
                            </div>
                        ) : null}
                    </div>
                </div>
            </OgFrame>
        ),
        {
            width: 1200,
            height: 630,
            fonts: fonts.map((f) => ({
                name: f.name,
                data: f.data,
                weight: f.weight,
                style: f.style,
            })),
        },
    );
}
