import { getTranslations } from 'next-intl/server';
import type { DashboardStats } from '@/lib/api/employer';

type Tile = {
    key: 'open_positions' | 'spots_remaining' | 'applicants_week' | 'time_to_fill';
    value: string;
    sub: string;
    accent?: 'primary' | 'accent';
};

type Props = {
    locale: string;
    stats: DashboardStats;
    activePostings: number;
    totalSeatsThisWeek: number;
};

export async function EmployerKpiRow({
    locale,
    stats,
    activePostings,
    totalSeatsThisWeek,
}: Props) {
    const t = await getTranslations({ locale, namespace: 'employer.dashboard.kpi' });

    const tiles: Tile[] = [
        {
            key: 'open_positions',
            value: String(stats.activePostings),
            sub: t('open_positions_sub', { count: activePostings }),
        },
        {
            key: 'spots_remaining',
            value: String(stats.spotsRemaining),
            sub: t('spots_remaining_sub', { total: totalSeatsThisWeek }),
            accent: 'accent',
        },
        {
            key: 'applicants_week',
            value: String(stats.applicantsThisWeek),
            sub: t('applicants_week_sub'),
            accent: 'primary',
        },
        {
            key: 'time_to_fill',
            value: stats.avgTimeToFillDays != null ? `${stats.avgTimeToFillDays}d` : '—',
            sub: t('time_to_fill_sub'),
            accent: 'primary',
        },
    ];

    return (
        <div className="stats stats-vertical lg:stats-horizontal bg-base-100 border-base-300 mb-6 w-full rounded-2xl border shadow-[var(--shadow-card)]">
            {tiles.map((tile) => (
                <div key={tile.key} className="stat">
                    <div className="stat-title text-base-content/60 font-mono text-[11px] font-semibold uppercase tracking-[0.18em]">
                        {t(`${tile.key}_label`)}
                    </div>
                    <div
                        className={[
                            'stat-value font-display text-4xl font-light tracking-tight tabular-nums slashed-zero',
                            tile.accent === 'primary'
                                ? 'text-primary'
                                : tile.accent === 'accent'
                                    ? 'text-accent'
                                    : 'text-base-content',
                        ].join(' ')}
                    >
                        {tile.value}
                    </div>
                    <div className="stat-desc text-base-content/60 mt-2 text-xs">{tile.sub}</div>
                </div>
            ))}
        </div>
    );
}
