import { useTranslations } from 'next-intl';
import { EyebrowLabel } from '@/components/primitives/EyebrowLabel';
import { FaqAccordion } from './FaqAccordion';

export function Faq() {
  const t = useTranslations('landing.faq');
  const grantT = useTranslations('landing.faq.grant_card');

  return (
    <section id="faq" className="bg-bone w-full">
      <div className="mx-auto grid max-w-[1280px] grid-cols-1 gap-16 px-5 py-24 md:px-8 md:py-28 lg:grid-cols-[minmax(0,0.55fr)_minmax(0,1fr)] lg:gap-20 lg:px-20 lg:py-30">
        <div className="flex flex-col gap-6 lg:sticky lg:top-8 lg:self-start">
          <EyebrowLabel tone="soil" withRule>
            {t('eyebrow')}
          </EyebrowLabel>
          <h2 className="text-ink font-serif text-[40px] font-medium leading-[1.05] tracking-[-0.03em] md:text-[52px] lg:text-6xl">
            {t('headline')}
          </h2>
          <p className="text-text-deep max-w-[380px] font-sans text-[17px] leading-relaxed">
            {t('intro')}
          </p>
          <div className="bg-sage mt-4 flex flex-col gap-2 p-5">
            <p className="text-soil label">{grantT('eyebrow')}</p>
            <p className="text-ink font-serif text-lg font-medium leading-tight">
              {grantT('headline')}
            </p>
            <p className="text-text-deep font-sans text-[13px]">{grantT('body')}</p>
          </div>
        </div>

        <FaqAccordion />
      </div>
    </section>
  );
}
