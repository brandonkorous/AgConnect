import { useTranslations } from 'next-intl';
import { EyebrowLabel } from '@/components/primitives/EyebrowLabel';

const steps = ['1', '2', '3', '4'] as const;

export function HowItWorks() {
  const t = useTranslations('landing.how');

  return (
    <section id="how" className="bg-sage w-full">
      <div className="mx-auto max-w-[1280px] px-5 py-20 md:px-8 md:py-24 lg:px-20 lg:py-28">
        <div className="flex flex-col gap-5 pb-14">
          <EyebrowLabel tone="soil" withRule>
            {t('eyebrow')}
          </EyebrowLabel>
          <h2 className="text-ink max-w-[680px] font-serif text-[40px] font-medium leading-[1.05] tracking-tight md:text-[56px]">
            {t('headline.line1')}
            <br className="hidden md:inline" />{' '}
            <span className="italic">{t('headline.line2')}</span>
          </h2>
        </div>

        <ol className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((id) => (
            <li key={id} className="border-soil/20 flex flex-col gap-4 border-t pt-6">
              <span className="text-soil font-mono text-sm tracking-[0.04em]">
                {t(`step.${id}.label`)}
              </span>
              <span className="text-moss font-serif text-[64px] leading-none italic">
                {String(id).padStart(2, '0')}
              </span>
              <h3 className="text-ink font-serif text-2xl font-medium leading-tight tracking-tight">
                {t(`step.${id}.title`)}
              </h3>
              <p className="text-ink/80 font-sans text-base leading-relaxed">
                {t(`step.${id}.body`)}
              </p>
              <p className="text-soil mt-auto pt-4 font-serif text-sm italic">
                {t(`step.${id}.outcome`)}
              </p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
