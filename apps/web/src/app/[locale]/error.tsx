'use client';

import { useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { PageError } from '@agconn/ui';

export default function LocaleError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations('shell.page_error');

  useEffect(() => {
    console.error('[error.tsx]', error);
  }, [error]);

  return (
    <PageError
      variant="500"
      title={t('500.title')}
      description={t('500.description')}
      tryAgainLabel={t('try_again')}
      goHomeLabel={t('go_home')}
      errorIdLabel={t('error_id')}
      digest={error.digest}
      reset={reset}
    />
  );
}
