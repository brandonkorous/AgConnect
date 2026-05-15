import { getAllResources } from '@/content/resources';
import { pickLocale } from '@/content/types';

export const dynamic = 'force-static';
export const revalidate = 86400;

const SITE = (process.env.NEXT_PUBLIC_SITE_URL ?? 'https://agconn.com').replace(/\/$/, '');

const COPY = {
    en: {
        title: 'AGCONN — Field guides',
        description:
            'Bilingual long-form guides for farmworkers, employers, and training organizations in the California Central Valley.',
        language: 'en-US',
    },
    es: {
        title: 'AGCONN — Guías de campo',
        description:
            'Guías bilingües para trabajadores agrícolas, empleadores y organizaciones de capacitación del Valle Central de California.',
        language: 'es-MX',
    },
} as const;

function escapeXml(input: string): string {
    return input
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
}

function rfc822(iso: string): string {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return new Date().toUTCString();
    return d.toUTCString();
}

type Props = { params: Promise<{ locale: string }> };

export async function GET(_req: Request, { params }: Props) {
    const { locale: raw } = await params;
    const locale: 'en' | 'es' = raw === 'es' ? 'es' : 'en';
    const meta = COPY[locale];
    const articles = getAllResources();
    const feedUrl = `${SITE}/${locale}/resources/feed.xml`;
    const channelLink = `${SITE}/${locale}/resources`;
    const lastBuild = articles[0]?.publishedAt
        ? rfc822(articles[0].publishedAt)
        : new Date().toUTCString();

    const items = articles
        .map((a) => {
            const url = `${SITE}/${locale}/resources/${a.slug}`;
            const altUrl = `${SITE}/${locale === 'en' ? 'es' : 'en'}/resources/${a.slug}`;
            return `    <item>
      <title>${escapeXml(pickLocale(a.title, locale))}</title>
      <link>${escapeXml(url)}</link>
      <guid isPermaLink="true">${escapeXml(url)}</guid>
      <pubDate>${rfc822(a.publishedAt)}</pubDate>
      <description>${escapeXml(pickLocale(a.summary, locale))}</description>
      <category>${escapeXml(a.category)}</category>
      <xhtml:link xmlns:xhtml="http://www.w3.org/1999/xhtml" rel="alternate" hreflang="${locale === 'en' ? 'es' : 'en'}" href="${escapeXml(altUrl)}" />
    </item>`;
        })
        .join('\n');

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:xhtml="http://www.w3.org/1999/xhtml">
  <channel>
    <title>${escapeXml(meta.title)}</title>
    <link>${escapeXml(channelLink)}</link>
    <description>${escapeXml(meta.description)}</description>
    <language>${meta.language}</language>
    <lastBuildDate>${lastBuild}</lastBuildDate>
    <atom:link href="${escapeXml(feedUrl)}" rel="self" type="application/rss+xml" />
${items}
  </channel>
</rss>
`;

    return new Response(xml, {
        headers: {
            'content-type': 'application/rss+xml; charset=utf-8',
            'cache-control': 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800',
        },
    });
}
