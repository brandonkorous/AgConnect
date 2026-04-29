import { useTranslations } from 'next-intl';
import { EyebrowLabel } from '@/components/primitives/EyebrowLabel';
import { VerificationCard } from './VerificationCard';

const bullets = ['1', '2', '3'] as const;

export function VerificationSpotlight() {
  const t = useTranslations('landing.verification');

  return (
    <section className="bg-bone w-full">
      <div className="mx-auto grid max-w-[1280px] grid-cols-1 items-center gap-16 px-5 py-24 md:px-8 md:py-28 lg:grid-cols-2 lg:gap-20 lg:px-20 lg:py-30">
        <div className="flex justify-center lg:justify-start">
          <VerificationCard />
        </div>

        <div className="flex max-w-[520px] flex-col gap-8">
          <EyebrowLabel tone="soil" withRule>
            {t('eyebrow')}
          </EyebrowLabel>
          <h2 className="text-ink font-serif text-[40px] font-medium leading-[1.05] tracking-[-0.03em] md:text-[52px] lg:text-6xl">
            {t('headline.line1')}
            <br />
            {t('headline.line2')}
          </h2>
          <p className="text-text-deep font-sans text-lg leading-relaxed">{t('body')}</p>

          <ul className="flex flex-col gap-3.5 pt-2">
            {bullets.map((b) => (
              <li key={b} className="flex items-start gap-3.5">
                <span className="bg-moss flex size-8 shrink-0 items-center justify-center rounded-full">
                  <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden>
                    <path d="M3 8 L7 12 L13 4" stroke="#C8A24A" strokeWidth="2" fill="none" />
                  </svg>
                </span>
                <span className="text-ink font-sans text-base leading-snug">
                  {t(`bullet${b}`)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
