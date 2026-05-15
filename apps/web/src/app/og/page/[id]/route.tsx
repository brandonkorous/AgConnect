import { ImageResponse } from 'next/og';
import { OgFrame } from '../../_shared/OgFrame';
import { loadFonts } from '../../_shared/fonts';
import { palette } from '../../_shared/palette';
import { getImpact } from '@/lib/api/landing';

export const runtime = 'nodejs';
export const revalidate = 86400;

type Locale = 'en' | 'es';

type PageCopy = {
    eyebrow: { en: string; es: string };
    headline: { en: string; es: string };
    italicLead?: { en: string; es: string };
    subhead: { en: string; es: string };
    accentDot?: 'primary' | 'accent';
    stat?: { en: string; es: string };
};

const PAGES: Record<string, PageCopy> = {
    faq: {
        eyebrow: { en: 'Common questions', es: 'Preguntas frecuentes' },
        headline: {
            en: 'How AGCONN works, in plain terms.',
            es: 'Cómo funciona AGCONN, en palabras claras.',
        },
        subhead: {
            en: 'Verification, pricing, certificates, data — answered for workers, employers, and partners.',
            es: 'Verificación, precios, certificados, datos — respuestas para trabajadores, empleadores y socios.',
        },
        stat: {
            en: 'Workers · Employers · Training organizations · Funders',
            es: 'Trabajadores · Empleadores · Organizaciones · Patrocinadores',
        },
        accentDot: 'primary',
    },
    impact: {
        eyebrow: { en: 'Public impact', es: 'Impacto público' },
        headline: {
            en: 'The numbers, without filter.',
            es: 'Los números, sin filtro.',
        },
        subhead: {
            en: 'Placements, wages, training completions, verified employers — refreshed nightly, WIOA-aligned.',
            es: 'Colocaciones, salarios, capacitaciones, empleadores verificados — al día, alineado con WIOA.',
        },
        accentDot: 'accent',
    },
    pricing: {
        eyebrow: { en: 'Pricing', es: 'Precios' },
        headline: {
            en: 'Workers free. Employers pay.',
            es: 'Trabajadores gratis. Empleadores pagan.',
        },
        subhead: {
            en: 'Seed free · Field $199/mo · Farm $499/mo. No per-hire fee, no commission on wages.',
            es: 'Seed gratis · Field $199/mes · Farm $499/mes. Sin cargo por contratación, sin comisión sobre el salario.',
        },
        stat: {
            en: 'Founder pricing — first 50 paid accounts',
            es: 'Precio fundador — primeras 50 cuentas pagas',
        },
        accentDot: 'primary',
    },
    about: {
        eyebrow: { en: 'About AGCONN', es: 'Quiénes somos' },
        headline: {
            en: 'Bilingual workforce infrastructure for the Central Valley.',
            es: 'Infraestructura laboral bilingüe para el Valle Central.',
        },
        subhead: {
            en: 'Verified employers, bilingual certificates, portable records — built so dignity is the default.',
            es: 'Empleadores verificados, certificados bilingües, registros portátiles — la dignidad por defecto.',
        },
        accentDot: 'primary',
    },
    workers: {
        eyebrow: { en: 'For workers', es: 'Para trabajadores' },
        italicLead: { en: 'Real work,', es: 'Trabajo real,' },
        headline: {
            en: 'in your language.',
            es: 'en tu idioma.',
        },
        subhead: {
            en: 'Seasonal jobs across five Central Valley counties. Sign in by SMS. No app store, no email.',
            es: 'Trabajos de temporada en cinco condados del Valle Central. Ingresa por SMS. Sin tienda, sin correo.',
        },
        accentDot: 'accent',
    },
    employers: {
        eyebrow: { en: 'For employers', es: 'Para empleadores' },
        headline: {
            en: 'Post once. Reach verified workers across five counties.',
            es: 'Publica una vez. Llega a trabajadores verificados en cinco condados.',
        },
        subhead: {
            en: 'FLC license verified, bilingual postings, applicant Kanban, branded grant exports.',
            es: 'Licencia FLC verificada, publicaciones bilingües, Kanban de aplicantes, reportes con marca.',
        },
        accentDot: 'primary',
    },
    partners: {
        eyebrow: { en: 'For funders and partners', es: 'Para patrocinadores y socios' },
        headline: {
            en: 'Grant-defensible reporting, on infrastructure you can audit.',
            es: 'Reportes auditables, en una infraestructura que puedes verificar.',
        },
        subhead: {
            en: 'WIOA-aligned exports, PIRL compliance, multi-tenant from day one — for workforce boards and county agencies.',
            es: 'Reportes alineados con WIOA, cumplimiento PIRL, multi-inquilino — para juntas laborales y agencias.',
        },
        accentDot: 'primary',
    },
    'how-it-works': {
        eyebrow: { en: 'How it works', es: 'Cómo funciona' },
        headline: {
            en: 'Sign in by SMS. Apply with a tap.',
            es: 'Ingresa por SMS. Postula con un toque.',
        },
        subhead: {
            en: 'Workers, employers, and training organizations — each flow end to end, in English and Spanish.',
            es: 'Trabajadores, empleadores y organizaciones — cada flujo completo, en español e inglés.',
        },
        accentDot: 'accent',
    },
    resources: {
        eyebrow: { en: 'Resources', es: 'Recursos' },
        headline: {
            en: 'Worker rights, FLC compliance, CDFA training.',
            es: 'Derechos laborales, cumplimiento FLC, capacitación CDFA.',
        },
        subhead: {
            en: 'Long-form articles, written for the people doing the work — and the people hiring them.',
            es: 'Artículos a fondo, para quienes hacen el trabajo — y quienes contratan.',
        },
        accentDot: 'primary',
    },
    'worker-rights': {
        eyebrow: { en: 'Worker rights', es: 'Derechos del trabajador' },
        headline: {
            en: 'Wages, hours, water, shade, transportation.',
            es: 'Salarios, horas, agua, sombra, transporte.',
        },
        subhead: {
            en: 'What California law guarantees — and how to report when it is not honored.',
            es: 'Lo que la ley de California garantiza — y cómo reportar cuando no se cumple.',
        },
        accentDot: 'accent',
    },
    'skills-wallet': {
        eyebrow: { en: 'Skills wallet', es: 'Cartera de habilidades' },
        headline: {
            en: 'Your record. Bilingual. Portable. Yours.',
            es: 'Tu registro. Bilingüe. Portátil. Tuyo.',
        },
        subhead: {
            en: 'Certificates, training completions, employment history — verified, hashed, and yours to carry.',
            es: 'Certificados, capacitaciones, historial laboral — verificados, con hash, y tuyos.',
        },
        accentDot: 'primary',
    },
    promotora: {
        eyebrow: { en: 'Promotora program', es: 'Programa de promotoras' },
        headline: {
            en: 'Community organizers who know the work.',
            es: 'Organizadores comunitarios que conocen el trabajo.',
        },
        subhead: {
            en: 'Bilingual community partners helping workers sign up, find work, and complete training.',
            es: 'Socios comunitarios bilingües que ayudan a inscribir, conectar y capacitar.',
        },
        accentDot: 'accent',
    },
    careers: {
        eyebrow: { en: 'Careers at AGCONN', es: 'Empleos en AGCONN' },
        headline: {
            en: 'Build infrastructure for the people who feed California.',
            es: 'Construye infraestructura para quienes alimentan California.',
        },
        subhead: {
            en: 'Bilingual product, civic-grade engineering, calm process. Remote-first, Central Valley grounded.',
            es: 'Producto bilingüe, ingeniería cívica, proceso calmado. Primero remoto, anclado al Valle Central.',
        },
        accentDot: 'primary',
    },
    press: {
        eyebrow: { en: 'Press', es: 'Prensa' },
        headline: {
            en: 'News, releases, and the record behind them.',
            es: 'Noticias, comunicados, y el registro detrás de ellos.',
        },
        subhead: {
            en: 'Quotes, datelines, and contact for AGCONN — verified facts, bilingual sources.',
            es: 'Citas, fechas y contacto para AGCONN — hechos verificados, fuentes bilingües.',
        },
        accentDot: 'primary',
    },
    trust: {
        eyebrow: { en: 'Trust and security', es: 'Confianza y seguridad' },
        headline: {
            en: 'Status, incidents, and how we handle your data.',
            es: 'Estado, incidentes, y cómo manejamos tus datos.',
        },
        subhead: {
            en: '99.9% uptime target. SMS-first auth. No data resale, ever.',
            es: 'Objetivo de 99.9% de disponibilidad. Autenticación por SMS. Nunca revendemos datos.',
        },
        accentDot: 'primary',
    },
    contact: {
        eyebrow: { en: 'Contact', es: 'Contacto' },
        headline: {
            en: 'Reach a real person, in English or Spanish.',
            es: 'Comunícate con una persona, en español o inglés.',
        },
        subhead: {
            en: 'support@agconn.com · partnerships@agconn.com · press@agconn.com · security@agconn.com',
            es: 'support@agconn.com · partnerships@agconn.com · press@agconn.com · security@agconn.com',
        },
        accentDot: 'accent',
    },
};

