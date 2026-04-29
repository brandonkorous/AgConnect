'use client';

import { useState, type FormEvent } from 'react';
import { useTranslations } from 'next-intl';

export function FooterNewsletter() {
  const t = useTranslations('landing.footer.newsletter');
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'success'>('idle');

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setStatus('success');
  }

  return (
    <div className="bg-moss flex flex-col items-start gap-6 p-8 lg:flex-row lg:items-center lg:gap-20">
      <div className="flex flex-1 flex-col gap-2">
        <p className="text-bone font-serif text-2xl font-semibold italic tracking-[-0.015em]">
          {t('headline')}
        </p>
        <p className="text-sage font-sans text-sm">{t('body')}</p>
      </div>
      {status === 'success' ? (
        <p className="text-honey font-sans text-sm font-semibold">{t('success')}</p>
      ) : (
        <form onSubmit={onSubmit} className="flex w-full items-center gap-2 lg:flex-1">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={t('placeholder')}
            aria-label={t('label')}
            required
            className="bg-bone text-ink placeholder:text-soil flex-1 px-4 py-3.5 font-sans text-sm"
          />
          <button
            type="submit"
            className="bg-honey text-ink hover:bg-bone px-5 py-3.5 font-sans text-sm font-semibold"
          >
            {t('cta')}
          </button>
        </form>
      )}
    </div>
  );
}
