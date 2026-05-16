import type { MetadataRoute } from 'next';
import { getSiteUrl } from '@/lib/seo/metadata';

export default function robots(): MetadataRoute.Robots {
    const base = getSiteUrl();
    return {
        rules: [
            {
                userAgent: '*',
                allow: '/',
                disallow: [
                    '/api/',
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
