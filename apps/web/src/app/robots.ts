import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
    const base = (process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000').replace(/\/$/, '');
    return {
        rules: [
            {
                userAgent: '*',
                allow: '/',
                disallow: [
                    '/admin/',
                    '/api/',
                    '/_next/',
                    '/sign-in/',
                    '/sign-up/',
                    '/onboarding/',
                    '/worker/',
                    '/employer/',
                    '/confirm',
                    '/unsubscribe',
                    '/verify/',
                ],
            },
            { userAgent: 'GPTBot', allow: '/' },
            { userAgent: 'PerplexityBot', allow: '/' },
            { userAgent: 'ClaudeBot', allow: '/' },
            { userAgent: 'Google-Extended', allow: '/' },
            { userAgent: 'CCBot', allow: '/' },
            { userAgent: 'anthropic-ai', allow: '/' },
        ],
        sitemap: `${base}/sitemap.xml`,
        host: base,
    };
}
