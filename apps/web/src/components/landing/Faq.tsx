import { useTranslations } from 'next-intl';
import { ArrowRight } from '@/components/primitives/ArrowRight';
import { EyebrowLabel } from '@/components/primitives/EyebrowLabel';
import { FaqAccordion } from './FaqAccordion';

export function Faq() {
  const t = useTranslations('landing.faq');

  return (
    <section id="faq" className="bg-bone w-full">
      <div className="mx-auto grid max-w-[1280px] grid-cols-1 gap-12 px-5 py-20 md:px-8 md:py-24 lg:grid-cols-[minmax(0,0.55fr)_minmax(0,1fr)] lg:gap-16 lg:px-20 lg:py-28">
        <div className="flex flex-col gap-6">
          <EyebrowLabel tone="soil">{t('eyebrow')}</EyebrowLabel>
          <h2 className="text-ink font-serif text-[40px] font-medium leading-[1.05] tracking-tight md:text-[48px]">
            {t('headline')}
          </h2>
          <p className="text-ink/85 max-w-[420px] font-sans text-base leading-relaxed">
            {t('intro')}
          </p>
          <a
            href="mailto:hello@agconn.com"
            className="text-moss hover:text-ink mt-2 inline-flex items-center gap-1.5 font-sans text-sm font-semibold w-fit"
          >
            <span>{t('contact_cta')}</span>
            <ArrowRight size={12} stroke="#2D4030" />
          </a>
        </div>

        <FaqAccordion />
      </div>
    </section>
  );
}
