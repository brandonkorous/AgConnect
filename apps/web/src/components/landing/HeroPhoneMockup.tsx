import { useTranslations } from 'next-intl';
import { Wordmark } from '@/components/primitives/Wordmark';

export function HeroPhoneMockup() {
  const t = useTranslations('landing.hero.phone');
  const tToast = useTranslations('landing.hero.toast');

  return (
    <div className="relative w-full max-w-[360px]">
      <div
        className="bg-ink relative rounded-[40px] p-3 shadow-[0_30px_60px_rgba(45,64,48,0.18)]"
        style={{ rotate: '-2deg' }}
      >
        <div className="bg-bone flex flex-col overflow-hidden rounded-[28px]">
          <div className="flex items-center justify-between px-5 pt-5 pb-3">
            <Wordmark size="sm" tone="ink" />
            <div className="bg-sage text-soil px-2 py-1 font-sans text-[10px] font-medium tracking-[0.04em]">
              {t('lang_pill')}
            </div>
          </div>

          <div className="px-5 pb-4">
            <p className="font-serif text-[22px] leading-tight italic text-ink/85">
              {t('greeting')}
            </p>
            <p className="text-moss font-serif text-[26px] leading-[1.1] font-semibold tracking-tight">
              {t('jobs_near')}
            </p>
          </div>

          <div className="border-soil/15 mx-5 mb-5 border bg-white p-4">
            <div className="flex items-center justify-between">
              <div className="bg-moss flex items-center gap-1.5 px-2 py-1">
                <svg width="9" height="9" viewBox="0 0 14 14" aria-hidden>
                  <path
                    d="M7 1 L9 5 L13 5.5 L10 8.5 L11 13 L7 11 L3 13 L4 8.5 L1 5.5 L5 5 Z"
                    fill="#C8A24A"
                  />
                </svg>
                <span className="text-bone font-sans text-[10px] font-semibold tracking-[0.06em]">
                  {t('verified_flc')}
                </span>
              </div>
              <span className="text-soil font-mono text-[10px]">{t('distance')}</span>
            </div>

            <p className="text-ink mt-3 font-serif text-lg font-semibold leading-tight">
              {t('job_title')}
            </p>
            <p className="text-soil mt-1 font-sans text-[13px]">{t('employer')}</p>

            <div className="border-soil/15 mt-3 flex items-center justify-between border-t pt-3">
              <span className="text-moss font-serif text-base font-semibold">{t('wage')}</span>
              <span className="bg-moss text-bone px-3 py-2 font-sans text-xs font-semibold">
                {t('apply')}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div
        className="border-soil/15 absolute -bottom-3 -left-4 flex items-center gap-2 border bg-white px-3 py-2 shadow-[0_8px_16px_rgba(45,64,48,0.15)] md:-left-6"
        style={{ rotate: '2deg' }}
      >
        <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden>
          <path
            d="M2 8 L6 12 L14 4"
            stroke="#2D4030"
            strokeWidth="2"
            fill="none"
            strokeLinecap="square"
          />
        </svg>
        <span className="text-ink font-sans text-[13px] font-semibold">{tToast('hired')}</span>
      </div>
    </div>
  );
}
