import * as Sentry from '@sentry/nextjs';
import { installReactHook } from '@wizeworks/lens-react';
import { serverTraces } from './components/providers/WizeLens';

// WizeLens: React reports every commit to a global hook that react-dom reads
// once, when it loads, and this file runs before hydration. Installing it here
// times each render per component, only when this page's server traces it.
if (serverTraces()) {
    installReactHook();
}

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
        release: process.env.NEXT_PUBLIC_SENTRY_RELEASE || undefined,
    });
}

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
