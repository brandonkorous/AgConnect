'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Route } from 'next';
import { useTranslations } from 'next-intl';
import {
  useEnrollInProgramMutation,
  useUnenrollFromProgramMutation,
} from '@/lib/api/hooks/mutations/training';

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
  const enrollMut = useEnrollInProgramMutation();
  const unenrollMut = useUnenrollFromProgramMutation();
  const pending = enrollMut.isPending || unenrollMut.isPending;

  async function enroll() {
    setError(null);
    const res = await enrollMut.mutateAsync(programId);
    if (res.ok) return;
    if (res.code === 'conflict') {
      setError(tErr('already_enrolled'));
    } else if (res.code === 'unauthenticated') {
      router.push(`/${locale}/sign-in` as Route);
    } else {
      setError(t('enroll_error'));
    }
  }

  async function unenroll() {
    setError(null);
    const res = await unenrollMut.mutateAsync(programId);
    if (!res.ok) setError(tErr('cannot_unenroll'));
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
