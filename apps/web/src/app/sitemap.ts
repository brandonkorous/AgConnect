import type { MetadataRoute } from 'next';
import { routing } from '@/i18n/routing';
import { fetchJobsSitemap } from '@/lib/api/public-jobs';
import { fetchTrainingSitemap } from '@/lib/api/public-training';
import { getAllResources, RESOURCE_CATEGORIES } from '@/content/resources';
import { getAllPressReleases } from '@/content/press';
import { getAllCareerRoles } from '@/content/careers';
import { getSiteUrl } from '@/lib/seo/metadata';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = getSiteUrl();
  const langsFor = (path: string) =>
    Object.fromEntries(routing.locales.map((l) => [l, `${base}/${l}${path}`]));

  const marketing: Array<{ path: string; priority: number; changeFrequency: 'daily' | 'weekly' | 'monthly' }> = [
    { path: '', priority: 1, changeFrequency: 'weekly' },
    { path: '/about', priority: 0.7, changeFrequency: 'monthly' },
    { path: '/contact', priority: 0.6, changeFrequency: 'monthly' },
    { path: '/workers', priority: 0.9, changeFrequency: 'weekly' },
    { path: '/employers', priority: 0.9, changeFrequency: 'weekly' },
    { path: '/how-it-works', priority: 0.8, changeFrequency: 'monthly' },
    { path: '/pricing', priority: 0.8, changeFrequency: 'monthly' },
    { path: '/partners', priority: 0.7, changeFrequency: 'weekly' },
    { path: '/faq', priority: 0.8, changeFrequency: 'weekly' },
    { path: '/impact', priority: 0.7, changeFrequency: 'daily' },
    { path: '/resources', priority: 0.6, changeFrequency: 'weekly' },
    { path: '/skills-wallet', priority: 0.5, changeFrequency: 'monthly' },
    { path: '/worker-rights', priority: 0.6, changeFrequency: 'monthly' },
    { path: '/promotora', priority: 0.5, changeFrequency: 'monthly' },
    { path: '/press', priority: 0.6, changeFrequency: 'weekly' },
    { path: '/trust', priority: 0.5, changeFrequency: 'monthly' },
    { path: '/careers', priority: 0.5, changeFrequency: 'weekly' },
    { path: '/privacy', priority: 0.4, changeFrequency: 'monthly' },
    { path: '/terms', priority: 0.4, changeFrequency: 'monthly' },
    { path: '/subprocessors', priority: 0.4, changeFrequency: 'monthly' },
    { path: '/accessibility', priority: 0.4, changeFrequency: 'monthly' },
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

  const resourceEntries: MetadataRoute.Sitemap = getAllResources().flatMap((article) =>
    routing.locales.map((locale) => ({
      url: `${base}/${locale}/resources/${article.slug}`,
      lastModified: new Date(article.publishedAt),
      changeFrequency: 'monthly' as const,
      priority: 0.5,
      alternates: { languages: langsFor(`/resources/${article.slug}`) },
    })),
  );

  const resourceCategoryEntries: MetadataRoute.Sitemap = RESOURCE_CATEGORIES.flatMap((category) =>
    routing.locales.map((locale) => ({
      url: `${base}/${locale}/resources/category/${category}`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.55,
      alternates: { languages: langsFor(`/resources/category/${category}`) },
    })),
  );

  const pressEntries: MetadataRoute.Sitemap = getAllPressReleases().flatMap((release) =>
    routing.locales.map((locale) => ({
      url: `${base}/${locale}/press/${release.slug}`,
      lastModified: new Date(release.publishedAt),
      changeFrequency: 'monthly' as const,
      priority: 0.5,
      alternates: { languages: langsFor(`/press/${release.slug}`) },
    })),
  );

  const careerEntries: MetadataRoute.Sitemap = getAllCareerRoles().flatMap((role) =>
    routing.locales.map((locale) => ({
      url: `${base}/${locale}/careers/${role.slug}`,
      lastModified: new Date(role.postedAt),
      changeFrequency: 'weekly' as const,
      priority: 0.5,
      alternates: { languages: langsFor(`/careers/${role.slug}`) },
    })),
  );

  return [
    ...homeEntries,
    ...browseEntries,
    ...jobEntries,
    ...programEntries,
    ...resourceEntries,
    ...resourceCategoryEntries,
    ...pressEntries,
    ...careerEntries,
  ];
}
