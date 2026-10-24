import { defineRouting } from 'next-intl/routing';

export const routing = defineRouting({
  locales: ['en', 'es'],
  defaultLocale: 'es',
  localePrefix: 'always',
  // Secure in production; plain http://localhost still works in dev.
  localeCookie: { secure: process.env.NODE_ENV === 'production' },
});