function dotColor(c: PageCopy['accentDot']) {
    return c === 'accent' ? palette.accent : palette.primary;
}

async function impactStat(locale: Locale): Promise<string | null> {
    const impact = await getImpact().catch(() => null);
    if (!impact) return null;
    const numberFmt = new Intl.NumberFormat(locale === 'es' ? 'es-MX' : 'en-US');
    const wageFmt = new Intl.NumberFormat(locale === 'es' ? 'es-MX' : 'en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
    });
    const parts: string[] = [];
    if (impact.workersPlaced != null) {
        parts.push(
            locale === 'es'
                ? `${numberFmt.format(impact.workersPlaced)}+ colocaciones`
                : `${numberFmt.format(impact.workersPlaced)}+ placements`,
        );
    }
    if (impact.medianWage != null) {
        parts.push(
            locale === 'es'
                ? `${wageFmt.format(impact.medianWage)}/h mediana`
                : `${wageFmt.format(impact.medianWage)}/hr median`,
        );
    }
    parts.push(
        locale === 'es'
            ? `${numberFmt.format(impact.verifiedEmployers)} empleadores verificados`
            : `${numberFmt.format(impact.verifiedEmployers)} verified employers`,
    );
    return parts.join(' · ');
}

type Props = { params: Promise<{ id: string }> };

