import { ImageResponse } from 'next/og';
import { fetchPublicProgram } from '@/lib/api/public-training';
import { OgFrame } from '../../_shared/OgFrame';
import { loadFonts } from '../../_shared/fonts';
import { palette } from '../../_shared/palette';

export const runtime = 'nodejs';
export const revalidate = 86400;

const COPY = {
    en: {
        eyebrow: 'Funded training',
        funderLabel: 'Funded by',
        whenLabel: 'When',
        certLabel: 'Certificate · Free',
        fallbackTitle: 'CDFA-funded training in the Central Valley',
    },
    es: {
        eyebrow: 'Capacitación financiada',
        funderLabel: 'Fondos de',
        whenLabel: 'Cuándo',
        certLabel: 'Certificado · Gratis',
        fallbackTitle: 'Capacitación financiada por CDFA en el Valle Central',
    },
} as const;

type Props = { params: Promise<{ slug: string }> };

function formatDateRange(start: string, end: string, locale: 'en' | 'es') {
    const fmt = new Intl.DateTimeFormat(locale === 'es' ? 'es-MX' : 'en-US', {
        month: 'short',
        day: 'numeric',
    });
    try {
        return `${fmt.format(new Date(start))} → ${fmt.format(new Date(end))}`;
    } catch {
        return `${start} → ${end}`;
    }
}

export async function GET(req: Request, { params }: Props) {
    const { slug } = await params;
    const { searchParams } = new URL(req.url);
    const locale = searchParams.get('locale') === 'es' ? 'es' : 'en';
    const t = COPY[locale];
    const program = await fetchPublicProgram(slug);

    const title = program ? (locale === 'es' ? program.titleEs : program.titleEn) : t.fallbackTitle;
    const funder = program?.funder ?? '';
    const when = program ? formatDateRange(program.startDate, program.endDate, locale) : '';

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
                                backgroundColor: palette.accent,
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
                            {t.certLabel}
                        </span>
                    </div>
                }
            >
                <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
                    <span
                        style={{
                            fontFamily: 'Inter Tight',
                            fontSize: title.length > 42 ? 68 : 82,
                            fontWeight: 700,
                            color: palette.ink,
                            letterSpacing: -3,
                            lineHeight: 1.05,
                            maxWidth: 1050,
                        }}
                    >
                        {title}
                    </span>

                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 56,
                            paddingTop: 8,
                        }}
                    >
                        {funder ? (
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
                                    {t.funderLabel}
                                </span>
                                <span
                                    style={{
                                        fontFamily: 'Inter',
                                        fontSize: 28,
                                        fontWeight: 600,
                                        color: palette.ink,
                                    }}
                                >
                                    {funder}
                                </span>
                            </div>
                        ) : null}
                        {when ? (
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
                                    {t.whenLabel}
                                </span>
                                <span
                                    style={{
                                        fontFamily: 'DM Mono',
                                        fontSize: 26,
                                        fontWeight: 500,
                                        color: palette.ink,
                                    }}
                                >
                                    {when}
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
