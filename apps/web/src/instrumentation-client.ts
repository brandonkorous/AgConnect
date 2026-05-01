import * as Sentry from '@sentry/nextjs';

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

if (dsn) {
    Sentry.init({
        dsn,
        sendDefaultPii: false,
        tracesSampleRate: process.env.NODE_ENV === 'development' ? 1.0 : 0.1,
        replaysSessionSampleRate: 0.1,
        replaysOnErrorSampleRate: 1.0,
        enableLogs: true,
        integrations: [Sentry.replayIntegration({ maskAllText: false, blockAllMedia: true })],
        environment: process.env.NEXT_PUBLIC_APP_ENV ?? process.env.NODE_ENV,
    });
}

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
