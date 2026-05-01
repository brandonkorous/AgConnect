'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import Link from 'next/link';

const COUNTIES = ['Fresno', 'Kern', 'Kings', 'Madera', 'Tulare'] as const;

export function CountyPicker({ locale }: { locale: string }) {
  const t = useTranslations('worker.onboarding');
  const router = useRouter();
  const [selected, setSelected] = useState<string | null>(null);

  function next() {
    if (!selected) return;
    if (typeof window !== 'undefined') {
      const existing = JSON.parse(
        window.localStorage.getItem('agconn:onboarding:profile') ?? '{}',
      );
      window.localStorage.setItem(
        'agconn:onboarding:profile',
        JSON.stringify({ ...existing, county: selected }),
      );
    }
    router.push(`/${locale}/onboarding/skills`);
  }

  return (
    <div className="grid gap-4">
      <div className="grid grid-cols-2 gap-3">
        {COUNTIES.map((c) => (
          <button
            type="button"
            key={c}
            onClick={() => setSelected(c)}
            aria-pressed={selected === c}
            className={[
              'btn btn-lg justify-center',
              selected === c ? 'btn-primary' : 'btn-outline',
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
      <button
        type="button"
        onClick={next}
        disabled={!selected}
        className="btn btn-primary btn-lg w-full"
      >
        {t('profile.continue')}
      </button>
    </div>
  );
}
