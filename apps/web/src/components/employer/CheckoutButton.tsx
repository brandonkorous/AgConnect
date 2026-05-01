'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';

type Props =
  | { mode: 'checkout'; tier: 'pro' | 'enterprise'; label: string }
  | { mode: 'portal'; label: string };

export function CheckoutButton(props: Props) {
  const t = useTranslations('employer.billing');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function go() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(
        props.mode === 'checkout'
          ? '/api/v1/employer/billing/checkout'
          : '/api/v1/employer/billing/portal',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body:
            props.mode === 'checkout'
              ? JSON.stringify({ tier: props.tier, interval: 'monthly' })
              : '{}',
        },
      );
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        if (res.status === 503) setError(t('stripe_unavailable'));
        else setError(data?.error?.message ?? 'Could not continue.');
        return;
      }
      const data = await res.json();
      const url: string | undefined = data?.data?.url;
      if (url) window.location.href = url;
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={go}
        disabled={busy}
        className="btn btn-primary btn-sm mt-4 w-full"
      >
        {busy ? '…' : props.label}
      </button>
      {error && <p className="text-error mt-2 text-xs">{error}</p>}
    </div>
  );
}
