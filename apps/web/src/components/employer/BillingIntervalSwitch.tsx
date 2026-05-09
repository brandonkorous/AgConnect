'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { PLAN_DISPLAY_PRICE, type PriceCohort } from '@agconn/schemas';
import { CheckoutButton } from './CheckoutButton';

type Props = {
  tier: 'pro' | 'enterprise';
  cohort: PriceCohort;
  disabled?: boolean;
};

export function PlanCheckoutControls({ tier, cohort, disabled }: Props) {
  const t = useTranslations('employer.billing');
  const [interval, setInterval] = useState<'monthly' | 'yearly'>('monthly');
  const price = PLAN_DISPLAY_PRICE[tier][cohort];
  const monthly = price.monthly;
  const yearly = price.yearly;

  const wrapperProps = { className: 'w-full' };

  return (
    <div>
      {monthly !== null && (
        <div className="mb-3">
          {interval === 'monthly' ? (
            <p className="text-base-content flex items-baseline gap-2">
              <span className="font-display text-3xl font-light tracking-tight">${monthly}</span>
              <span className="text-base-content/60 text-xs">{t('per_month')}</span>
            </p>
          ) : (
            <p className="text-base-content flex items-baseline gap-2">
              <span className="font-display text-3xl font-light tracking-tight">${yearly}</span>
              <span className="text-base-content/60 text-xs">{t('per_year')}</span>
              {yearly !== null && (
                <span className="text-base-content/55 ml-auto font-mono text-[11px]">
                  {t('or_monthly_split', { price: Math.round(yearly / 12) })}
                </span>
              )}
            </p>
          )}
        </div>
      )}
      <div
        role="group"
        aria-label={t('interval_toggle')}
        className="bg-base-200 mb-3 grid grid-cols-2 rounded-full p-0.5 text-[11px] font-semibold"
      >
        <button
          type="button"
          onClick={() => setInterval('monthly')}
          disabled={disabled}
          aria-pressed={interval === 'monthly'}
          className={[
            'rounded-full py-1 transition',
            interval === 'monthly'
              ? 'bg-primary text-primary-content shadow-sm'
              : 'text-base-content/60',
            disabled ? 'cursor-not-allowed opacity-50' : '',
          ].join(' ')}
        >
          {t('monthly')}
        </button>
        <button
          type="button"
          onClick={() => setInterval('yearly')}
          disabled={disabled}
          aria-pressed={interval === 'yearly'}
          className={[
            'rounded-full py-1 transition',
            interval === 'yearly'
              ? 'bg-primary text-primary-content shadow-sm'
              : 'text-base-content/60',
            disabled ? 'cursor-not-allowed opacity-50' : '',
          ].join(' ')}
        >
          {t('yearly')}
        </button>
      </div>
      <div {...wrapperProps}>
        <CheckoutButton
          mode="checkout"
          tier={tier}
          interval={interval}
          label={tier === 'pro' ? t('upgrade_pro') : t('upgrade_enterprise')}
          disabled={disabled}
        />
      </div>
    </div>
  );
}
