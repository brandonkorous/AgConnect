// Sentry init must happen before any other imports that we want
// instrumented (Prisma, Hono, etc). This file is imported as the very first
// statement in src/index.ts.

import * as Sentry from '@sentry/node';

const dsn = process.env.SENTRY_DSN;

if (dsn) {
  // includeLocalVariables enables Sentry's LocalVariables integration, which
  // opens the V8 inspector via inspector.open() so it can capture frame
  // locals when errors fire. That's why prod stderr would show
  // "Debugger listening on ws://127.0.0.1:..." — informational, but it
  // surfaces as severity=ERROR in GCP and shouldn't be on in prod anyway.
  // Keep it on in dev for richer error frames.
  const isDev = process.env.NODE_ENV === 'development';
  Sentry.init({
    dsn,
    sendDefaultPii: false,
    tracesSampleRate: isDev ? 1.0 : 0.1,
    includeLocalVariables: isDev,
    enableLogs: true,
    environment: process.env.APP_ENV ?? process.env.NODE_ENV,
    serverName: '@agconn/api',
    release: process.env.SENTRY_RELEASE || undefined,
  });
}

export const sentryEnabled = Boolean(dsn);
