import * as Sentry from '@sentry/nextjs';

const dsn = process.env.SENTRY_DSN;

if (dsn) {
    Sentry.init({
        dsn,
        sendDefaultPii: false,
        tracesSampleRate: process.env.NODE_ENV === 'development' ? 1.0 : 0.1,
        enableLogs: true,
        environment: process.env.APP_ENV ?? process.env.NODE_ENV,
        release: process.env.SENTRY_RELEASE || undefined,
    });
}
