// Sentry init must happen before any other imports that we want
// instrumented (Prisma, Hono, etc). This file is imported as the very first
// statement in src/index.ts.

import * as Sentry from '@sentry/node';

const dsn = process.env.SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,
    sendDefaultPii: false,
    tracesSampleRate: process.env.NODE_ENV === 'development' ? 1.0 : 0.1,
    includeLocalVariables: true,
    enableLogs: true,
    environment: process.env.APP_ENV ?? process.env.NODE_ENV,
    serverName: '@agconn/api',
  });
}

export const sentryEnabled = Boolean(dsn);
