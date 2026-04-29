import { useTranslations } from 'next-intl';
import { ArrowRight } from '@/components/primitives/ArrowRight';
import { EyebrowLabel } from '@/components/primitives/EyebrowLabel';
import { FeaturedJobCard } from './FeaturedJobCard';

const counties = ['all', 'fresno', 'tulare', 'kern', 'madera', 'kings'] as const;
const jobIds = ['1', '2', '3', '4'] as const;

export function FeaturedJobs() {
  const t = useTranslations('landing.featured_jobs');

  return (
    <section className="bg-bone w-full">
      <div className="mx-auto flex max-w-[1280px] flex-col gap-16 px-5 py-24 md:px-8 md:py-28 lg:px-20 lg:py-30">
        <div className="flex flex-col items-start justify-between gap-10 lg:flex-row lg:items-end lg:gap-16">
          <div className="flex max-w-[680px] flex-col gap-4">
            <EyebrowLabel tone="soil" withRule>
              {t('eyebrow')}
            </EyebrowLabel>
            <h2 className="text-ink font-serif text-[40px] font-medium leading-[1.05] tracking-[-0.03em] md:text-[52px] lg:text-[64px]">
              {t('headline')}
            </h2>
          </div>
          <a
            href="/jobs"
            className="text-moss hover:text-ink inline-flex items-center gap-2 pb-4 font-sans text-[15px] font-semibold whitespace-nowrap"
          >
            <span>{t('view_all')}</span>
            <ArrowRight size={14} stroke="#2D4030" />
          </a>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {counties.map((c, i) => (
            <button
              key={c}
              type="button"
              className={`px-4 py-2.5 font-sans text-[13px] transition-colors ${
                i === 0
                  ? 'bg-moss text-bone font-semibold'
                  : 'border-soil text-soil hover:bg-sage border font-medium'
              }`}
            >
              {t(`filter.${c}`)}
            </button>
          ))}
          <span className="text-soil ml-auto font-sans text-[13px]">{t('sort')}</span>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {jobIds.map((id) => (
            <FeaturedJobCard key={id} id={id} />
          ))}
        </div>
      </div>
    </section>
  );
}
