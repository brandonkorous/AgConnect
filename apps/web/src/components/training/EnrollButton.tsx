'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import {
  enrollInProgramAction,
  unenrollFromProgramAction,
} from '@/lib/api/training-actions';

type Props = {
  programId: string;
  spotsLeft: number;
  alreadyEnrolled: boolean;
  locale: string;
};

export function EnrollButton({ programId, spotsLeft, alreadyEnrolled, locale }: Props) {
  const t = useTranslations('worker.training_hub.detail');
  const tErr = useTranslations('worker.training_hub.error');
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function enroll() {
    setError(null);
    startTransition(async () => {
      const res = await enrollInProgramAction(programId);
      if (res.ok) {
        router.refresh();
      } else if (res.code === 'conflict') {
        setError(tErr('already_enrolled'));
      } else if (res.code === 'unauthenticated') {
        router.push(`/${locale}/sign-in`);
      } else {
        setError(t('enroll_error'));
      }
    });
  }

  function unenroll() {
    setError(null);
    startTransition(async () => {
      const res = await unenrollFromProgramAction(programId);
      if (res.ok) router.refresh();
      else setError(tErr('cannot_unenroll'));
    });
  }

  if (alreadyEnrolled) {
    return (
      <div className="grid gap-2">
        <button
          type="button"
          disabled
          className="btn btn-success w-full"
        >
          {t('enrolled')}
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={unenroll}
          className="text-base-content/60 hover:text-error text-center text-[12px] font-semibold"
        >
          {t('unenroll')}
        </button>
      </div>
    );
  }

  if (spotsLeft === 0) {
    return (
      <button type="button" disabled className="btn btn-disabled w-full">
        {t('full')}
      </button>
    );
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
        onClick={enroll}
        disabled={pending}
        className="btn btn-primary w-full"
      >
        {pending ? t('enrolling') : t('enroll')}
      </button>
    </>
  );
}
