'use client';

import * as Sentry from '@sentry/nextjs';
import { useEffect } from 'react';

export default function GlobalError({
  error,
}: {
  error: Error & { digest?: string };
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  // Provider-free fallback: this fires only when the root locale layout itself
  // crashed, so next-intl, Clerk, and the daisyUI theme bootstrap are all gone.
  // Keep markup self-contained (no external classes, no provider hooks) and
  // bilingual at the same time per house rules.
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2rem 1.25rem',
          background: '#F2EDE2',
          color: '#1F2937',
          fontFamily:
            'Inter, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
          textAlign: 'center',
        }}
      >
        <div style={{ maxWidth: '32rem', width: '100%' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.625rem',
              fontSize: '0.75rem',
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              color: '#6B7280',
              marginBottom: '1.25rem',
            }}
          >
            <span style={{ fontFamily: 'ui-monospace, "JetBrains Mono", monospace' }}>
              500
            </span>
            <span aria-hidden style={{ color: '#9CA3AF' }}>·</span>
            <span>Server error / Error del servidor</span>
          </div>

          <h1
            style={{
              fontSize: 'clamp(1.875rem, 4vw, 2.25rem)',
              fontWeight: 500,
              letterSpacing: '-0.02em',
              lineHeight: 1.15,
              margin: '0 0 1rem',
            }}
          >
            Something went wrong
          </h1>
          <p
            style={{
              fontSize: '1rem',
              lineHeight: 1.6,
              color: '#4B5563',
              margin: '0 0 0.5rem',
            }}
          >
            We've been notified. Please try again.
          </p>
          <p
            lang="es"
            style={{
              fontSize: '1rem',
              lineHeight: 1.6,
              color: '#4B5563',
              margin: '0 0 1.75rem',
            }}
          >
            Algo salió mal. Ya nos enteramos. Intenta de nuevo por favor.
          </p>

          <a
            href="/"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '0.625rem 1.5rem',
              borderRadius: '9999px',
              background: '#5B6E2E',
              color: '#FFFFFF',
              textDecoration: 'none',
              fontWeight: 500,
              fontSize: '0.9375rem',
            }}
          >
            Back to home / Volver al inicio
          </a>

          {error.digest && (
            <p
              style={{
                marginTop: '1.5rem',
                fontSize: '0.75rem',
                color: '#9CA3AF',
                fontFamily: 'ui-monospace, "JetBrains Mono", monospace',
              }}
            >
              Error ID: {error.digest}
            </p>
          )}
        </div>
      </body>
    </html>
  );
}
