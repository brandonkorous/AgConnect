import { useTranslations } from 'next-intl';
import { EyebrowLabel } from '@/components/primitives/EyebrowLabel';
import { TestimonialCard } from './TestimonialCard';

const ids = ['1', '2', '3'] as const;

export function Testimonials() {
  const t = useTranslations('landing.testimonials');

  return (
    <section className="bg-bone w-full">
      <div className="mx-auto flex max-w-[1280px] flex-col gap-16 px-5 py-24 md:px-8 md:py-28 lg:px-20 lg:py-30">
        <div className="flex max-w-[920px] flex-col gap-4">
          <EyebrowLabel tone="soil" withRule>
            {t('eyebrow')}
          </EyebrowLabel>
          <h2 className="text-ink font-serif text-[40px] font-medium leading-[1.05] tracking-[-0.03em] md:text-[52px] lg:text-[64px]">
            {t('headline.line1')}
            <br />
            {t('headline.line2')}
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {ids.map((id) => (
            <TestimonialCard key={id} id={id} />
          ))}
        </div>
      </div>
    </section>
  );
}
