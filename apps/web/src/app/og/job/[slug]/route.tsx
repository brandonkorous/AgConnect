import { ImageResponse } from 'next/og';
import { fetchPublicJob } from '@/lib/api/public-jobs';

export const revalidate = 86400;

const palette = {
    bone: '#EFE6D2',
    moss: '#3F5A3A',
    ink: '#1F2417',
    honey: '#D8A24A',
    soil: '#7A6D4F',
    line: 'rgba(122, 109, 79, 0.25)',
} as const;

const labels = {
    en: { eyebrow: 'Seasonal job · Central Valley', wage: 'WAGE', loc: 'LOCATION', starts: 'STARTS' },
    es: { eyebrow: 'Trabajo de temporada · Valle Central', wage: 'PAGO', loc: 'UBICACIÓN', starts: 'EMPIEZA' },
} as const;

type Props = { params: Promise<{ slug: string }> };

export async function GET(req: Request, { params }: Props) {
    const { slug } = await params;
    const { searchParams } = new URL(req.url);
    const locale = searchParams.get('locale') === 'es' ? 'es' : 'en';
    const job = await fetchPublicJob(slug);
    const brand = process.env.NEXT_PUBLIC_BRAND_NAME ?? 'AGCONN';
    const t = labels[locale];

    const title = job && job !== 'gone' ? (locale === 'es' ? job.titleEs : job.titleEn) : brand;
    const location =
        job && job !== 'gone'
            ? job.city
                ? `${job.city}, ${job.county} County`
                : `${job.county} County, CA`
            : 'Central Valley, CA';
    const wage =
        job && job !== 'gone'
            ? `$${job.wageMin}–$${job.wageMax} / ${job.wageUnit}`
            : '';
    const starts = job && job !== 'gone' ? job.startDate : '';

    return new ImageResponse(
        (
            <div
                style={{
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    padding: '64px 72px',
                    backgroundColor: palette.bone,
                    fontFamily: 'sans-serif',
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div
                        style={{
                            width: 12,
                            height: 12,
                            borderRadius: 999,
                            backgroundColor: palette.honey,
                        }}
                    />
                    <span
                        style={{
                            fontSize: 20,
                            color: palette.soil,
                            letterSpacing: 4,
                            textTransform: 'uppercase',
                            fontWeight: 700,
                        }}
                    >
                        {brand} · {t.eyebrow}
                    </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                    <span
                        style={{
                            fontSize: 84,
                            color: palette.ink,
                            fontWeight: 600,
                            letterSpacing: -2,
                            lineHeight: 1.05,
                            fontFamily: 'serif',
                            maxWidth: 1040,
                        }}
                    >
                        {title}
                    </span>
                    {wage && (
                        <span
                            style={{
                                fontSize: 56,
                                color: palette.moss,
                                fontWeight: 700,
                                letterSpacing: -1,
                                lineHeight: 1,
                                fontFamily: 'serif',
                            }}
                        >
                            {wage}
                        </span>
                    )}
                </div>

                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        borderTop: `1px solid ${palette.line}`,
                        paddingTop: 24,
                    }}
                >
                    <div style={{ display: 'flex', gap: 48 }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                            <span
                                style={{
                                    fontSize: 14,
                                    color: palette.soil,
                                    letterSpacing: 2,
                                    textTransform: 'uppercase',
                                    fontWeight: 700,
                                }}
                            >
                                {t.loc}
                            </span>
                            <span style={{ fontSize: 22, color: palette.ink, fontWeight: 600 }}>
                                {location}
                            </span>
                        </div>
                        {starts && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                                <span
                                    style={{
                                        fontSize: 14,
                                        color: palette.soil,
                                        letterSpacing: 2,
                                        textTransform: 'uppercase',
                                        fontWeight: 700,
                                    }}
                                >
                                    {t.starts}
                                </span>
                                <span style={{ fontSize: 22, color: palette.ink, fontWeight: 600 }}>
                                    {starts}
                                </span>
                            </div>
                        )}
                    </div>
                    <span
                        style={{
                            fontSize: 20,
                            color: palette.moss,
                            fontWeight: 700,
                            letterSpacing: 2,
                        }}
                    >
                        {(process.env.NEXT_PUBLIC_SITE_URL ?? 'agconn.com')
                            .replace(/^https?:\/\//, '')
                            .replace(/\/$/, '')}
                    </span>
                </div>
            </div>
        ),
        { width: 1200, height: 630 },
    );
}
