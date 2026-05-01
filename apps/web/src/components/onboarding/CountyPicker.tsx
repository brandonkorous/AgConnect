'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { useOnboardingDraft } from '@/lib/useOnboardingDraft';
import { patchOnboardingAction } from '@/lib/api/onboarding-actions';

const COUNTIES = ['Fresno', 'Kern', 'Kings', 'Madera', 'Tulare'] as const;

export function CountyPicker({ locale }: { locale: string }) {
  const t = useTranslations('worker.onboarding');
  const router = useRouter();
  const { value, setValue, clear } = useOnboardingDraft<{ county: string | null }>(
    'county',
    { county: null },
  );
  const [submitting, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function next() {
    if (!value.county) return;
    setError(null);
    startTransition(async () => {
      const res = await patchOnboardingAction({ county: value.county });
      if (!res.ok) {
        setError(t('error.generic'));
        return;
      }
      await clear();
      router.push(`/${locale}/onboarding/skills`);
    });
  }

  return (
    <div className="grid gap-4">
      <div className="grid grid-cols-2 gap-3">
        {COUNTIES.map((c) => (
          <button
            type="button"
            key={c}
            onClick={() => setValue({ county: c })}
            aria-pressed={value.county === c}
            className={[
              'btn btn-lg justify-center',
              value.county === c ? 'btn-primary' : 'btn-outline',
            ].join(' ')}
          >
            {t(`county.${c.toLowerCase()}` as 'county.fresno')}
          </button>
        ))}
      </div>
      <Link
        href={`/${locale}/onboarding/waitlist`}
        className="text-base-content/70 link link-hover text-sm"
      >
        {t('county.other')}
      </Link>
      {error && <div className="text-error text-[12px]">{error}</div>}
      <button
        type="button"
        onClick={next}
        disabled={!value.county || submitting}
        className="btn btn-primary btn-lg w-full"
      >
        {t('profile.continue')}
      </button>
    </div>
  );
}
