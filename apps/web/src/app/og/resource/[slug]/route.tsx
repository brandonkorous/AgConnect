import { ImageResponse } from 'next/og';
import { getResourceBySlug } from '@/content/resources';
import { pickLocale } from '@/content/types';
import { OgFrame } from '../../_shared/OgFrame';
import { loadFonts } from '../../_shared/fonts';
import { palette } from '../../_shared/palette';

export const runtime = 'nodejs';
export const revalidate = 86400;

const COPY = {
    en: {
        eyebrow: 'Field guide',
        publishedLabel: 'Published',
        readingLabel: 'Reading time',
        fallbackTitle: 'AGCONN field guides for farmworkers and employers',
        categories: {
            workers_rights: 'Workers rights',
            employer_guides: 'Employer guides',
            training_explainers: 'Training explainers',
        },
    },
    es: {
        eyebrow: 'Guía de campo',
        publishedLabel: 'Publicado',
        readingLabel: 'Tiempo de lectura',
        fallbackTitle: 'Guías de campo de AGCONN para trabajadores y empleadores',
        categories: {
            workers_rights: 'Derechos del trabajador',
            employer_guides: 'Guías para empleadores',
            training_explainers: 'Guías de capacitación',
        },
    },
} as const;

type Props = { params: Promise<{ slug: string }> };

function formatDate(iso: string, locale: 'en' | 'es'): string {
    const fmt = new Intl.DateTimeFormat(locale === 'es' ? 'es-MX' : 'en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    });
    try {
        return fmt.format(new Date(iso));
    } catch {
        return iso;
    }
}

export async function GET(req: Request, { params }: Props) {
    const { slug } = await params;
    const { searchParams } = new URL(req.url);
    const locale = searchParams.get('locale') === 'es' ? 'es' : 'en';
    const t = COPY[locale];

    const article = getResourceBySlug(slug);
    const title = article ? pickLocale(article.title, locale) : t.fallbackTitle;
    const categoryLabel = article ? t.categories[article.category] : t.eyebrow;
    const published = article ? formatDate(article.publishedAt, locale) : '';
    const minutes = article ? String(article.readingMinutes) : '';
    const readingLabel = locale === 'es' ? `${minutes} min` : `${minutes} min`;

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
                eyebrow={categoryLabel}
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
                            {minutes ? `${readingLabel} · agconn.com/resources` : 'agconn.com/resources'}
                        </span>
                    </div>
                }
            >
                <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
                    <span
                        style={{
                            fontFamily: 'Inter Tight',
                            fontSize: title.length > 48 ? 64 : 80,
                            fontWeight: 700,
                            color: palette.ink,
                            letterSpacing: -3,
                            lineHeight: 1.05,
                            maxWidth: 1050,
                        }}
                    >
                        {title}
                    </span>

                    {published ? (
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
                                    {t.publishedLabel}
                                </span>
                                <span
                                    style={{
                                        fontFamily: 'DM Mono',
                                        fontSize: 26,
                                        fontWeight: 500,
                                        color: palette.ink,
                                    }}
                                >
                                    {published}
                                </span>
                            </div>
                        </div>
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
