import { getTranslations, getLocale } from 'next-intl/server';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowRight } from '@fortawesome/free-solid-svg-icons';
import { EyebrowLabel } from '@/components/primitives/EyebrowLabel';
import { FeaturedJobCard } from './FeaturedJobCard';
import { getFeaturedJobs } from '@/lib/api/landing';

const counties = ['all', 'fresno', 'tulare', 'kern', 'madera', 'kings'] as const;

export async function FeaturedJobs() {
    const [t, locale, jobs] = await Promise.all([
        getTranslations('landing.featured_jobs'),
        getLocale(),
        getFeaturedJobs(),
    ]);

    if (jobs.length === 0) return null;

    return (
        <section className="bg-base-300 w-full">
            <div className="mx-auto flex flex-col gap-16 px-5 py-24 md:px-8 md:py-28 lg:px-20 lg:py-30">
                <div className="flex flex-col items-start gap-10 lg:flex-row lg:items-end lg:gap-16">
                    <div className="flex flex-1 flex-col gap-4">
                        <EyebrowLabel tone="soil" withRule>
                            {t('eyebrow')}
                        </EyebrowLabel>
                        <h2 className="text-base-content font-serif text-4xl font-medium leading-tight tracking-tight md:text-5xl lg:text-6xl">
                            {t('headline')}
                        </h2>
                    </div>
                    <a href={`/${locale}/jobs`} className="btn btn-link text-primary hover:text-base-content pb-4 whitespace-nowrap">
                        <span>{t('view_all')}</span>
                        <FontAwesomeIcon icon={faArrowRight} className="text-sm" />
                    </a>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    <div className="join flex-wrap" role="group" aria-label={t('filter.label')}>
                        {counties.map((c, i) => (
                            <button
                                key={c}
                                type="button"
                                aria-pressed={i === 0}
                                className={`btn join-item ${i === 0 ? 'btn-primary' : 'btn-outline btn-secondary'}`}
                            >
                                {t(`filter.${c}`)}
                            </button>
                        ))}
                    </div>
                    <span className="text-secondary ml-auto font-sans text-sm">{t('sort')}</span>
                </div>

                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                    {jobs.map((job) => (
                        <FeaturedJobCard key={job.id} job={job} locale={locale as 'en' | 'es'} />
                    ))}
                </div>
            </div>
        </section>
    );
}
