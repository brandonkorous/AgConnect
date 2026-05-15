import type { Locale } from './waitlist.js';
import type { GrantReportEmailTemplate } from '../queue.js';

export type GrantReportEmailCopy = {
    subject: string;
    preheader: string;
    heading: string;
    intro: string;
    body: string[];
    cta?: { label: string; pathByLocale: { en: string; es: string } };
    signoff: string;
};

type Vars = Record<string, string | number | null | undefined>;

function fmt(template: string, vars: Vars): string {
    return template.replace(/\{(\w+)\}/g, (_, k) => {
        const v = vars[k];
        return v === undefined || v === null ? '' : String(v);
    });
}

const COPY: Record<GrantReportEmailTemplate, Record<Locale, GrantReportEmailCopy>> = {
    'grant.report_ready': {
        en: {
            subject: 'Your AGCONN grant report is ready',
            preheader: '{reportName} — {dateRange} — {rowCount} rows.',
            heading: 'Your grant report is ready',
            intro:
                '{reportName} for {dateRange} is ready to download. {rowCount} rows in the export.',
            body: [
                'The link below opens a signed download that expires in 24 hours. The full export is also archived in AGCONN admin under Past Exports — re-download any time.',
                'WIOA / CalJOBS field labels follow Title I conventions. If your grantee uses a different overlay, the audit log captures the exact filters used so you can reproduce or adjust the export.',
            ],
            cta: {
                label: 'Download report',
                pathByLocale: { en: '/admin/reports/runs', es: '/admin/reports/runs' },
            },
            signoff: '— The AGCONN team',
        },
        es: {
            subject: 'Tu reporte de subvención de AGCONN está listo',
            preheader: '{reportName} — {dateRange} — {rowCount} filas.',
            heading: 'Tu reporte está listo',
            intro:
                '{reportName} para {dateRange} está listo para descargar. {rowCount} filas en la exportación.',
            body: [
                'El enlace abajo abre una descarga firmada que expira en 24 horas. La exportación también queda archivada en el panel de admin de AGCONN — puedes volver a descargarla cuando quieras.',
                'Los nombres de campo WIOA / CalJOBS siguen las convenciones del Título I. Si tu socio usa una plantilla diferente, el registro de auditoría captura los filtros exactos para reproducir o ajustar la exportación.',
            ],
            cta: {
                label: 'Descargar reporte',
                pathByLocale: { en: '/admin/reports/runs', es: '/admin/reports/runs' },
            },
            signoff: '— El equipo de AGCONN',
        },
    },
};

export function getGrantReportCopy(
    template: GrantReportEmailTemplate,
    locale: Locale,
    vars: Vars,
): GrantReportEmailCopy {
    const base = COPY[template][locale];
    return {
        subject: fmt(base.subject, vars),
        preheader: fmt(base.preheader, vars),
        heading: fmt(base.heading, vars),
        intro: fmt(base.intro, vars),
        body: base.body.map((p) => fmt(p, vars)),
        cta: base.cta,
        signoff: base.signoff,
    };
}
