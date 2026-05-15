import { ImageResponse } from 'next/og';
import { getPressReleaseBySlug } from '@/content/press';
import { pickLocale } from '@/content/types';
import { OgFrame } from '../../_shared/OgFrame';
import { loadFonts } from '../../_shared/fonts';
import { palette } from '../../_shared/palette';

export const runtime = 'nodejs';
export const revalidate = 86400;

type Locale = 'en' | 'es';

const COPY = {
    en: {
        eyebrow: 'Press release',
        datelineLabel: 'Dateline',
        publishedLabel: 'Published',
        fallbackTitle: 'AGCONN press and announcements',
    },
    es: {
        eyebrow: 'Comunicado de prensa',
        datelineLabel: 'Lugar',
        publishedLabel: 'Publicado',
        fallbackTitle: 'Prensa y anuncios de AGCONN',
    },
} as const;

function formatDate(iso: string, locale: Locale): string {
    const fmt = new Intl.DateTimeFormat(locale === 'es' ? 'es-MX' : 'en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
    });
    try {
        return fmt.format(new Date(iso));
    } catch {
        return iso;
    }
}

type Props = { params: Promise<{ slug: string }> };

export async function GET(req: Request, { params }: Props) {
    const { slug } = await params;
    const { searchParams } = new URL(req.url);
    const locale: Locale = searchParams.get('locale') === 'es' ? 'es' : 'en';
    const t = COPY[locale];
    const release = getPressReleaseBySlug(slug);

    const title = release ? pickLocale(release.headline, locale) : t.fallbackTitle;
    const summary = release ? pickLocale(release.summary, locale) : '';
    const dateline = release?.location ?? '';
    const published = release ? formatDate(release.publishedAt, locale) : '';

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
                    dateline ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
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
                                {t.datelineLabel}
                            </span>
                            <span
                                style={{
                                    fontFamily: 'Inter',
                                    fontSize: 22,
                                    fontWeight: 600,
                                    color: palette.ink,
                                }}
                            >
                                {dateline}
                                {published ? ` · ${published}` : ''}
                            </span>
                        </div>
                    ) : undefined
                }
            >
                <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
                    <span
                        style={{
                            fontFamily: 'Inter Tight',
                            fontSize: title.length > 54 ? 64 : title.length > 38 ? 78 : 92,
                            fontWeight: 700,
                            color: palette.ink,
                            letterSpacing: -3,
                            lineHeight: 1.02,
                            maxWidth: 1060,
                        }}
                    >
                        {title}
                    </span>
                    {summary ? (
                        <span
                            style={{
                                fontFamily: 'Inter',
                                fontSize: 24,
                                fontWeight: 500,
                                color: palette.ink,
                                lineHeight: 1.35,
                                maxWidth: 1000,
                            }}
                        >
                            {summary}
                        </span>
                    ) : null}
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
