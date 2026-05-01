import { useTranslations } from 'next-intl';

type KpiKey = 'week_earned' | 'hours_logged' | 'active_apps' | 'avg_rate';

type Tile = {
    key: KpiKey;
    value: string;
    accent?: 'primary' | 'accent';
};

const TILES: Tile[] = [
    { key: 'week_earned', value: '$1,124', accent: 'primary' },
    { key: 'hours_logged', value: '49.5' },
    { key: 'active_apps', value: '5' },
    { key: 'avg_rate', value: '$22.74', accent: 'accent' },
];

const accentClass: Record<NonNullable<Tile['accent']>, string> = {
    primary: 'text-primary',
    accent: 'text-accent',
};

export function WorkerKpiRow() {
    const t = useTranslations('worker.dashboard.kpi');

    return (
        <div className="mb-6 grid gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
            {TILES.map((tile) => (
                <div
                    key={tile.key}
                    className="bg-base-100 border-base-300 rounded-2xl border p-5"
                >
                    <div className="font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-base-content/60">
                        {t(`${tile.key}.label`)}
                    </div>
                    <div className="mt-2.5 flex items-end gap-2.5">
                        <div
                            className={[
                                'font-serif text-4xl font-medium leading-none tracking-tight',
                                tile.accent ? accentClass[tile.accent] : 'text-base-content',
                            ].join(' ')}
                        >
                            {tile.value}
                        </div>
                        <div className="text-base-content/60 pb-1.5 text-xs">
                            {t(`${tile.key}.sub`)}
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}
