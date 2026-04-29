import { useTranslations } from 'next-intl';
import { EyebrowLabel } from '@/components/primitives/EyebrowLabel';
import { VerificationCard } from './VerificationCard';

const details = ['1', '2', '3'] as const;

export function VerificationSpotlight() {
  const t = useTranslations('landing.verification');

  return (
    <section className="bg-bone w-full">
      <div className="mx-auto grid max-w-[1280px] grid-cols-1 items-center gap-12 px-5 py-20 md:px-8 md:py-24 lg:grid-cols-2 lg:gap-16 lg:px-20 lg:py-28">
        <div className="flex items-center justify-center lg:justify-start">
          <VerificationCard />
        </div>

        <div className="flex flex-col gap-7">
          <EyebrowLabel tone="soil">{t('eyebrow')}</EyebrowLabel>
          <h2 className="text-ink font-serif text-[40px] font-medium leading-[1.05] tracking-tight md:text-[52px]">
            {t('headline.line1')}
            <br />
            <span className="italic">{t('headline.line2')}</span>
          </h2>
          <p className="text-ink/85 max-w-[520px] font-sans text-[17px] leading-relaxed">
            {t('body')}
          </p>

          <ul className="flex flex-col gap-3 pt-2">
            {details.map((d) => (
              <li
                key={d}
                className="border-soil/15 flex items-center justify-between border-t py-3"
              >
                <span className="label text-soil">{t(`detail.${d}.label`)}</span>
                <span className="text-ink font-sans text-sm font-medium">
                  {t(`detail.${d}.value`)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
