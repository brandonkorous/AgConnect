'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';

type Props = { locale: 'en' | 'es' };

export function OnboardingWaitlistForm({ locale }: Props) {
  const t = useTranslations('worker.onboarding.waitlist');
  const tErr = useTranslations('worker.onboarding');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [county, setCounty] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const valid = (email.trim() !== '' || phone.trim() !== '') && county.trim().length >= 2;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!valid) {
      setError(t('contact_required'));
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const baseUrl =
        process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, '') ?? 'http://localhost:3001';
      const res = await fetch(`${baseUrl}/v1/landing/waitlist`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim() || undefined,
          phone: phone.trim() || undefined,
          county: county.trim(),
          locale,
          audience: 'worker',
          source: 'landing_waitlist_form',
        }),
        credentials: 'include',
      });
      if (!res.ok) throw new Error('failed');
      setDone(true);
    } catch {
      setError(tErr('error.generic'));
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <div className="bg-success/10 text-success-content rounded-2xl p-6 text-center">
        <p className="text-lg font-semibold">{t('thanks')}</p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="grid gap-4">
      <p className="text-base-content/70">{t('subtitle')}</p>
      <fieldset className="fieldset">
        <legend className="fieldset-legend">{t('county.label')}</legend>
        <input
          type="text"
          className="input input-bordered w-full"
          value={county}
          onChange={(e) => setCounty(e.target.value)}
          required
        />
      </fieldset>
      <fieldset className="fieldset">
        <legend className="fieldset-legend">{t('email.label')}</legend>
        <input
          type="email"
          className="input input-bordered w-full"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </fieldset>
      <fieldset className="fieldset">
        <legend className="fieldset-legend">{t('phone.label')}</legend>
        <input
          type="tel"
          className="input input-bordered w-full"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
        />
      </fieldset>
      {error && (
        <div role="alert" className="alert alert-warning">
          <span>{error}</span>
        </div>
      )}
      <button
        type="submit"
        className="btn btn-primary btn-lg w-full"
        disabled={!valid || submitting}
      >
        {t('cta')}
      </button>
    </form>
  );
}
