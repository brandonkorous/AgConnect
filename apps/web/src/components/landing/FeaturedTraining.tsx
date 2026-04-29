import { useTranslations } from 'next-intl';
import { ArrowRight } from '@/components/primitives/ArrowRight';
import { EyebrowLabel } from '@/components/primitives/EyebrowLabel';
import { featuredPrograms } from '@/data/programs';
import { FeaturedProgramCard } from './FeaturedProgramCard';

export function FeaturedTraining() {
  const t = useTranslations('landing.featured_training');

  return (
    <section className="bg-bone w-full">
      <div className="mx-auto max-w-[1280px] px-5 pb-20 md:px-8 md:pb-24 lg:px-20 lg:pb-28">
        <div className="flex flex-col gap-5 pb-10 md:flex-row md:items-end md:justify-between md:gap-10">
          <div className="flex flex-col gap-5">
            <EyebrowLabel tone="soil">{t('eyebrow')}</EyebrowLabel>
            <h2 className="text-ink max-w-[680px] font-serif text-[40px] font-medium leading-[1.05] tracking-tight md:text-[52px]">
              {t('headline')}
            </h2>
          </div>
          <a
            href="/training"
            className="text-moss hover:text-ink inline-flex items-center gap-1.5 font-sans text-sm font-semibold whitespace-nowrap"
          >
            <span>{t('view_all')}</span>
            <ArrowRight size={12} stroke="#2D4030" />
          </a>
        </div>

        <ul className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {featuredPrograms.map((program) => (
            <li key={program.id}>
              <FeaturedProgramCard program={program} />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
