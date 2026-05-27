'use client';

import { useEffect } from 'react';
import { useLocale } from 'next-intl';
import { setApiClientLocale } from '@/lib/api/client';

// Propagates the current next-intl locale to the api client. Locale changes
// (en ↔ es) trigger a re-set; the client picks up the new value on the next
// request via its getLocale callback.

export function LocaleBridge() {
  const locale = useLocale();

  useEffect(() => {
    setApiClientLocale(locale === 'es' ? 'es' : 'en');
  }, [locale]);

  return null;
}
