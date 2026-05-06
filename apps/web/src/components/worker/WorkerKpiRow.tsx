import { getTranslations } from 'next-intl/server';
import { fetchMyPay } from '@/lib/api/me';
import { fetchApplications } from '@/lib/api/applications';

type Props = { locale: string };

const accentClass = {
    primary: 'text-primary',
    accent: 'text-accent',
} as const;

function fmtMoney(cents: number, locale: string): string {
    return new Intl.NumberFormat(locale === 'es' ? 'es-MX' : 'en-US', {
        style: 'currency',
        currency: 'USD',
        maximumFractionDigits: 0,
    }).format(cents / 100);
}

function fmtRate(cents: number, locale: string): string {
    return new Intl.NumberFormat(locale === 'es' ? 'es-MX' : 'en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(cents / 100);
}

export async function WorkerKpiRow({ locale }: Props) {
    const t = await getTranslations({ locale, namespace: 'worker.dashboard.kpi' });
    const [{ summary }, applications] = await Promise.all([
        fetchMyPay(),
        fetchApplications(),
    ]);

    const activeApps = applications.applications.filter(
        (a) => a.status === 'applied' || a.status === 'reviewed',
    ).length;
    const awaitingReply = applications.applications.filter((a) => a.status === 'applied').length;

    const dash = '—';
    const tiles: Array<{
        key: string;
        label: string;
        value: string;
        sub: string;
        accent?: keyof typeof accentClass;
    }> = [
        {
            key: 'week_earned',
            label: t('week_earned.label'),
            value: summary.nextDeposit
                ? fmtMoney(summary.nextDeposit.grossCents, locale)
                : dash,
            sub: summary.nextDeposit
                ? t('week_earned.sub')
                : locale === 'es'
                  ? 'Aún sin pago'
                  : 'No pay yet',
            accent: 'primary',
        },
        {
            key: 'hours_logged',
            label: t('hours_logged.label'),
            value: summary.ytdHours > 0 ? summary.ytdHours.toFixed(1) : dash,
            sub: summary.ytdHours > 0 ? t('hours_logged.sub') : '',
        },
        {
            key: 'active_apps',
            label: t('active_apps.label'),
            value: String(activeApps),
            sub:
                awaitingReply > 0
                    ? locale === 'es'
                        ? `${awaitingReply} esperando respuesta`
                        : `${awaitingReply} awaiting reply`
                    : activeApps > 0
                      ? t('active_apps.sub')
                      : '',
        },
        {
            key: 'avg_rate',
            label: t('avg_rate.label'),
            value: summary.avgHourlyCents > 0 ? fmtRate(summary.avgHourlyCents, locale) : dash,
            sub: summary.avgHourlyCents > 0 ? t('avg_rate.sub') : '',
            accent: 'accent',
        },
    ];

    return (
        <div className="mb-6 grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
            {tiles.map((tile) => (
                <div
                    key={tile.key}
                    className="stat bg-base-100 border-base-300 rounded-2xl border"
                >
                    <div className="stat-title font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-base-content/60">
                        {tile.label}
                    </div>
                    <div
                        className={[
                            'stat-value font-serif text-4xl font-medium leading-none tracking-tight',
                            tile.accent ? accentClass[tile.accent] : 'text-base-content',
                        ].join(' ')}
                    >
                        {tile.value}
                    </div>
                    {tile.sub && (
                        <div className="stat-desc text-base-content/60 text-xs">{tile.sub}</div>
                    )}
                </div>
            ))}
        </div>
    );
}
