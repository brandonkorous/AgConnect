import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faDownload, faCheck, faMinus, faBell } from '@fortawesome/free-solid-svg-icons';
import {
    listComplianceCategories,
    listComplianceActions,
    getComplianceSummary,
} from '@/lib/api/employer-ops';
import {
    NewComplianceItemButton,
    EditComplianceItemButton,
    ComplianceActionCta,
} from '@/components/employer/compliance/ComplianceItemActions';

export const dynamic = 'force-dynamic';

type Props = { params: Promise<{ locale: string }> };

type ComplianceAction = Awaited<ReturnType<typeof listComplianceActions>>[number];

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: 'employer.compliance' });
    return { title: `AgConn — ${t('title')}` };
}

export default async function CompliancePage({ params }: Props) {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: 'employer.compliance' });

    const [cats, actions, summary] = await Promise.all([
        listComplianceCategories(),
        listComplianceActions(),
        getComplianceSummary(),
    ]);

    const overall = summary?.overall
        ?? Math.round(cats.reduce((sum, c) => sum + c.score, 0) / Math.max(1, cats.length));
    const totalItems = cats.reduce((n, c) => n + c.items.length, 0);
    const okItems = cats.reduce(
        (n, c) => n + c.items.filter((it) => it.status === 'ok').length,
        0,
    );
    const openItems = totalItems - okItems;

    const subtitle = (() => {
        if (summary?.delta != null && summary.priorScore != null) {
            const sign = summary.delta > 0 ? '+' : '';
            return t('overall_delta_real', {
                sign,
                delta: summary.delta,
                prior: summary.priorScore,
            });
        }
        return t('overall_delta');
    })();

    const inspectionLine = summary?.dolLastInspectionAt
        ? t('dol_inspection_last', {
            date: new Date(summary.dolLastInspectionAt).toLocaleDateString(
                locale === 'es' ? 'es-MX' : 'en-US',
                { month: 'short', day: 'numeric', year: 'numeric' },
            ),
            result: t(`dol_result.${summary.dolLastInspectionResult ?? 'pending'}`),
        })
        : t('dol_inspection_none');

    return (
        <div className="container mx-auto px-5 pb-16 pt-8 md:px-8 lg:px-20">
            <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
                <div>
                    <p className="text-base-content/60 text-[11px] font-semibold uppercase tracking-[0.18em]">
                        {t('title')}
                    </p>
                    <h1 className="font-display mt-2 text-4xl font-semibold leading-tight tracking-tight tabular-nums slashed-zero md:text-5xl">
                        <span className="text-primary">{overall}%</span> {t('headline_suffix')}
                    </h1>
                    <div className="text-base-content/70 mt-2 text-sm">
                        {overall < 100 && actions.length === 0 && openItems > 0
                            ? t('summary_open', { open: openItems })
                            : t('summary', { actions: actions.length })}
                    </div>
                </div>
                <div className="flex gap-2">
                    <NewComplianceItemButton />
                    <a
                        href={`/${locale}/employer/compliance/audit`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-primary rounded-full"
                    >
                        <FontAwesomeIcon icon={faDownload} className="h-3.5 w-3.5" />
                        {t('audit_pdf')}
                    </a>
                </div>
            </div>

            <div className="mb-6 grid gap-4 lg:grid-cols-[260px_1fr]">
                <div className="bg-base-100 border-base-300 grid place-items-center rounded-2xl border p-5 text-center">
                    <div
                        className="grid h-[150px] w-[150px] place-items-center rounded-full"
                        style={{
                            background: `conic-gradient(var(--color-primary) ${overall * 3.6}deg, var(--color-base-200) 0)`,
                        }}
                    >
                        <div className="bg-base-100 grid h-[124px] w-[124px] place-items-center rounded-full">
                            <div>
                                <div className="text-primary font-display text-5xl font-semibold leading-none tracking-tight tabular-nums slashed-zero">
                                    {overall}
                                    <span className="text-base-content/40 text-lg">%</span>
                                </div>
                                <div className="text-base-content/60 mt-1 text-[11px] font-semibold uppercase tracking-[0.18em]">
                                    {t('overall_label')}
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="text-base-content/70 mt-3 text-xs">{subtitle}</div>
                    <div className="text-base-content/55 mt-1 text-[11px]">{inspectionLine}</div>
                </div>

                <div className="bg-base-100 border-base-300 rounded-2xl border p-5">
                    <div className="mb-3 flex items-center gap-2">
                        <FontAwesomeIcon icon={faBell} className="text-warning h-4 w-4" />
                        <h2 className="font-display text-xl font-semibold tracking-tight tabular-nums slashed-zero">
                            {actions.length === 0 && overall < 100 && openItems > 0
                                ? t('actions_title_pending', { open: openItems })
                                : t('actions_title', { count: actions.length })}
                        </h2>
                    </div>
                    <div className="grid gap-3">
                        {actions.map((a, i) => {
                            const tone =
                                a.severity === 'urgent'
                                    ? { card: 'bg-error/10 border-error/30', pill: 'bg-error text-error-content' }
                                    : { card: 'bg-warning/10 border-warning/30', pill: 'bg-warning text-warning-content' };
                            return (
                                <div
                                    key={i}
                                    className={['flex flex-wrap items-center gap-3 rounded-2xl border p-3.5', tone.card].join(' ')}
                                >
                                    <div className="min-w-[260px] flex-1">
                                        <div className="mb-1 flex flex-wrap items-center gap-2">
                                            <span
                                                className={[
                                                    'rounded-full px-2 py-0.5 text-[11px] font-semibold uppercase tracking-[0.18em]',
                                                    tone.pill,
                                                ].join(' ')}
                                            >
                                                {t(`severity.${a.severity}`)}
                                            </span>
                                            <span className="text-sm font-semibold">{a.title}</span>
                                        </div>
                                        <div className="text-base-content/70 text-xs">{a.detail}</div>
                                    </div>
                                    <ComplianceActionCta action={{ ...a, cta: a.severity === 'urgent' ? t('action_cta.cta_resolve') : t(`severity_cta.${a.severity}`) } as ComplianceAction} />
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
                {cats.map((c) => (
                    <div key={c.key} className="bg-base-100 border-base-300 rounded-2xl border p-5">
                        <div className="mb-3 flex items-center justify-between">
                            <h2 className="text-sm font-semibold">{t(`category.${c.key}`)}</h2>
                            <div className="flex items-center gap-2">
                                <div className="bg-base-200 h-1.5 w-[60px] overflow-hidden rounded-full">
                                    <div
                                        className={[
                                            'h-full',
                                            c.score >= 95 ? 'bg-success' : c.score >= 85 ? 'bg-warning' : 'bg-error',
                                        ].join(' ')}
                                        style={{ width: `${c.score}%` }}
                                    />
                                </div>
                                <span
                                    className={[
                                        'text-xs font-bold tabular-nums slashed-zero',
                                        c.score >= 95 ? 'text-success' : c.score >= 85 ? 'text-warning' : 'text-error',
                                    ].join(' ')}
                                >
                                    {c.score}%
                                </span>
                            </div>
                        </div>
                        <div className="grid gap-2">
                            {c.items.map((it) => {
                                const tone =
                                    it.status === 'ok'
                                        ? { dot: 'bg-success text-success-content', icon: faCheck }
                                        : it.status === 'warn'
                                            ? { dot: 'bg-warning text-warning-content', icon: faBell }
                                            : { dot: 'bg-error text-error-content', icon: faMinus };
                                return (
                                    <div
                                        key={it.key}
                                        className="bg-base-200 flex items-center gap-3 rounded-2xl px-3 py-2"
                                    >
                                        <div
                                            className={[
                                                'grid h-5 w-5 shrink-0 place-items-center rounded-full',
                                                tone.dot,
                                            ].join(' ')}
                                        >
                                            <FontAwesomeIcon icon={tone.icon} className="h-2.5 w-2.5" />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <div className="text-xs font-medium">{it.label}</div>
                                            <div className="text-base-content/60 text-[11px]">{it.details}</div>
                                        </div>
                                        {it.id && (
                                            <EditComplianceItemButton
                                                itemId={it.id}
                                                status={it.status}
                                                details={it.details}
                                                evidenceUrl={it.evidenceUrl ?? null}
                                                evidence={it.evidence ?? null}
                                                instructions={it.instructions ?? null}
                                                dueAt={it.dueAt}
                                                label={it.label}
                                            />
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
