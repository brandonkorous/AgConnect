import * as Sentry from '@sentry/nextjs';
import type { Instrumentation } from 'next';

// WizeLens: traces each request to this server, with Next's render, route
// handler and fetch spans inside it; calls to the api join the same trace. On
// in development (dashboard at /_wizelens). In production only with
// WIZELENS_ENABLED=true, and then send-only to WIZELENS_HUB. Node.js runtime
// only, and the check must wrap the import so the edge build leaves it out.
// Sentry starts first and keeps the global OpenTelemetry provider when its DSN
// is set; WizeLens still traces each request. A failure to start is logged
// and never stops the app.
const WIZELENS = process.env.NODE_ENV === 'development' || process.env.WIZELENS_ENABLED === 'true';

async function startWizeLens() {
    try {
        const { registerWizeLens } = await import('@wizeworks/lens-node/next');
        registerWizeLens({ serviceName: 'agconn-web', enabled: true });
    } catch (err) {
        console.warn('[wizelens] tracing did not start', err);
    }
}

export async function register() {
    if (process.env.NEXT_RUNTIME === 'nodejs') {
        await import('../sentry.server.config');
        if (WIZELENS) await startWizeLens();
    }
    if (process.env.NEXT_RUNTIME === 'edge') {
        await import('../sentry.edge.config');
    }
}

export const onRequestError: Instrumentation.onRequestError = async (...args) => {
    await Sentry.captureRequestError(...args);
    if (process.env.NEXT_RUNTIME !== 'nodejs' || !WIZELENS) return;
    try {
        const { onRequestError: wizelensError } = await import('@wizeworks/lens-node/next');
        wizelensError(...args);
    } catch {
        // Tracing is optional: Sentry already has the error.
    }
};
