import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const revalidate = 86400;

const palette = {
    bone: '#EFE6D2',
    moss: '#3F5A3A',
    ink: '#1F2417',
    honey: '#D8A24A',
    soil: '#7A6D4F',
} as const;

const headlines = {
    en: { line1: 'From the field,', line2: 'to your future.' },
    es: { line1: 'Del campo,', line2: 'a tu futuro.' },
};

const subhead = {
    en: 'Bilingual seasonal jobs and CDFA-funded training across the Central Valley.',
    es: 'Trabajos de temporada y capacitación CDFA, en dos idiomas, en todo el Valle Central.',
};

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const localeRaw = searchParams.get('locale');
    const locale = localeRaw === 'en' ? 'en' : 'es';
    const headline = headlines[locale];
    const brand = process.env.NEXT_PUBLIC_BRAND_NAME ?? 'AgConn';

    return new ImageResponse(
        (
            <div
                style={{
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    padding: '72px 80px',
                    backgroundColor: palette.bone,
                    fontFamily: 'serif',
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div
                        style={{
                            width: 14,
                            height: 14,
                            borderRadius: 999,
                            backgroundColor: palette.honey,
                        }}
                    />
                    <span
                        style={{
                            fontSize: 22,
                            color: palette.soil,
                            letterSpacing: 4,
                            textTransform: 'uppercase',
                            fontFamily: 'sans-serif',
                            fontWeight: 600,
                        }}
                    >
                        {brand} · Central Valley
                    </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <span
                        style={{
                            fontSize: 132,
                            color: palette.soil,
                            fontStyle: 'italic',
                            fontWeight: 300,
                            letterSpacing: -4,
                            lineHeight: 1,
                        }}
                    >
                        {headline.line1}
                    </span>
                    <span
                        style={{
                            fontSize: 132,
                            color: palette.ink,
                            fontWeight: 600,
                            letterSpacing: -4,
                            lineHeight: 1,
                        }}
                    >
                        {headline.line2}
                    </span>
                </div>

                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        borderTop: `1px solid ${palette.soil}`,
                        paddingTop: 24,
                    }}
                >
                    <span
                        style={{
                            fontSize: 24,
                            color: palette.ink,
                            fontFamily: 'sans-serif',
                            fontWeight: 500,
                            maxWidth: 760,
                            lineHeight: 1.3,
                        }}
                    >
                        {subhead[locale]}
                    </span>
                    <span
                        style={{
                            fontSize: 22,
                            color: palette.moss,
                            fontFamily: 'sans-serif',
                            fontWeight: 700,
                            letterSpacing: 2,
                        }}
                    >
                        {(process.env.NEXT_PUBLIC_SITE_URL ?? 'agconn.com').replace(/^https?:\/\//, '').replace(/\/$/, '')}
                    </span>
                </div>
            </div>
        ),
        { width: 1200, height: 630 },
    );
}
