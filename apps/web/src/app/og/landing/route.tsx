import { ImageResponse } from 'next/og';
import { OgFrame } from '../_shared/OgFrame';
import { loadFonts } from '../_shared/fonts';
import { palette } from '../_shared/palette';

export const runtime = 'nodejs';
export const revalidate = 86400;

const COPY = {
    en: {
        eyebrow: 'Seasonal work · Funded training',
        italic: 'From the field,',
        roman: 'to your future.',
        subhead: 'Bilingual seasonal jobs and CDFA-funded training across the Central Valley.',
        stat: 'Verified employers · Bilingual certificates · Portable wallet',
    },
    es: {
        eyebrow: 'Trabajo de temporada · Capacitación',
        italic: 'Del campo,',
        roman: 'a tu futuro.',
        subhead: 'Trabajos de temporada y capacitación CDFA, en dos idiomas, en todo el Valle Central.',
        stat: 'Empleadores verificados · Certificados bilingües · Cartera portátil',
    },
} as const;

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const locale = searchParams.get('locale') === 'en' ? 'en' : 'es';
    const t = COPY[locale];

    const fonts = await loadFonts([
        'interTightBold',
        'interTightSemi',
        'interTightItalic',
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
                    <span
                        style={{
                            fontFamily: 'Inter',
                            fontSize: 22,
                            fontWeight: 500,
                            color: palette.ink,
                            lineHeight: 1.3,
                            maxWidth: 760,
                        }}
                    >
                        {t.stat}
                    </span>
                }
            >
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <span
                        style={{
                            fontFamily: 'Inter Tight',
                            fontStyle: 'italic',
                            fontSize: 132,
                            fontWeight: 600,
                            color: palette.soil,
                            letterSpacing: -4,
                            lineHeight: 0.98,
                        }}
                    >
                        {t.italic}
                    </span>
                    <span
                        style={{
                            fontFamily: 'Inter Tight',
                            fontSize: 132,
                            fontWeight: 700,
                            color: palette.ink,
                            letterSpacing: -5,
                            lineHeight: 0.98,
                        }}
                    >
                        {t.roman}
                    </span>
                    <span
                        style={{
                            fontFamily: 'Inter',
                            fontSize: 28,
                            fontWeight: 500,
                            color: palette.ink,
                            lineHeight: 1.35,
                            maxWidth: 920,
                            marginTop: 24,
                        }}
                    >
                        {t.subhead}
                    </span>
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
