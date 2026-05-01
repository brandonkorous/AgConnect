'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';

type Props = {
  locale: string;
  initialFirst?: string;
  initialLast?: string;
  initialEmail?: string;
};

export function NameForm({ locale, initialFirst = '', initialLast = '', initialEmail = '' }: Props) {
  const t = useTranslations('worker.onboarding');
  const router = useRouter();
  const [first, setFirst] = useState(initialFirst);
  const [last, setLast] = useState(initialLast);
  const [email, setEmail] = useState(initialEmail);
  const [submitting, setSubmitting] = useState(false);

  const valid = first.trim().length > 0 && last.trim().length > 0;

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!valid) return;
    setSubmitting(true);
    // Stub: persist locally until API endpoint resolves wired-Clerk session.
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(
        'agconn:onboarding:profile',
        JSON.stringify({ firstName: first.trim(), lastName: last.trim(), email: email.trim() }),
      );
    }
    router.push(`/${locale}/onboarding/county`);
  }

  return (
    <form onSubmit={submit} className="grid gap-4">
      <fieldset className="fieldset">
        <legend className="fieldset-legend">{t('profile.contact.first_name')}</legend>
        <input
          type="text"
          required
          className="input input-bordered w-full"
          value={first}
          onChange={(e) => setFirst(e.target.value)}
          autoComplete="given-name"
        />
      </fieldset>
      <fieldset className="fieldset">
        <legend className="fieldset-legend">{t('profile.contact.last_name')}</legend>
        <input
          type="text"
          required
          className="input input-bordered w-full"
          value={last}
          onChange={(e) => setLast(e.target.value)}
          autoComplete="family-name"
        />
      </fieldset>
      <fieldset className="fieldset">
        <legend className="fieldset-legend">{t('profile.field.email.label')}</legend>
        <input
          type="email"
          className="input input-bordered w-full"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
        />
        <p className="label">{t('profile.field.email.hint')}</p>
      </fieldset>
      <button
        type="submit"
        className="btn btn-primary btn-lg w-full"
        disabled={!valid || submitting}
      >
        {t('profile.continue')}
      </button>
    </form>
  );
}
