import { useTranslations } from 'next-intl';

export type Plan = 'free' | 'pro' | 'enterprise';
export type Cycle = 'monthly' | 'yearly';

type Props = {
  plan: Plan;
  cycle: Cycle;
};

const features = ['feature1', 'feature2', 'feature3', 'feature4', 'feature5', 'feature6'] as const;

export function PlanCard({ plan, cycle }: Props) {
  const t = useTranslations(`landing.pricing.plan.${plan}`);
  const isPro = plan === 'pro';
  const isEnterprise = plan === 'enterprise';

  const containerClass = isPro
    ? 'bg-moss relative shadow-[0_24px_60px_rgba(45,64,48,0.3)]'
    : isEnterprise
      ? 'bg-ink'
      : 'bg-bone border-hairline border';

  const eyebrowTone = isPro || isEnterprise ? 'text-honey' : 'text-soil';
  const nameTone = isPro || isEnterprise ? 'text-bone italic' : 'text-ink';
  const priceTone = isPro || isEnterprise ? 'text-bone' : 'text-ink';
  const subPriceTone = isPro || isEnterprise ? 'text-sage' : 'text-soil';
  const annualNoteTone = 'text-honey';
  const dividerTone = isPro || isEnterprise ? 'border-soil' : 'border-hairline';
  const featureTextTone = isPro || isEnterprise ? 'text-bone' : 'text-ink';
  const checkColor = isPro || isEnterprise ? '#C8A24A' : '#2D4030';
  const ctaClass = isPro
    ? 'bg-honey text-ink hover:bg-bone'
    : isEnterprise
      ? 'border-honey text-honey hover:bg-honey hover:text-ink border-[1.5px]'
      : 'border-moss text-moss hover:bg-moss hover:text-bone border-[1.5px]';

  return (
    <article className={`flex h-full flex-col gap-6 p-10 ${containerClass}`}>
      {isPro && (
        <div className="bg-honey text-ink absolute -top-3 left-10 px-3 py-1 font-sans text-[11px] font-bold tracking-[0.08em] uppercase">
          {t('ribbon')}
        </div>
      )}

      <div className="flex flex-col gap-2">
        <p className={`label ${eyebrowTone}`}>{t('badge')}</p>
        <p className={`font-serif text-[28px] font-medium ${nameTone}`}>{t('name')}</p>
        <div className="flex items-baseline gap-1.5">
          <span className={`font-serif text-7xl font-light leading-tight tracking-[-0.04em] ${priceTone}`}>
            {t(`price.${cycle}.amount`)}
          </span>
          <span className={`font-sans text-sm ${subPriceTone}`}>{t(`price.${cycle}.unit`)}</span>
        </div>
        {plan !== 'free' && (
          <p className={`mt-0.5 font-sans text-[13px] ${annualNoteTone}`}>
            {t(`price.${cycle}.note`)}
          </p>
        )}
        <p className={`mt-2 font-sans text-sm leading-relaxed ${isPro || isEnterprise ? 'text-sage' : 'text-text-deep'}`}>
          {t('intro')}
        </p>
      </div>

      <ul className={`flex flex-col gap-3.5 border-t pt-4 ${dividerTone}`}>
        {features.map((f) => {
          const text = t.raw(f);
          if (!text) return null;
          const included = !String(text).startsWith('-');
          const cleanText = included ? String(text) : String(text).slice(1);
          return (
            <li
              key={f}
              className={`flex items-start gap-2.5 ${included ? '' : 'opacity-50'}`}
            >
              {included ? (
                <CheckIcon stroke={checkColor} />
              ) : (
                <XIcon stroke={checkColor} />
              )}
              <span className={`font-sans text-sm leading-relaxed ${featureTextTone}`}>
                {cleanText}
              </span>
            </li>
          );
        })}
      </ul>

      <a
        href={t('cta.href')}
        className={`mt-auto block py-3.5 text-center font-sans text-sm font-bold ${ctaClass}`}
      >
        {t('cta.label')}
      </a>
    </article>
  );
}

function CheckIcon({ stroke }: { stroke: string }) {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" style={{ marginTop: 2, flexShrink: 0 }} aria-hidden>
      <path d="M3 9 L7 13 L15 5" stroke={stroke} strokeWidth="1.5" fill="none" />
    </svg>
  );
}

function XIcon({ stroke }: { stroke: string }) {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" style={{ marginTop: 2, flexShrink: 0 }} aria-hidden>
      <path d="M5 5 L13 13 M13 5 L5 13" stroke={stroke} strokeWidth="1.5" fill="none" />
    </svg>
  );
}
