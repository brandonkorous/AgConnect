'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { useOnboardingDraft } from '@/lib/useOnboardingDraft';
import { usePatchOnboardingMutation } from '@/lib/api/hooks/mutations/onboarding';
import { onboardingPath } from '@/lib/onboarding-steps';
import { useOnboardingShell } from '@/lib/use-onboarding-shell';

const COUNTIES = ['Fresno', 'Kern', 'Kings', 'Madera', 'Tulare'] as const;

type Props = { locale: string; initialCounty?: string | null };

export function CountyPicker({ locale, initialCounty = null }: Props) {
  const t = useTranslations('worker.onboarding');
  const router = useRouter();
  const shell = useOnboardingShell();
  const { value, setValue, clear } = useOnboardingDraft<{ county: string | null }>(
    'county',
    { county: initialCounty },
  );
  const patchMut = usePatchOnboardingMutation();
  const submitting = patchMut.isPending;
  const [error, setError] = useState<string | null>(null);

  async function next() {
    const county = value.county;
    if (!county) return;
    setError(null);
    const res = await patchMut.mutateAsync({ county });
    if (!res.ok) {
      setError(t('error.generic'));
      return;
    }
    await clear();
    router.push(onboardingPath(locale, 'skills', shell));
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
        href={onboardingPath(locale, 'waitlist', shell)}
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
