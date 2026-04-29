'use client';

import { useState, type FormEvent } from 'react';
import { useLocale } from 'next-intl';
import { ArrowRight } from '@/components/primitives/ArrowRight';

type Audience = 'worker' | 'employer';

type Props = {
  audience: Audience;
  title: string;
  inputLabel: string;
  inputPlaceholder: string;
  ctaText: string;
  helpText: string;
  successText: string;
};

export function WaitlistForm({
  audience,
  title,
  inputLabel,
  inputPlaceholder,
  ctaText,
  helpText,
  successText,
}: Props) {
  const locale = useLocale();
  const [value, setValue] = useState('');
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (status === 'submitting' || !value.trim()) return;
    setStatus('submitting');
    const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:3001';
    const email =
      audience === 'employer' ? value.trim() : `${value.replace(/\D/g, '')}@phone.agconn.com`;
    try {
      const res = await fetch(`${apiBase}/v1/landing/waitlist`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, locale, audience }),
      });
      setStatus(res.ok ? 'success' : 'error');
    } catch {
      setStatus('error');
    }
  }

  const inputType = audience === 'employer' ? 'email' : 'tel';
  const inputId = `final-cta-${audience}`;

  return (
    <article className="border-soil/20 bg-bone flex flex-col gap-4 border p-6 md:p-7">
      <h3 className="text-ink font-serif text-xl font-medium tracking-tight">{title}</h3>
      {status === 'success' ? (
        <p className="text-moss font-sans text-base leading-relaxed">{successText}</p>
      ) : (
        <form onSubmit={onSubmit} className="flex flex-col gap-3">
          <label htmlFor={inputId} className="text-soil font-sans text-sm">
            {inputLabel}
          </label>
          <input
            id={inputId}
            type={inputType}
            autoComplete={audience === 'employer' ? 'email' : 'tel'}
            inputMode={audience === 'employer' ? 'email' : 'tel'}
            placeholder={inputPlaceholder}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            required
            className="border-soil/30 bg-bone text-ink placeholder:text-soil/60 focus:border-moss focus:outline-honey px-4 py-3 font-sans text-base focus:outline-2 focus:outline-offset-2 border"
          />
          <button
            type="submit"
            disabled={status === 'submitting'}
            className="bg-moss text-bone hover:bg-ink disabled:opacity-60 mt-1 inline-flex items-center justify-center gap-2 px-5 py-3 font-sans text-base font-semibold"
          >
            <span>{ctaText}</span>
            <ArrowRight size={14} stroke="#EFE6D2" width={2} />
          </button>
          <p className="text-soil mt-1 font-sans text-xs leading-relaxed">{helpText}</p>
          {status === 'error' && (
            <p className="text-error font-sans text-xs">Could not submit — try again.</p>
          )}
        </form>
      )}
    </article>
  );
}
