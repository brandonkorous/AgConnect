import { useTranslations } from 'next-intl';
import { EyebrowLabel } from '@/components/primitives/EyebrowLabel';
import { FeaturedProgramCard } from './FeaturedProgramCard';

const programIds = ['1', '2', '3', '4'] as const;

export function FeaturedTraining() {
  const t = useTranslations('landing.featured_training');

  return (
    <section className="bg-bone-warm w-full">
      <div className="mx-auto flex max-w-[1280px] flex-col gap-16 px-5 py-24 md:px-8 md:py-28 lg:px-20 lg:py-30">
        <div className="flex flex-col items-start justify-between gap-10 lg:flex-row lg:items-end lg:gap-16">
          <div className="flex max-w-[680px] flex-col gap-4">
            <EyebrowLabel tone="soil" withRule>
              {t('eyebrow')}
            </EyebrowLabel>
            <h2 className="text-ink font-serif text-[40px] font-medium leading-[1.05] tracking-[-0.03em] md:text-[52px] lg:text-[64px]">
              {t('headline.line1')}
              <br />
              {t('headline.line2')}
            </h2>
          </div>
          <p className="text-text-deep max-w-[420px] font-sans text-[17px] leading-relaxed lg:pb-2">
            {t('body')}
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {programIds.map((id) => (
            <FeaturedProgramCard key={id} id={id} />
          ))}
        </div>
      </div>
    </section>
  );
}
