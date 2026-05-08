import { getTranslations } from 'next-intl/server';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheck, faMinus } from '@fortawesome/free-solid-svg-icons';
import { EyebrowLabel } from '@/components/primitives/EyebrowLabel';

type Row = { id: string };
type Section = { id: string; rows: Row[] };

const SECTIONS: Section[] = [
    {
        id: 'hiring',
        rows: [
            { id: 'active_postings' },
            { id: 'applicant_kanban' },
            { id: 'worker_search' },
            { id: 'priority_listing' },
            { id: 'auto_match' },
            { id: 'screening' },
            { id: 'seo_board' },
        ],
    },
    {
        id: 'compliance',
        rows: [
            { id: 'flc_badge' },
            { id: 'audit_log' },
            { id: 'compliance_checklist' },
            { id: 'compliance_print' },
            { id: 'wioa_exports' },
            { id: 'pirl_export' },
            { id: 'branded_grant' },
            { id: 'counsel_review' },
        ],
    },
    {
        id: 'scheduling',
        rows: [
            { id: 'crew_groups' },
            { id: 'shift_scheduling' },
            { id: 'shift_sms' },
            { id: 'calendar_sync' },
            { id: 'payroll' },
        ],
    },
    {
        id: 'comms',
        rows: [
            { id: 'worker_alerts' },
            { id: 'applicant_sms' },
            { id: 'in_app_inbox' },
            { id: 'broadcast' },
            { id: 'quiet_hours' },
        ],
    },
    {
        id: 'account',
        rows: [
            { id: 'single_user' },
            { id: 'multi_user' },
            { id: 'custom_counties' },
            { id: 'hire_metrics' },
            { id: 'tenant_isolation' },
            { id: 'success_sla' },
        ],
    },
];

const COLS = ['seed', 'field', 'farm'] as const;
type Col = (typeof COLS)[number];

type Props = { locale: 'en' | 'es' };

export async function PricingComparisonTable({ locale }: Props) {
    const t = await getTranslations({ locale, namespace: 'marketing.pricing_page.compare' });

    return (
        <section className="bg-base-100 w-full border-secondary/15 border-t">
            <div className="container mx-auto flex flex-col gap-12 px-5 py-20 md:px-8 md:py-24 lg:px-20 lg:py-28">
                <div className="flex flex-col gap-4">
                    <EyebrowLabel tone="soil" withRule>
                        {t('eyebrow')}
                    </EyebrowLabel>
                    <h2 className="text-base-content font-serif text-3xl font-medium leading-tight tracking-tight md:text-4xl lg:text-5xl">
                        {t('headline')}
                    </h2>
                    <p className="text-secondary font-sans text-base leading-relaxed max-w-prose">
                        {t('intro')}
                    </p>
                </div>

                <div className="overflow-x-auto -mx-5 px-5 md:mx-0 md:px-0">
                    <table className="w-full min-w-[640px] border-collapse">
                        <thead>
                            <tr className="border-secondary/20 border-b-2">
                                <th
                                    scope="col"
                                    className="text-secondary font-mono text-xs font-bold uppercase tracking-[0.18em] text-left py-4 pr-4 align-bottom"
                                >
                                    {t('col.feature')}
                                </th>
                                {COLS.map((col) => (
                                    <th
                                        key={col}
                                        scope="col"
                                        className={`font-mono text-xs font-bold uppercase tracking-[0.18em] text-center py-4 px-4 align-bottom ${
                                            col === 'field' ? 'text-primary' : 'text-secondary'
                                        }`}
                                    >
                                        {t(`col.${col}`)}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {SECTIONS.map((section) => (
                                <SectionRows key={section.id} section={section} t={t} />
                            ))}
                        </tbody>
                    </table>
                </div>

                <p className="text-secondary font-sans text-sm leading-relaxed max-w-prose">
                    {t('note')}
                </p>
            </div>
        </section>
    );
}

type Translator = (key: string) => string;

function SectionRows({ section, t }: { section: Section; t: Translator }) {
    return (
        <>
            <tr>
                <td
                    colSpan={1 + COLS.length}
                    className="bg-base-200 text-base-content font-mono text-xs font-bold uppercase tracking-[0.22em] py-3 px-4 border-secondary/15 border-y"
                >
                    {t(`section.${section.id}`)}
                </td>
            </tr>
            {section.rows.map((row) => (
                <tr key={row.id} className="border-secondary/10 border-b">
                    <th
                        scope="row"
                        className="text-base-content font-sans text-sm font-normal text-left py-4 pr-4"
                    >
                        {t(`row.${row.id}.label`)}
                    </th>
                    {COLS.map((col) => (
                        <ComparisonCell
                            key={col}
                            value={t(`row.${row.id}.${col}`)}
                            highlighted={col === 'field'}
                        />
                    ))}
                </tr>
            ))}
        </>
    );
}

function ComparisonCell({ value, highlighted }: { value: string; highlighted: boolean }) {
    const isCheck = value === '✓';
    const isDash = value === '—';
    const cellClass = `text-center py-4 px-4 ${highlighted ? 'bg-primary/5' : ''}`;

    if (isCheck) {
        return (
            <td className={cellClass}>
                <FontAwesomeIcon
                    icon={faCheck}
                    className={`text-base ${highlighted ? 'text-primary' : 'text-base-content'}`}
                    aria-label="included"
                />
            </td>
        );
    }
    if (isDash) {
        return (
            <td className={cellClass}>
                <FontAwesomeIcon
                    icon={faMinus}
                    className="text-secondary/40 text-sm"
                    aria-label="not included"
                />
            </td>
        );
    }
    return (
        <td
            className={`${cellClass} text-base-content font-mono text-sm tabular-nums`}
        >
            {value}
        </td>
    );
}
