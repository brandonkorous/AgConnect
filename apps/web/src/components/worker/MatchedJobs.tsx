import { useTranslations } from 'next-intl';
import { WorkerJobCard } from './WorkerJobCard';
import { RECOMMENDED_JOBS } from './workerMockData';

const FILTER_KEYS = ['all', 'within_25', 'this_week', 'pays_22'] as const;

export function MatchedJobs() {
    const t = useTranslations('worker.dashboard.matched');

    return (
        <section>
            <header className="mb-3.5 flex flex-wrap items-end justify-between gap-3">
                <div>
                    <h2 className="font-serif text-2xl font-medium tracking-tight">
                        {t('title')}
                    </h2>
                    <p className="text-base-content/60 mt-0.5 text-sm">{t('subtitle')}</p>
                </div>
                <div className="flex flex-wrap gap-1.5">
                    {FILTER_KEYS.map((key, i) => (
                        <button
                            key={key}
                            type="button"
                            className={[
                                'rounded-full px-3 py-1.5 text-xs font-semibold transition-colors',
                                i === 0
                                    ? 'bg-neutral text-neutral-content'
                                    : 'bg-base-100 text-base-content/70 border-base-300 hover:bg-base-200 border',
                            ].join(' ')}
                        >
                            {t(`filters.${key}`)}
                        </button>
                    ))}
                </div>
            </header>
            <div className="grid gap-3.5 md:grid-cols-2">
                {RECOMMENDED_JOBS.map((job) => (
                    <WorkerJobCard key={job.id} job={job} />
                ))}
            </div>
        </section>
    );
}
