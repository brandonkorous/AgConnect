import { useTranslations } from 'next-intl';
import { AVAILABILITY } from './workerMockData';

export function AvailabilityCard() {
    const t = useTranslations('worker.dashboard.availability');
    const days = t.raw('days') as string[];
    const conflictDay = t('conflict_day');

    return (
        <section className="bg-base-100 border-base-300 rounded-2xl border p-4">
            <header className="flex items-start justify-between">
                <div>
                    <div className="font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-base-content/60">
                        {t('eyebrow')}
                    </div>
                    <h3 className="font-serif mt-0.5 text-xl font-medium tracking-tight">
                        {t('title')}
                    </h3>
                </div>
                <button
                    type="button"
                    className="text-primary text-xs font-bold hover:underline"
                >
                    {t('edit')}
                </button>
            </header>

            <ol className="mt-3.5 grid grid-cols-7 gap-1">
                {AVAILABILITY.map((day, i) => (
                    <li
                        key={day.date}
                        className={[
                            'rounded-lg px-1 pb-2.5 pt-2 text-center',
                            day.open
                                ? 'bg-primary text-primary-content'
                                : 'bg-base-200 text-base-content/60',
                        ].join(' ')}
                    >
                        <div className="font-mono text-[10px] font-bold tracking-wider">
                            {days[i] ?? ''}
                        </div>
                        <div className="mt-0.5 text-[9px] font-semibold opacity-80">
                            {day.open ? t('open') : t('off')}
                        </div>
                    </li>
                ))}
            </ol>

            <p className="text-base-content/60 mt-3 text-xs">
                {t('footer', { day: conflictDay })}
            </p>
        </section>
    );
}
