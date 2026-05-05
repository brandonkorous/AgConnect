'use client';

import { useEffect } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { ErrorState } from '@agconn/ui';

export default function LocaleError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations('shell.page_error');
  const locale = useLocale();

  useEffect(() => {
    console.error('[error.tsx]', error);
  }, [error]);

  return (
    <main className="bg-base-300 text-base-content min-h-screen">
      <ErrorState
        code="500"
        eyebrow={t('500.eyebrow')}
        title={t('500.title')}
        description={t('500.description')}
        tryAgainLabel={t('try_again')}
        reset={reset}
        secondaryAction={{
          href: `/${locale}`,
          label: t('go_home'),
        }}
        digest={error.digest}
        errorIdLabel={t('error_id')}
      />
    </main>
  );
}
