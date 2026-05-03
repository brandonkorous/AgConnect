'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { CheckoutButton } from './CheckoutButton';

type Props = {
  tier: 'pro' | 'enterprise';
  disabled?: boolean;
};

export function PlanCheckoutControls({ tier, disabled }: Props) {
  const t = useTranslations('employer.billing');
  const [interval, setInterval] = useState<'monthly' | 'yearly'>('monthly');

  return (
    <div>
      <div className="bg-base-200 mb-3 grid grid-cols-2 rounded-full p-0.5 text-[11px] font-semibold">
        <button
          type="button"
          onClick={() => setInterval('monthly')}
          disabled={disabled}
          className={[
            'rounded-full py-1 transition',
            interval === 'monthly'
              ? 'bg-base-100 text-base-content shadow-sm'
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
          className={[
            'rounded-full py-1 transition',
            interval === 'yearly'
              ? 'bg-base-100 text-base-content shadow-sm'
              : 'text-base-content/60',
            disabled ? 'cursor-not-allowed opacity-50' : '',
          ].join(' ')}
        >
          {t('yearly')}
        </button>
      </div>
      <CheckoutButton
        mode="checkout"
        tier={tier}
        interval={interval}
        label={tier === 'pro' ? t('upgrade_pro') : t('upgrade_enterprise')}
        disabled={disabled}
      />
    </div>
  );
}
