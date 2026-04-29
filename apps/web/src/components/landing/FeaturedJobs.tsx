import { useTranslations } from 'next-intl';
import { ArrowRight } from '@/components/primitives/ArrowRight';
import { EyebrowLabel } from '@/components/primitives/EyebrowLabel';
import { featuredJobs } from '@/data/jobs';
import { FeaturedJobCard } from './FeaturedJobCard';

const counties = ['All', 'Fresno', 'Kern', 'Kings', 'Madera', 'Tulare'] as const;

export function FeaturedJobs() {
  const t = useTranslations('landing.featured_jobs');

  return (
    <section className="bg-bone w-full">
      <div className="mx-auto max-w-[1280px] px-5 py-20 md:px-8 md:py-24 lg:px-20 lg:py-28">
        <div className="flex flex-col gap-5 pb-10 md:flex-row md:items-end md:justify-between md:gap-10">
          <div className="flex flex-col gap-5">
            <EyebrowLabel tone="soil">{t('eyebrow')}</EyebrowLabel>
            <h2 className="text-ink max-w-[680px] font-serif text-[40px] font-medium leading-[1.05] tracking-tight md:text-[52px]">
              {t('headline')}
            </h2>
          </div>
          <a
            href="/jobs"
            className="text-moss hover:text-ink inline-flex items-center gap-1.5 font-sans text-sm font-semibold whitespace-nowrap"
          >
            <span>{t('view_all')}</span>
            <ArrowRight size={12} stroke="#2D4030" />
          </a>
        </div>

        <div className="border-soil/15 flex flex-wrap items-center justify-between gap-4 border-y py-4">
          <ul className="flex flex-wrap gap-2">
            {counties.map((c, i) => (
              <li key={c}>
                <button
                  type="button"
                  className={`px-3 py-1.5 font-sans text-[13px] font-medium transition-colors ${
                    i === 0 ? 'bg-moss text-bone' : 'border-soil/30 text-soil hover:bg-sage border'
                  }`}
                >
                  {i === 0 ? t('filter.all') : c}
                </button>
              </li>
            ))}
          </ul>
          <div className="flex items-center gap-2">
            <span className="text-soil font-sans text-[12px]">{t('sort.label')}</span>
            <span className="text-ink border-soil/30 border bg-bone px-3 py-1.5 font-sans text-[13px] font-medium">
              {t('sort.wage_desc')}
            </span>
          </div>
        </div>

        <ul className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {featuredJobs.map((job) => (
            <li key={job.id}>
              <FeaturedJobCard job={job} />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
