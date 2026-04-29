import { useTranslations } from 'next-intl';
import { EyebrowLabel } from '@/components/primitives/EyebrowLabel';
import { testimonials } from '@/data/testimonials';
import { TestimonialCard } from './TestimonialCard';

export function Testimonials() {
  const t = useTranslations('landing.testimonials');

  return (
    <section className="bg-sage w-full">
      <div className="mx-auto max-w-[1280px] px-5 py-20 md:px-8 md:py-24 lg:px-20 lg:py-28">
        <div className="flex flex-col gap-5 pb-14">
          <EyebrowLabel tone="soil" withRule>
            {t('eyebrow')}
          </EyebrowLabel>
          <h2 className="text-ink max-w-[680px] font-serif text-[40px] font-medium leading-[1.05] tracking-tight md:text-[56px]">
            {t('headline.line1')}
            <br />
            <span className="italic">{t('headline.line2')}</span>
          </h2>
        </div>

        <ul className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {testimonials.map((testimonial) => (
            <li key={testimonial.id}>
              <TestimonialCard testimonial={testimonial} />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
