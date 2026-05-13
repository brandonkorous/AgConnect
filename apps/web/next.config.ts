import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';
import withSerwistInit from '@serwist/next';
import { withSentryConfig } from '@sentry/nextjs';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

const withSerwist = withSerwistInit({
    swSrc: 'src/app/sw.ts',
    swDest: 'public/sw.js',
    cacheOnNavigation: true,
    reloadOnOnline: false,
    disable: process.env.NODE_ENV === 'development',
    exclude: [/^\/admin\//, /^\/admin\/v1\//, /^\/llms\.txt$/, /^\/sitemap\.xml$/, /^\/robots\.txt$/],
});

const nextConfig: NextConfig = {
    reactStrictMode: true,
    poweredByHeader: false,
    typedRoutes: true,
    // Standalone output: self-contained server bundle in .next/standalone for
    // slim Docker images (no node_modules in the runtime layer).
    output: 'standalone',
    outputFileTracingRoot: process.env.NEXT_OUTPUT_FILE_TRACING_ROOT,
    // Workspace packages export TypeScript source via the "source" condition.
    // SWC transpiles them so no pre-build step is required during next build.
    transpilePackages: ['@agconn/api-client', '@agconn/auth', '@agconn/schemas', '@agconn/sms', '@agconn/ui'],
    webpack(config) {
        // Prepend the custom "source" condition so webpack picks up the TypeScript
        // source entry from workspace package exports before the "import" condition
        // (which points to dist/ and may not exist without a prior build).
        config.resolve.conditionNames = [
            'source',
            ...(config.resolve.conditionNames ?? []),
        ];
        return config;
    },
    async headers() {
        return [
            {
                source: '/:path*',
                headers: [
                    { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
                    { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
                    { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
                ],
            },
        ];
    },
};

const composed = withSerwist(withNextIntl(nextConfig));

export default withSentryConfig(composed, {
    org: process.env.SENTRY_ORG,
    project: process.env.SENTRY_PROJECT,
    authToken: process.env.SENTRY_AUTH_TOKEN,
    widenClientFileUpload: true,
    tunnelRoute: '/monitoring',
    silent: !process.env.CI,
    disableLogger: true,
});
