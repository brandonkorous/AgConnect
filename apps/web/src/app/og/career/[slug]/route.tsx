import { ImageResponse } from 'next/og';
import { getCareerRoleBySlug } from '@/content/careers';
import { pickLocale, type CareerTeam, type CareerEmploymentType } from '@/content/types';
import { OgFrame } from '../../_shared/OgFrame';
import { loadFonts } from '../../_shared/fonts';
import { palette } from '../../_shared/palette';

export const runtime = 'nodejs';
export const revalidate = 86400;

type Locale = 'en' | 'es';

const TEAM_LABEL: Record<CareerTeam, Record<Locale, string>> = {
    engineering: { en: 'Engineering', es: 'Ingeniería' },
    partnerships: { en: 'Partnerships', es: 'Alianzas' },
    operations: { en: 'Operations', es: 'Operaciones' },
    design: { en: 'Design', es: 'Diseño' },
    data: { en: 'Data', es: 'Datos' },
};

const EMPLOYMENT_LABEL: Record<CareerEmploymentType, Record<Locale, string>> = {
    full_time: { en: 'Full-time', es: 'Tiempo completo' },
    part_time: { en: 'Part-time', es: 'Medio tiempo' },
    contract: { en: 'Contract', es: 'Contrato' },
};

const COPY = {
    en: {
        eyebrow: 'Open role at AGCONN',
        teamLabel: 'Team',
        locationLabel: 'Location',
        salaryLabel: 'Salary',
        fallbackTitle: 'Open roles at AGCONN',
    },
    es: {
        eyebrow: 'Vacante en AGCONN',
        teamLabel: 'Equipo',
        locationLabel: 'Ubicación',
        salaryLabel: 'Salario',
        fallbackTitle: 'Vacantes abiertas en AGCONN',
    },
} as const;

type Props = { params: Promise<{ slug: string }> };

export async function GET(req: Request, { params }: Props) {
    const { slug } = await params;
    const { searchParams } = new URL(req.url);
    const locale: Locale = searchParams.get('locale') === 'es' ? 'es' : 'en';
    const t = COPY[locale];
    const role = getCareerRoleBySlug(slug);

    const title = role ? pickLocale(role.title, locale) : t.fallbackTitle;
    const team = role ? TEAM_LABEL[role.team][locale] : '';
    const employment = role ? EMPLOYMENT_LABEL[role.employmentType][locale] : '';
    const location = role?.location ?? '';
    const salary = role?.salaryRange ?? '';

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
                    role ? (
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
                                {[team, employment, location].filter(Boolean).join(' · ')}
                            </span>
                        </div>
                    ) : undefined
                }
            >
                <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
                    <span
                        style={{
                            fontFamily: 'Inter Tight',
                            fontSize: title.length > 48 ? 72 : 88,
                            fontWeight: 700,
                            color: palette.ink,
                            letterSpacing: -3,
                            lineHeight: 1.02,
                            maxWidth: 1050,
                        }}
                    >
                        {title}
                    </span>

                    {salary ? (
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: 14 }}>
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
                                {t.salaryLabel}
                            </span>
                            <span
                                style={{
                                    fontFamily: 'DM Mono',
                                    fontSize: 36,
                                    fontWeight: 500,
                                    color: palette.primary,
                                    letterSpacing: -1,
                                    lineHeight: 1,
                                }}
                            >
                                {salary}
                            </span>
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
