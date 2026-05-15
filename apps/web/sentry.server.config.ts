import * as Sentry from '@sentry/nextjs';

const dsn = process.env.SENTRY_DSN;

if (dsn) {
    // includeLocalVariables opens the V8 inspector via inspector.open() to
    // capture frame locals on errors. Keep it dev-only — in prod it makes
    // Node print "Debugger listening on ws://127.0.0.1:..." to stderr,
    // which GCP Logging tags as severity=ERROR.
    const isDev = process.env.NODE_ENV === 'development';
    Sentry.init({
        dsn,
        sendDefaultPii: false,
        tracesSampleRate: isDev ? 1.0 : 0.1,
        includeLocalVariables: isDev,
        enableLogs: true,
        environment: process.env.APP_ENV ?? process.env.NODE_ENV,
        release: process.env.SENTRY_RELEASE || undefined,
    });
}
