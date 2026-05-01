'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import type { Route } from 'next';
import { useTranslations } from 'next-intl';

type Props = { locale: string; nextHref: string };

export function LangChoice({ locale, nextHref }: Props) {
  const t = useTranslations('worker.onboarding');
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function pick(target: 'en' | 'es') {
    startTransition(() => {
      const otherSegment = nextHref.replace(/^\/[a-z]{2}/, `/${target}`);
      router.push(otherSegment as Route);
    });
  }

  return (
    <div className="grid gap-3">
      <button
        type="button"
        onClick={() => pick('es')}
        className="btn btn-lg btn-primary justify-start text-left"
        aria-pressed={locale === 'es'}
        disabled={pending}
      >
        <span className="font-semibold">{t('welcome.lang.es')}</span>
        <span className="text-primary-content/80 ml-auto text-sm">Español</span>
      </button>
      <button
        type="button"
        onClick={() => pick('en')}
        className="btn btn-lg btn-outline justify-start text-left"
        aria-pressed={locale === 'en'}
        disabled={pending}
      >
        <span className="font-semibold">{t('welcome.lang.en')}</span>
        <span className="text-base-content/60 ml-auto text-sm">English</span>
      </button>
    </div>
  );
}
