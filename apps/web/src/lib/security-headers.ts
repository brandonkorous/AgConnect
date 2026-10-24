// Used by next.config.ts; import-free so node:test can load it.

// Report-only first: browsers log violations but block nothing until this is tightened and enforced.
const CSP_REPORT_ONLY = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' https:",
    "style-src 'self' 'unsafe-inline' https:",
    "img-src 'self' data: blob: https:",
    "font-src 'self' data: https:",
    "connect-src 'self' https: wss:",
    "media-src 'self' blob: https:",
    "worker-src 'self' blob:",
    'frame-src https:',
    "frame-ancestors 'self'",
    "base-uri 'self'",
    "form-action 'self'",
].join('; ');

export const SECURITY_HEADERS = [
    { key: 'Strict-Transport-Security', value: 'max-age=31536000' },
    { key: 'X-Content-Type-Options', value: 'nosniff' },
    { key: 'Content-Security-Policy-Report-Only', value: CSP_REPORT_ONLY },
];
