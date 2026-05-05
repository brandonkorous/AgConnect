'use client';

import { useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { isOk } from '@agconn/api-client';
import { getApiClient } from '@/lib/api/client';

type Props =
  | {
      mode: 'checkout';
      tier: 'pro' | 'enterprise';
      interval?: 'monthly' | 'yearly';
      label: string;
      disabled?: boolean;
    }
  | { mode: 'portal'; label: string; disabled?: boolean };

export function CheckoutButton(props: Props) {
  const t = useTranslations('employer.billing');
  const locale = useLocale();
  const lang = locale === 'es' ? 'es' : 'en';
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function go() {
    setBusy(true);
    setError(null);
    try {
      const client = getApiClient(lang);
      const path =
        props.mode === 'checkout'
          ? '/v1/employer/billing/checkout'
          : '/v1/employer/billing/portal';
      const body =
        props.mode === 'checkout'
          ? { tier: props.tier, interval: props.interval ?? 'monthly', locale: lang }
          : { locale: lang };
      const res = await client.post<{ url: string }>(path, body, { handleErrorInline: true });
      if (!isOk(res)) {
        if (res.error.code === 'stripe_unavailable') setError(t('stripe_unavailable'));
        else setError(res.error.message || 'Could not continue.');
        return;
      }
      if (res.data.url) window.location.href = res.data.url;
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={go}
        disabled={busy || props.disabled}
        aria-disabled={busy || props.disabled}
        className={[
          'btn btn-primary btn-sm mt-4 w-full',
          props.disabled ? 'btn-disabled cursor-not-allowed opacity-60' : '',
        ].join(' ')}
      >
        {busy ? '…' : props.label}
      </button>
      {error && <p className="text-error mt-2 text-xs">{error}</p>}
    </div>
  );
}
