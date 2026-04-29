import { useTranslations } from 'next-intl';
import { EyebrowLabel } from '@/components/primitives/EyebrowLabel';

const steps = [
  { id: '1', icon: PhoneIcon, surface: 'bone' as const },
  { id: '2', icon: ResumeIcon, surface: 'bone' as const },
  { id: '3', icon: ClockIcon, surface: 'bone' as const },
  { id: '4', icon: CheckBigIcon, surface: 'moss' as const },
];

export function HowItWorks() {
  const t = useTranslations('landing.how');

  return (
    <section id="how" className="bg-bone-warm w-full">
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
          <div className="flex flex-col items-start gap-1.5 lg:items-end lg:pb-2">
            <p className="text-honey font-serif text-[40px] leading-tight italic tracking-[-0.025em] md:text-5xl lg:text-[54px]">
              {t('aside.headline')}
            </p>
            <p className="text-soil font-sans text-sm font-medium">{t('aside.body')}</p>
          </div>
        </div>

        <ol className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map(({ id, icon: Icon, surface }) => {
            const isMoss = surface === 'moss';
            const cardClass = isMoss
              ? 'bg-moss border-moss'
              : 'bg-bone border-hairline';
            const titleClass = isMoss ? 'text-bone' : 'text-ink';
            const bodyClass = isMoss ? 'text-sage' : 'text-text-deep';
            const detailClass = isMoss ? 'text-honey border-soil' : 'text-soil border-hairline';
            const iconStroke = isMoss ? '#C8A24A' : '#2D4030';

            return (
              <li key={id} className={`flex flex-col gap-6 border p-8 ${cardClass}`}>
                <div className="flex items-center justify-between">
                  <span className="text-honey font-serif text-[64px] leading-none italic tracking-[-0.04em]">
                    {String(id).padStart(2, '0')}
                  </span>
                  <Icon stroke={iconStroke} />
                </div>
                <h3 className={`font-serif text-2xl font-semibold tracking-[-0.02em] ${titleClass}`}>
                  {t(`step.${id}.title`)}
                </h3>
                <p className={`font-sans text-[15px] leading-relaxed ${bodyClass}`}>
                  {t(`step.${id}.body`)}
                </p>
                <p
                  className={`mt-auto border-t border-dashed pt-3 font-mono text-[11px] ${detailClass}`}
                >
                  {t(`step.${id}.tech`)}
                </p>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}

function PhoneIcon({ stroke }: { stroke: string }) {
  return (
    <svg width="40" height="40" viewBox="0 0 40 40" aria-hidden>
      <rect x="13" y="6" width="14" height="22" rx="3" stroke={stroke} strokeWidth="2" fill="none" />
      <circle cx="20" cy="24" r="1" fill={stroke} />
      <path d="M16 11 H24" stroke={stroke} />
    </svg>
  );
}

function ResumeIcon({ stroke }: { stroke: string }) {
  return (
    <svg width="40" height="40" viewBox="0 0 40 40" aria-hidden>
      <rect x="8" y="8" width="24" height="28" stroke={stroke} strokeWidth="2" fill="none" />
      <path d="M14 16 H26 M14 22 H26 M14 28 H22" stroke={stroke} strokeWidth="1.5" />
      <circle cx="32" cy="6" r="4" fill="#C8A24A" stroke={stroke} strokeWidth="1.5" />
      <path d="M30.5 6 L31.5 7 L33.5 5" stroke={stroke} />
    </svg>
  );
}

function ClockIcon({ stroke }: { stroke: string }) {
  return (
    <svg width="40" height="40" viewBox="0 0 40 40" aria-hidden>
      <circle cx="20" cy="20" r="14" stroke={stroke} strokeWidth="2" fill="none" />
      <path d="M20 14 V20 L25 23" stroke={stroke} strokeWidth="2" fill="none" strokeLinecap="round" />
    </svg>
  );
}

function CheckBigIcon({ stroke }: { stroke: string }) {
  return (
    <svg width="40" height="40" viewBox="0 0 40 40" aria-hidden>
      <circle cx="20" cy="20" r="16" stroke={stroke} strokeWidth="2" fill="none" />
      <path d="M12 20 L18 26 L29 14" stroke={stroke} strokeWidth="2.5" fill="none" />
    </svg>
  );
}
