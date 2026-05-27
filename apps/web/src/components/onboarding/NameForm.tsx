'use client';

import { useEffect, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useOnboardingDraft } from '@/lib/useOnboardingDraft';
import { patchOnboardingAction } from '@/lib/api/onboarding-actions';
import { onboardingPath } from '@/lib/onboarding-steps';
import { useOnboardingShell } from '@/lib/use-onboarding-shell';

type Props = {
  locale: string;
  initialFirst?: string;
  initialLast?: string;
  initialEmail?: string;
};

type Draft = { first: string; last: string; email: string };

export function NameForm({
  locale,
  initialFirst = '',
  initialLast = '',
  initialEmail = '',
}: Props) {
  const t = useTranslations('worker.onboarding');
  const router = useRouter();
  const shell = useOnboardingShell();
  const { value, setValue, loaded, clear } = useOnboardingDraft<Draft>(
    'profile',
    { first: initialFirst, last: initialLast, email: initialEmail },
  );
  const [submitting, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  // When server-side `initial*` updates after Clerk sync (e.g. they signed in
  // with email), seed the draft only if the user hasn't typed anything yet.
  useEffect(() => {
    if (!loaded) return;
    if (
      value.first === '' &&
      value.last === '' &&
      value.email === '' &&
      (initialFirst || initialLast || initialEmail)
    ) {
      setValue({ first: initialFirst, last: initialLast, email: initialEmail });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loaded]);

  const valid = value.first.trim().length > 0 && value.last.trim().length > 0;

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!valid) return;
    setError(null);
    startTransition(async () => {
      const trimmedEmail = value.email.trim();
      const res = await patchOnboardingAction({
        firstName: value.first.trim(),
        lastName: value.last.trim(),
        ...(trimmedEmail ? { email: trimmedEmail } : {}),
      });
      if (!res.ok) {
        setError(t('error.generic'));
        return;
      }
      await clear();
      router.push(onboardingPath(locale, 'county', shell));
    });
  }

  return (
    <form onSubmit={submit} className="grid gap-4">
      <fieldset className="fieldset">
        <legend className="fieldset-legend">{t('profile.contact.first_name')}</legend>
        <input
          type="text"
          required
          className="input input-bordered w-full"
          value={value.first}
          onChange={(e) => setValue((v) => ({ ...v, first: e.target.value }))}
          autoComplete="given-name"
        />
      </fieldset>
      <fieldset className="fieldset">
        <legend className="fieldset-legend">{t('profile.contact.last_name')}</legend>
        <input
          type="text"
          required
          className="input input-bordered w-full"
          value={value.last}
          onChange={(e) => setValue((v) => ({ ...v, last: e.target.value }))}
          autoComplete="family-name"
        />
      </fieldset>
      <fieldset className="fieldset">
        <legend className="fieldset-legend">{t('profile.field.email.label')}</legend>
        <input
          type="email"
          className="input input-bordered w-full"
          value={value.email}
          onChange={(e) => setValue((v) => ({ ...v, email: e.target.value }))}
          autoComplete="email"
        />
        <p className="label">{t('profile.field.email.hint')}</p>
      </fieldset>
      {error && <div className="text-error text-[12px]">{error}</div>}
      <button
        type="submit"
        className="btn btn-primary btn-lg w-full"
        disabled={!valid || submitting}
      >
        {submitting ? t('error.generic').slice(0, 0) || '…' : t('profile.continue')}
      </button>
    </form>
  );
}
