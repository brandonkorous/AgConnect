import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import {
    getCurrentPayrollPeriod,
    getPayrollSeasonToDate,
    listPayrollLines,
} from '@/lib/api/employer-ops';
import { PayrollActions } from '@/components/employer/payroll/PayrollActions';
import { PayrollLineRow } from '@/components/employer/payroll/PayrollLineRow';
import { DarkHeroCard } from '@/components/employer/primitives';

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: 'employer.payroll' });
    return { title: `AgConn — ${t('title')}` };
}

export default async function PayrollPage({ params }: Props) {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: 'employer.payroll' });
    const period = await getCurrentPayrollPeriod();
    const [lines, season] = await Promise.all([
        listPayrollLines(period.id),
        getPayrollSeasonToDate(),
    ]);

    const fmtCents = (c: number, withSign = false) => {
        const n = Math.abs(c) / 100;
        const s = n.toLocaleString(locale === 'es' ? 'es-MX' : 'en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        });
        return `${withSign && c < 0 ? '−' : ''}$${s}`;
    };
    const hasLines = lines.length > 0;

    return (
        <div className=" px-5 pb-16 pt-8">
            <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
                <div>
                    <p className="text-base-content/60 font-mono text-[11px] uppercase tracking-wider">
                        {t('eyebrow', {
                            start: shortDate(period.startDate, locale),
                            end: shortDate(period.endDate, locale),
                        })}
                    </p>
                    <h1 className="font-display mt-2 text-4xl font-light leading-tight tracking-tight md:text-5xl">
                        {t('title_a')} <em className="text-primary not-italic font-light">{t('title_b')}</em>
                    </h1>
                    <div className="text-base-content/70 mt-2 text-sm">
                        {t('summary', {
                            workers: period.totals.workers,
                            hours: period.totals.hours.toLocaleString(),
                            bonuses: lines.filter((l) => l.bonusCents > 0).length,
                        })}
                    </div>
                </div>
                <PayrollActions
                    periodId={period.id}
                    status={period.status}
                    workers={period.totals.workers}
                    netCents={period.totals.netCents}
                />
            </div>

            <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-[1.4fr_1fr]">
                <DarkHeroCard glow="gold">
                    <div className="text-accent font-mono text-[11px] uppercase tracking-wider">
                        {t('hero_eyebrow')}
                    </div>
                    <div className="font-display mt-3 text-6xl font-light leading-none tracking-tight tabular-nums slashed-zero">
                        {fmtCents(period.totals.netCents)}
                    </div>
                    <div className="border-base-100/20 mt-6 grid grid-cols-4 gap-4 border-t pt-5">
                        {[
                            { l: t('stat.gross'), v: fmtCents(period.totals.grossCents) },
                            { l: t('stat.bonuses'), v: fmtCents(period.totals.bonusCents) },
                            { l: t('stat.taxes'), v: fmtCents(-period.totals.taxesCents, true) },
                            { l: t('stat.hours'), v: period.totals.hours.toLocaleString() },
                        ].map((c, i) => (
                            <div key={i}>
                                <div className="text-base-100/60 font-mono text-[10px] font-bold uppercase tracking-wider">
                                    {c.l}
                                </div>
                                <div className="font-display mt-1 text-xl font-light tracking-tight tabular-nums slashed-zero">
                                    {c.v}
                                </div>
                            </div>
                        ))}
                    </div>
                </DarkHeroCard>
                <div className="grid grid-rows-2 gap-4">
                    <div className="bg-base-100 border-base-300 rounded-2xl border p-5">
                        <div className="text-base-content/60 font-mono text-[11px] font-semibold uppercase tracking-wider">
                            {t('season_to_date')}
                        </div>
                        <div className="text-primary font-display mt-2 text-3xl font-light tracking-tight">
                            {fmtCents(season.netCents)}
                        </div>
                        <div className="text-base-content/60 text-xs">
                            {t('season_to_date_sub', {
                                periods: season.periods,
                                workers: season.uniqueWorkers,
                            })}
                        </div>
                        {season.perPeriod.length > 0 && (
                            <div className="mt-4 flex h-8 items-end gap-1">
                                {(() => {
                                    const max = Math.max(...season.perPeriod.map((p) => p.netCents), 1);
                                    return season.perPeriod.map((p, i) => {
                                        const h = Math.max(8, Math.round((p.netCents / max) * 100));
                                        return (
                                            <div key={i} className="flex flex-1 items-end">
                                                <div
                                                    className={[
                                                        'w-full rounded-sm',
                                                        p.isCurrent ? 'bg-accent' : 'bg-primary/60',
                                                    ].join(' ')}
                                                    style={{ height: `${h}%` }}
                                                />
                                            </div>
                                        );
                                    });
                                })()}
                            </div>
                        )}
                    </div>
                    <div
                        className={[
                            'bg-accent text-accent-content rounded-2xl p-5',
                            hasLines ? '' : 'opacity-60',
                        ].join(' ')}
                    >
                        <div className="font-mono text-[11px] font-bold uppercase tracking-wider">
                            {t('h2a_eyebrow')}
                            {!hasLines && (
                                <span className="ml-2 font-normal opacity-80">{t('h2a_no_data')}</span>
                            )}
                        </div>
                        <h2 className="font-display mt-2 text-xl font-light leading-tight tracking-tight">
                            {t('h2a_headline')}
                        </h2>
                        <div className="mt-2 text-xs opacity-90">{t('h2a_sub')}</div>
                    </div>
                </div>
            </div>

            <section className="bg-base-100 border-base-300 overflow-hidden rounded-2xl border">
                <div className="border-base-300 flex items-center justify-between border-b px-5 py-4">
                    <h2 className="font-display text-xl font-light tracking-tight">{t('table.title')}</h2>
                    <div className="text-base-content/60 text-xs">
                        {t('table.showing', { n: lines.length, total: lines.length })} ·{' '}
                        <a className="text-primary font-semibold">{t('table.view_all')} →</a>
                    </div>
                </div>
                <div className="bg-base-200 border-base-300 text-base-content/60 grid grid-cols-[2fr_1.4fr_0.8fr_0.7fr_1fr_0.9fr_1fr_100px] gap-3 border-b px-5 py-3 font-mono text-[10px] font-bold uppercase tracking-wider">
                    <span>{t('table.col_worker')}</span>
                    <span>{t('table.col_role')}</span>
                    <span>{t('table.col_hours')}</span>
                    <span>{t('table.col_overtime')}</span>
                    <span>{t('table.col_gross')}</span>
                    <span>{t('table.col_bonus')}</span>
                    <span>{t('table.col_net')}</span>
                    <span className="text-right">{t('table.col_actions')}</span>
                </div>
                {lines.map((r, i) => (
                    <PayrollLineRow
                        key={r.id}
                        periodId={period.id}
                        line={r}
                        border={i < lines.length - 1}
                        locked={period.status !== 'draft'}
                        approved={r.approvedAt !== null}
                    />
                ))}
            </section>
        </div>
    );
}

function shortDate(iso: string, locale: string): string {
    const [y = 0, m = 1, d = 1] = iso.split('-').map(Number);
    return new Intl.DateTimeFormat(locale === 'es' ? 'es-MX' : 'en-US', {
        month: 'short',
        day: 'numeric',
    }).format(new Date(y, m - 1, d));
}
