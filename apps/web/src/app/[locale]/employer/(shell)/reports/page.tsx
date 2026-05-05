import type { Metadata, Route } from 'next';
import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { faDownload, faCalendarDays } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { getReportsOverview } from '@/lib/api/employer-ops';
import { listEmployerJobs, type EmployerJobView } from '@/lib/api/employer';
import { DownloadButton } from '@/components/employer/primitives/DownloadButton';

type RangeKey = 'week' | 'month' | 'quarter' | 'season' | 'year';

type Props = {
    params: Promise<{ locale: string }>;
    searchParams: Promise<{ range?: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: 'employer.reports' });
    return { title: `AgConn — ${t('title')}` };
}

export default async function ReportsPage({ params, searchParams }: Props) {
    const { locale } = await params;
    const sp = await searchParams;
    const range = normalizeRange(sp.range);
    const t = await getTranslations({ locale, namespace: 'employer.reports' });
    const [data, allJobs] = await Promise.all([getReportsOverview(), listEmployerJobs()]);
    const jobs = filterJobsByRange(allJobs, range);

    const seasonRange = computeSeasonRange(jobs, locale);
    const year = seasonRange.year;
    const months = seasonRange.monthLabels;
    const jobTypes = data.byJobType.length;
    const flowSub =
        jobs.length > 0
            ? t('applicant_flow.sub_real', { range: seasonRange.label, jobTypes })
            : t('applicant_flow.sub_empty');

    function rangeHref(r: RangeKey): string {
        return r === 'season'
            ? `/${locale}/employer/reports`
            : `/${locale}/employer/reports?range=${r}`;
    }

    return (
        <div className="px-5 pb-16 pt-8">
            <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
                <div>
                    <p className="text-base-content/60 font-mono text-[11px] uppercase tracking-wider">
                        {t('eyebrow', { year })}
                    </p>
                    <h1 className="font-display mt-2 text-4xl font-light leading-tight tracking-tight md:text-5xl">
                        {t('title_a')} <em className="text-primary not-italic font-light">{t('title_b')}</em>
                    </h1>
                    <div className="text-base-content/70 mt-2 text-sm">{t('summary')}</div>
                </div>
                <div className="flex gap-2">
                    <details className="dropdown dropdown-end">
                        <summary className="btn btn-sm bg-base-100 border-base-300 rounded-full border font-medium">
                            <FontAwesomeIcon icon={faCalendarDays} className="h-3 w-3" />
                            {t(`range.${range}`)}
                        </summary>
                        <ul className="dropdown-content menu bg-base-100 border-base-300 rounded-box z-10 mt-2 w-44 border p-2 text-xs shadow-md">
                            {(['week', 'month', 'quarter', 'season', 'year'] as const).map((r) => (
                                <li key={r}>
                                    <Link href={rangeHref(r) as Route} aria-current={r === range ? 'page' : undefined}>
                                        {t(`range.${r}`)}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </details>
                    <DownloadButton
                        path={`/v1/employer/reports/overview.csv?range=${range}`}
                        label={t('export_csv')}
                        icon={faDownload}
                        filename={`agconn-reports-${year}-${range}.csv`}
                    />
                </div>
            </div>

            <div className="stats stats-vertical lg:stats-horizontal bg-base-100 border-base-300 mb-6 w-full rounded-2xl border shadow-[var(--shadow-card)]">
                {data.kpis.map((k) => {
                    const label = t(`kpi.${k.key}.label`);
                    const subCount = parseSubCount(k.sub);
                    const sub = t(`kpi.${k.key}.sub`, { count: subCount });
                    const showSub = !(k.key === 'hires' && k.value === '0');
                    return (
                        <div key={k.key} className="stat">
                            <div className="stat-title text-base-content/60 font-mono text-[11px] font-semibold uppercase tracking-wider">
                                {label}
                            </div>
                            <div className="stat-value text-primary font-display text-4xl font-light tracking-tight tabular-nums slashed-zero">
                                {k.value === '—' ? '0' : k.value}
                            </div>
                            <div className="stat-desc text-success mt-2 font-mono text-xs font-bold">{k.delta}</div>
                            {showSub && (
                                <div className="stat-desc text-base-content/60 mt-1 text-xs">{sub}</div>
                            )}
                        </div>
                    );
                })}
            </div>

            <section className="bg-base-100 border-base-300 mb-6 rounded-2xl border p-6">
                <div className="mb-5 flex items-end justify-between">
                    <div>
                        <div className="font-display text-xl font-light tracking-tight">
                            {t('applicant_flow.title')}
                        </div>
                        <div className="text-base-content/60 mt-0.5 text-xs">{flowSub}</div>
                    </div>
                    <div className="flex gap-3 text-xs">
                        <div className="inline-flex items-center gap-1.5">
                            <div className="bg-primary h-3 w-3 rounded-sm" />
                            {t('applicant_flow.applicants')}
                        </div>
                        <div className="inline-flex items-center gap-1.5">
                            <div className="bg-accent h-3 w-3 rounded-sm" />
                            {t('applicant_flow.hired')}
                        </div>
                    </div>
                </div>
                {hasFlowData(data.seasonFlow) ? (
                    <>
                        <FlowChart points={data.seasonFlow} />
                        <div className="text-base-content/60 mt-2 flex justify-between font-mono text-[10px]">
                            {months.map((m) => (
                                <span key={m}>{m}</span>
                            ))}
                        </div>
                    </>
                ) : (
                    <div className="text-base-content/55 grid place-items-center py-12 text-center text-sm">
                        {t('applicant_flow.no_data')}
                    </div>
                )}
            </section>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                <div className="bg-base-100 border-base-300 rounded-2xl border p-6">
                    <div className="font-display mb-4 text-lg font-light tracking-tight">
                        {t('by_job_type')}
                    </div>
                    {data.byJobType.map((j, i) => (
                        <div
                            key={j.label}
                            className={[
                                'grid grid-cols-[180px_1fr_60px] items-center gap-3 py-2.5 text-sm',
                                i < data.byJobType.length - 1 ? 'border-base-300 border-b border-dashed' : '',
                            ].join(' ')}
                        >
                            <span className="font-semibold">{j.label}</span>
                            <div>
                                <div className="text-base-content/60 flex justify-between font-mono text-[10px]">
                                    <span>
                                        {j.applied} applied · {j.hired} hired
                                    </span>
                                    <span>{j.fillPct}% filled</span>
                                </div>
                                <div className="bg-base-200 mt-1 h-1.5 overflow-hidden rounded-full">
                                    <div
                                        className={[
                                            'h-full',
                                            j.fillPct === 100
                                                ? 'bg-success'
                                                : j.fillPct > 50
                                                    ? 'bg-accent'
                                                    : 'bg-error',
                                        ].join(' ')}
                                        style={{ width: `${j.fillPct}%` }}
                                    />
                                </div>
                            </div>
                            <span className="text-primary text-right font-mono text-base font-bold">
                                {j.hired}
                            </span>
                        </div>
                    ))}
                </div>

                <div className="bg-base-100 border-base-300 rounded-2xl border p-6">
                    <div className="mb-4 flex items-baseline justify-between">
                        <div className="font-display text-lg font-light tracking-tight">{t('top_workers')}</div>
                        <span className="text-base-content/60 text-xs">{t('top_workers_sub')}</span>
                    </div>
                    {data.topWorkers.map((p, i) => (
                        <div
                            key={p.rank}
                            className={[
                                'flex items-center gap-3 py-2.5',
                                i < data.topWorkers.length - 1 ? 'border-base-300 border-b border-dashed' : '',
                            ].join(' ')}
                        >
                            <div className="text-base-content/60 w-5 font-mono text-xs font-bold">{p.rank}</div>
                            <div
                                className={[
                                    'grid h-8 w-8 place-items-center rounded-full font-mono text-[11px] font-bold',
                                    p.rank === 1 ? 'bg-accent text-accent-content' : 'bg-base-content text-base-100',
                                ].join(' ')}
                            >
                                {p.initials}
                            </div>
                            <div className="flex-1">
                                <div className="text-sm font-semibold">{p.name}</div>
                                <div className="text-base-content/60 text-[11px]">{p.role}</div>
                            </div>
                            <div className="text-right">
                                <div className="font-mono text-xs font-bold">{p.metric}</div>
                                <div className="text-primary text-[11px] font-bold">{p.delta}</div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

function hasFlowData(points: { applied: number; hired: number }[]): boolean {
    return points.some((p) => p.applied > 0 || p.hired > 0);
}

function parseSubCount(sub: string | null): number {
    if (!sub) return 0;
    const m = /(\d+)/.exec(sub);
    return m ? Number(m[1]) : 0;
}

function normalizeRange(raw: string | undefined): RangeKey {
    const allowed: readonly RangeKey[] = ['week', 'month', 'quarter', 'season', 'year'];
    return allowed.includes(raw as RangeKey) ? (raw as RangeKey) : 'season';
}

function filterJobsByRange(jobs: EmployerJobView[], range: RangeKey): EmployerJobView[] {
    if (range === 'season') return jobs;
    const now = new Date();
    let cutoff = new Date(0);
    if (range === 'week') {
        cutoff = new Date(now);
        cutoff.setDate(cutoff.getDate() - 7);
    } else if (range === 'month') {
        cutoff = new Date(now.getFullYear(), now.getMonth(), 1);
    } else if (range === 'quarter') {
        const qStart = Math.floor(now.getMonth() / 3) * 3;
        cutoff = new Date(now.getFullYear(), qStart, 1);
    } else if (range === 'year') {
        cutoff = new Date(now.getFullYear(), 0, 1);
    }
    const cutoffMs = cutoff.getTime();
    return jobs.filter((j) => {
        const start = new Date(j.startDate).getTime();
        const end = j.endDate ? new Date(j.endDate).getTime() : start;
        return end >= cutoffMs;
    });
}

type SeasonRange = {
    label: string;
    year: number;
    monthLabels: string[];
};

function computeSeasonRange(
    jobs: { startDate: string; endDate: string | null }[],
    locale: string,
): SeasonRange {
    const lang = locale === 'es' ? 'es-MX' : 'en-US';
    const fallback = (() => {
        const now = new Date();
        const monthName = new Intl.DateTimeFormat(lang, { month: 'long' }).format(now);
        return {
            label: `${monthName} ${now.getFullYear()}`,
            year: now.getFullYear(),
            monthLabels: [monthName],
        };
    })();

    if (jobs.length === 0) return fallback;

    const stamps: number[] = [];
    for (const j of jobs) {
        const startMs = parseLocalDate(j.startDate);
        if (Number.isFinite(startMs)) stamps.push(startMs);
        if (j.endDate) {
            const endMs = parseLocalDate(j.endDate);
            if (Number.isFinite(endMs)) stamps.push(endMs);
        }
    }
    if (stamps.length === 0) return fallback;

    const minMs = Math.min(...stamps);
    const maxMs = Math.max(...stamps);
    const start = new Date(minMs);
    const end = new Date(maxMs);

    const fmtMonth = new Intl.DateTimeFormat(lang, { month: 'long' });
    const fmtMonthShort = new Intl.DateTimeFormat(lang, { month: 'short' });
    const fmtDay = new Intl.DateTimeFormat(lang, { day: 'numeric' });

    const startMonth = fmtMonth.format(start);
    const endMonth = fmtMonth.format(end);
    const year = end.getFullYear();
    const sameMonth =
        start.getFullYear() === end.getFullYear() && start.getMonth() === end.getMonth();
    const label = sameMonth
        ? `${startMonth} ${year}`
        : `${capitalize(startMonth)} – ${capitalize(endMonth)} ${year}`;

    const monthLabels: string[] = [];
    const cursor = new Date(start.getFullYear(), start.getMonth(), 1);
    const final = new Date(end.getFullYear(), end.getMonth(), 1);
    let i = 0;
    while (cursor <= final) {
        const month = capitalize(fmtMonthShort.format(cursor));
        if (i === 0) {
            monthLabels.push(`${month} ${fmtDay.format(start)}`);
        } else if (cursor.getTime() === final.getTime()) {
            monthLabels.push(`${month} ${fmtDay.format(end)}`);
        } else {
            monthLabels.push(month);
        }
        cursor.setMonth(cursor.getMonth() + 1);
        i++;
    }

    return { label, year, monthLabels };
}

function parseLocalDate(iso: string): number {
    const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
    if (!m) return new Date(iso).getTime();
    return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])).getTime();
}

function capitalize(s: string): string {
    return s.charAt(0).toUpperCase() + s.slice(1);
}

function FlowChart({
    points,
}: {
    points: { week: number; applied: number; hired: number }[];
}) {
    const maxV = 200;
    const w = 1100;
    const h = 240;

    return (
        <svg viewBox={`0 0 ${w} ${h}`} className="h-60 w-full">
            {[0, 60, 120, 180, 240].map((y) => (
                <line
                    key={y}
                    x1="0"
                    y1={y}
                    x2={w}
                    y2={y}
                    stroke="var(--color-base-300)"
                    strokeWidth="1"
                />
            ))}
            {points.map((p, i) => {
                const x = (i / (points.length - 1)) * (w - 20) + 10;
                const next = points[i + 1];
                if (!next) return null;
                const x2 = ((i + 1) / (points.length - 1)) * (w - 20) + 10;
                const y = h - (p.applied / maxV) * h;
                const y2 = h - (next.applied / maxV) * h;
                return (
                    <line
                        key={`l-${i}`}
                        x1={x}
                        y1={y}
                        x2={x2}
                        y2={y2}
                        stroke="var(--color-primary)"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                    />
                );
            })}
            {points.map((p, i) => {
                const x = (i / (points.length - 1)) * (w - 20) + 10;
                const colW = (w - 20) / points.length - 4;
                const barH = (p.hired / maxV) * h;
                return (
                    <rect
                        key={`b-${i}`}
                        x={x - colW / 2}
                        y={h - barH}
                        width={colW}
                        height={barH}
                        fill="var(--color-accent)"
                        opacity="0.65"
                        rx="2"
                    />
                );
            })}
            {points.map((p, i) => {
                const x = (i / (points.length - 1)) * (w - 20) + 10;
                const y = h - (p.applied / maxV) * h;
                return <circle key={`c-${i}`} cx={x} cy={y} r="3" fill="var(--color-primary)" />;
            })}
        </svg>
    );
}
