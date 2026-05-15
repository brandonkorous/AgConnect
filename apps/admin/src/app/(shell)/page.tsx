import { requireAdmin } from '@/lib/admin-auth';
import { fetchKpiSummary, type KpiSummary } from '@/lib/kpi-api';
import { resolveRange, type County } from '@/lib/date-ranges';
import { KpiFilters } from '@/components/admin-shell/KpiFilters';
import { KpiTile } from '@/components/admin-shell/KpiTile';
import { WageHistogram } from '@/components/admin-shell/WageHistogram';

export const metadata = { title: 'Overview — AGCONN Admin' };
export const dynamic = 'force-dynamic';

type SearchParams = Record<string, string | string[] | undefined>;

function pickCounties(sp: SearchParams): County[] {
    const raw = Array.isArray(sp['counties'])
        ? sp['counties']
        : sp['counties']
            ? [sp['counties']]
            : [];
    const allowed = new Set<County>(['Fresno', 'Kern', 'Kings', 'Madera', 'Tulare']);
    return raw.filter((c): c is County => allowed.has(c as County));
}

function formatNumber(n: number): string {
    return n.toLocaleString('en-US');
}

function formatWage(n: number | null): string {
    return n == null ? '—' : `$${n.toFixed(2)}`;
}

function formatPct(n: number | null): string {
    return n == null ? '—' : `${(n * 100).toFixed(1)}%`;
}

export default async function DashboardPage({
    searchParams,
}: {
    searchParams: Promise<SearchParams>;
}) {
    const session = await requireAdmin();
    const firstName = session.fullName?.split(' ')[0] ?? 'admin';

    const sp = await searchParams;
    const preset = typeof sp['preset'] === 'string' ? sp['preset'] : 'this_quarter';
    const range = resolveRange(preset);
    const start =
        typeof sp['start'] === 'string' && sp['start']
            ? sp['start']
            : range.preset === 'custom'
                ? new Date(Date.now() - 90 * 86400_000).toISOString().slice(0, 10)
                : range.start!;
    const end =
        typeof sp['end'] === 'string' && sp['end']
            ? sp['end']
            : range.preset === 'custom'
                ? new Date().toISOString().slice(0, 10)
                : range.end!;
    const counties = pickCounties(sp);

    const result = await fetchKpiSummary({
        start,
        end,
        counties: counties.length ? counties : undefined,
    });

    return (
        <div className="space-y-6">
            <div>
                <p className="eyebrow text-base-content/60">Platform</p>
                <h1 className="font-serif text-2xl font-medium tracking-tight">
                    Welcome, <em className="not-italic font-medium">{firstName}</em>.
                </h1>
                <p className="text-base-content/70 mt-1 text-sm">
                    Snapshot of platform health for the selected range. Filters carry into the drill-down
                    reports.
                </p>
            </div>

            <KpiFilters />

            {!result.ok ? (
                <div role="alert" className="alert alert-error">
                    <span>
                        {result.error.code} — {result.error.message}
                    </span>
                </div>
            ) : (
                <Tiles summary={result.data} />
            )}
        </div>
    );
}

function Tiles({ summary }: { summary: KpiSummary }) {
    return (
        <>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <KpiTile
                    label="Hires"
                    value={formatNumber(summary.placements.count)}
                    sublabel={`${formatNumber(summary.placements.uniqueWorkers)} unique workers · avg ${formatWage(summary.placements.avgWage)}`}
                    trendPct={summary.placements.trend.deltaPct}
                    href="/reports/placement"
                />
                <KpiTile
                    label="Trainings completed"
                    value={formatNumber(summary.training.completedCount)}
                    sublabel={`${formatNumber(summary.training.certCount)} certificates issued`}
                    trendPct={summary.training.trend.deltaPct}
                    href="/training"
                />
                <KpiTile
                    label="Active employers"
                    value={formatNumber(summary.employers.activeCount)}
                    sublabel={`${formatNumber(summary.employers.postingsCount)} postings · ${formatPct(summary.employers.hireRate)} hire rate`}
                    trendPct={summary.employers.trend.deltaPct}
                    href="/employers"
                />
                <KpiTile
                    label="Median wage"
                    value={formatWage(summary.wages.median)}
                    sublabel={`p10 ${formatWage(summary.wages.p10)} · p90 ${formatWage(summary.wages.p90)}`}
                />
            </div>
            <div className="grid gap-4 lg:grid-cols-2">
                <WageHistogram
                    distribution={summary.wages.distribution}
                    median={summary.wages.median}
                    p10={summary.wages.p10}
                    p90={summary.wages.p90}
                />
                <div className="bg-base-100 border-base-300 rounded-box border p-5 text-sm">
                    <h3 className="font-serif text-sm font-medium">Quick paths</h3>
                    <ul className="text-base-content/70 mt-3 space-y-1.5 text-xs">
                        <li>
                            <span className="text-base-content/40">Drill into hires →</span>{' '}
                            <a href="/reports/placement" className="link link-hover">
                                Placement report
                            </a>
                        </li>
                        <li>
                            <span className="text-base-content/40">Drill into completions →</span>{' '}
                            <a href="/training" className="link link-hover">
                                Training report
                            </a>
                        </li>
                        <li>
                            <span className="text-base-content/40">Drill into employers →</span>{' '}
                            <a href="/employers" className="link link-hover">
                                Employer activity
                            </a>
                        </li>
                    </ul>
                </div>
            </div>
        </>
    );
}
