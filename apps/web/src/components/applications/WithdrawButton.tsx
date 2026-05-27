'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useWithdrawApplicationMutation } from '@/lib/api/hooks/mutations/applications';

type Props = { applicationId: string; locale: string };

export function WithdrawButton({ applicationId, locale }: Props) {
  const t = useTranslations('worker.application.detail');
  const tErr = useTranslations('worker.application.error');
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const withdrawMut = useWithdrawApplicationMutation();
  const pending = withdrawMut.isPending;

  async function withdraw() {
    setError(null);
    const res = await withdrawMut.mutateAsync(applicationId);
    if (res.ok) {
      router.push(`/${locale}/worker/applications`);
    } else if (res.code === 'validation_failed') {
      setError(tErr('cannot_withdraw'));
    } else {
      setError(t('withdraw'));
    }
    setConfirming(false);
  }

  if (!confirming) {
    return (
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className="border-base-300 hover:border-error hover:text-error rounded-2xl border bg-white p-4 text-[13px] font-semibold"
      >
        {t('withdraw')}
      </button>
    );
  }

  return (
    <div className="border-error bg-error/5 grid gap-3 rounded-2xl border p-4">
      {error && <div className="text-error text-[12px]">{error}</div>}
      <p className="text-base-content/80 text-[13px]">
        {locale === 'es'
          ? '¿Seguro que quieres retirar esta postulación?'
          : 'Withdraw this application?'}
      </p>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setConfirming(false)}
          className="btn btn-sm btn-ghost flex-1"
          disabled={pending}
        >
          {locale === 'es' ? 'Cancelar' : 'Cancel'}
        </button>
        <button
          type="button"
          onClick={withdraw}
          className="btn btn-sm btn-error flex-1"
          disabled={pending}
        >
          {pending ? (locale === 'es' ? 'Retirando…' : 'Withdrawing…') : t('withdraw')}
        </button>
      </div>
    </div>
  );
}
