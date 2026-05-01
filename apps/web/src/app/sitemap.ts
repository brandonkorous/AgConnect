import type { MetadataRoute } from 'next';
import { routing } from '@/i18n/routing';
import { fetchJobsSitemap } from '@/lib/api/public-jobs';
import { fetchTrainingSitemap } from '@/lib/api/public-training';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = (process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000').replace(/\/$/, '');
  const langsFor = (path: string) =>
    Object.fromEntries(routing.locales.map((l) => [l, `${base}/${l}${path}`]));

  const marketing: Array<{ path: string; priority: number; changeFrequency: 'daily' | 'weekly' | 'monthly' }> = [
    { path: '', priority: 1, changeFrequency: 'weekly' },
    { path: '/faq', priority: 0.8, changeFrequency: 'weekly' },
    { path: '/impact', priority: 0.7, changeFrequency: 'daily' },
    { path: '/resources', priority: 0.5, changeFrequency: 'weekly' },
  ];

  const homeEntries: MetadataRoute.Sitemap = marketing.flatMap((s) =>
    routing.locales.map((locale) => ({
      url: `${base}/${locale}${s.path}`,
      lastModified: new Date(),
      changeFrequency: s.changeFrequency,
      priority: s.priority,
      alternates: { languages: langsFor(s.path) },
    })),
  );

  const browseEntries: MetadataRoute.Sitemap = routing.locales.flatMap((locale) => [
    {
      url: `${base}/${locale}/jobs`,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 0.9,
    },
    {
      url: `${base}/${locale}/training`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    },
  ]);

  const [jobs, programs] = await Promise.all([
    fetchJobsSitemap().catch(() => []),
    fetchTrainingSitemap().catch(() => []),
  ]);

  const jobEntries: MetadataRoute.Sitemap = jobs.flatMap((j) =>
    routing.locales.map((locale) => ({
      url: `${base}/${locale}/jobs/${j.slug}`,
      lastModified: new Date(j.updatedAt),
      changeFrequency: 'daily' as const,
      priority: 0.7,
    })),
  );

  const programEntries: MetadataRoute.Sitemap = programs.flatMap((p) =>
    routing.locales.map((locale) => ({
      url: `${base}/${locale}/training/${p.slug}`,
      lastModified: new Date(p.updatedAt),
      changeFrequency: 'weekly' as const,
      priority: 0.6,
    })),
  );

  return [...homeEntries, ...browseEntries, ...jobEntries, ...programEntries];
}