export async function GET(req: Request, { params }: Props) {
    const { id } = await params;
    const { searchParams } = new URL(req.url);
    const locale: Locale = searchParams.get('locale') === 'es' ? 'es' : 'en';
    const copy = PAGES[id];

    if (!copy) {
        return new Response('Not found', { status: 404 });
    }

    let stat: string | null = copy.stat?.[locale] ?? null;
    if (id === 'impact') {
        stat = (await impactStat(locale)) ?? stat;
    }

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
                eyebrow={copy.eyebrow[locale]}
                footerLeft={
                    stat ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <div
                                style={{
                                    width: 10,
                                    height: 10,
                                    borderRadius: 9999,
                                    backgroundColor: dotColor(copy.accentDot),
                                }}
                            />
                            <span
                                style={{
                                    fontFamily: 'Inter',
                                    fontSize: 20,
                                    fontWeight: 600,
                                    color: palette.primary,
                                    letterSpacing: 1,
                                    maxWidth: 720,
                                }}
                            >
                                {stat}
                            </span>
                        </div>
                    ) : undefined
                }
            >
                <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
                    {copy.italicLead ? (
                        <span
                            style={{
                                fontFamily: 'Inter Tight',
                                fontStyle: 'italic',
                                fontSize: 104,
                                fontWeight: 600,
                                color: palette.soil,
                                letterSpacing: -3,
                                lineHeight: 1,
                            }}
                        >
                            {copy.italicLead[locale]}
                        </span>
                    ) : null}
                    <span
                        style={{
                            fontFamily: 'Inter Tight',
                            fontSize: copy.headline[locale].length > 48 ? 78 : 96,
                            fontWeight: 700,
                            color: palette.ink,
                            letterSpacing: -4,
                            lineHeight: 1.02,
                            maxWidth: 1060,
                        }}
                    >
                        {copy.headline[locale]}
                    </span>
                    <span
                        style={{
                            fontFamily: 'Inter',
                            fontSize: 26,
                            fontWeight: 500,
                            color: palette.ink,
                            lineHeight: 1.35,
                            maxWidth: 980,
                            marginTop: 8,
                        }}
                    >
                        {copy.subhead[locale]}
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
