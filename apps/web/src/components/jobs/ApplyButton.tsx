'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import type { Route } from 'next';
import { useTranslations } from 'next-intl';
import { applyToJobAction } from '@/lib/api/applications-actions';

type Props = {
  locale: string;
  jobId: string;
  alreadyAppliedStatus?: string | null;
};

export function ApplyButton({ locale, jobId, alreadyAppliedStatus }: Props) {
  const t = useTranslations('worker.application.apply');
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  if (alreadyAppliedStatus && alreadyAppliedStatus !== 'withdrawn') {
    return (
      <div className="grid gap-2">
        <button type="button" disabled className="btn btn-success btn-lg w-full">
          {t(`already_${alreadyAppliedStatus}`, { defaultValue: t('already_applied') })}
        </button>
        <button
          type="button"
          onClick={() => router.push(`/${locale}/worker/applications`)}
          className="text-primary text-[12px] font-semibold"
        >
          {t('view_application')}
        </button>
      </div>
    );
  }

  function apply() {
    setError(null);
    startTransition(async () => {
      const res = await applyToJobAction(jobId);
      if (res.ok) {
        router.push(`/${locale}/worker/applications`);
      } else if (res.code === 'conflict') {
        setError(t('error_already_applied'));
      } else if (res.code === 'unauthenticated') {
        router.push(`/${locale}/sign-in` as Route);
      } else {
        setError(t('error'));
      }
    });
  }

  return (
    <>
      {error && (
        <div role="alert" className="alert alert-warning">
          <span>{error}</span>
        </div>
      )}
      <button
        type="button"
        onClick={apply}
        disabled={pending}
        className="btn btn-primary btn-lg w-full"
      >
        {pending ? t('submitting') : t('cta')}
      </button>
    </>
  );
}
