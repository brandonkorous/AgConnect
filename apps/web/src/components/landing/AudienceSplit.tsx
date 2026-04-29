import { useTranslations } from 'next-intl';
import { EyebrowLabel } from '@/components/primitives/EyebrowLabel';
import { AudienceCard } from './AudienceCard';

export function AudienceSplit() {
  const t = useTranslations('landing.audience');

  return (
    <section id="workers" className="bg-bone w-full">
      <div className="mx-auto max-w-[1280px] px-5 py-20 md:px-8 md:py-24 lg:px-20 lg:py-28">
        <div className="flex flex-col items-start justify-between gap-10 pb-16 lg:flex-row lg:items-end lg:gap-16">
          <div className="flex max-w-[680px] flex-col gap-5">
            <EyebrowLabel tone="soil" withRule>
              {t('eyebrow')}
            </EyebrowLabel>
            <h2 className="text-ink font-serif text-[40px] font-medium leading-[1.05] tracking-tight md:text-[56px] lg:text-[64px]">
              {t('headline.line1')}
              <br />
              {t('headline.line2')}
            </h2>
          </div>
          <p className="text-ink/85 max-w-[420px] font-sans text-[17px] leading-relaxed pb-2">
            {t('intro')}
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <AudienceCard
            surface="moss"
            eyebrow={t('workers.eyebrow')}
            subscript={t('workers.subscript')}
            headlineLine1={t('workers.headline.line1')}
            headlineLine2={t('workers.headline.line2')}
            bullets={[
              t('workers.bullet1'),
              t('workers.bullet2'),
              t('workers.bullet3'),
              t('workers.bullet4'),
            ]}
            ctaText={t('workers.cta')}
            ctaHref="#final-cta"
          />
          <AudienceCard
            surface="bone"
            eyebrow={t('employers.eyebrow')}
            subscript={t('employers.subscript')}
            headlineLine1={t('employers.headline.line1')}
            headlineLine2={t('employers.headline.line2')}
            bullets={[
              t('employers.bullet1'),
              t('employers.bullet2'),
              t('employers.bullet3'),
              t('employers.bullet4'),
            ]}
            ctaText={t('employers.cta')}
            ctaHref="#employers"
          />
          <AudienceCard
            surface="sage"
            eyebrow={t('training.eyebrow')}
            subscript={t('training.subscript')}
            headlineLine1={t('training.headline.line1')}
            headlineLine2={t('training.headline.line2')}
            bullets={[
              t('training.bullet1'),
              t('training.bullet2'),
              t('training.bullet3'),
              t('training.bullet4'),
            ]}
            ctaText={t('training.cta')}
            ctaHref="#training-orgs"
          />
        </div>
      </div>
    </section>
  );
}
