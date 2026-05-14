import type { NextConfig } from 'next';
import { withSentryConfig } from '@sentry/nextjs';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  typedRoutes: false,
  output: 'standalone',
  outputFileTracingRoot: process.env.NEXT_OUTPUT_FILE_TRACING_ROOT,
  transpilePackages: ['@agconn/api-client', '@agconn/schemas', '@agconn/ui'],
  // Turbopack is the Next 16 default for build. Workspace packages
  // (@agconn/api-client, @agconn/schemas) resolve via their `import` export
  // condition to pre-built `dist/` outputs — the Dockerfile builds those
  // packages before `next build` via `pnpm --filter "@agconn/admin^..." build`.
  // The webpack() block below is preserved for explicit `next build --webpack`
  // runs only; under Turbopack it is ignored. Having any `turbopack` key here
  // also satisfies Next 16's "webpack config but no turbopack config" check,
  // which fires when `withSentryConfig` is skipped (no DSN).
  turbopack: {},
  webpack(config) {
    config.resolve.conditionNames = ['source', ...(config.resolve.conditionNames ?? [])];
    return config;
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Robots-Tag', value: 'noindex, nofollow' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        ],
      },
    ];
  },
};

// Sentry is opt-in. Without a DSN there's nothing to report to, so skip the
// wrapper entirely — that avoids the source-map upload step looking for an
// auth token and emitting warnings (or, in some plugin versions, failing the
// build). Set NEXT_PUBLIC_SENTRY_DSN_ADMIN to enable.
const sentryDsn = process.env.NEXT_PUBLIC_SENTRY_DSN_ADMIN;

export default sentryDsn
  ? withSentryConfig(nextConfig, {
      org: process.env.SENTRY_ORG,
      project: process.env.SENTRY_PROJECT_ADMIN,
      authToken: process.env.SENTRY_AUTH_TOKEN,
      widenClientFileUpload: true,
      tunnelRoute: '/monitoring',
      silent: !process.env.CI,
      disableLogger: true,
    })
  : nextConfig;
