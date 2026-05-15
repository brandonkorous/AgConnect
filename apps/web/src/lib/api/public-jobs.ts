import 'server-only';
import { createApiClient } from '@agconn/api-client/client';
import { getLocale } from 'next-intl/server';

const BASE_URL =
  process.env.API_BASE_URL?.replace(/\/$/, '') ??
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, '') ??
  'http://localhost:3001';

// No Clerk session — anonymous public-tenant browse for SEO.
async function publicClient() {
  const locale = (await getLocale().catch(() => 'en')) as 'en' | 'es';
  return createApiClient({
    baseUrl: BASE_URL,
    getLocale: () => (locale === 'es' ? 'es' : 'en'),
  });
}

export type PublicJob = {
  id: string;
  seoSlug: string;
  titleEn: string;
  titleEs: string;
  county: string;
  city: string | null;
  wageMin: number;
  wageMax: number;
  wageUnit: string;
  startDate: string;
  endDate: string | null;
  employerName: string;
  employerVerified: boolean;
  skills: string[];
  housing: boolean;
  transport: boolean;
  createdAt: string;
};

export type PublicJobDetail = PublicJob & {
  descriptionEn: string;
  descriptionEs: string;
  applyBy: string | null;
  publishedAt: string | null;
};

export async function fetchPublicJobs(
  query: { county?: string; cursor?: string | null } = {},
): Promise<{ jobs: PublicJob[]; nextCursor: string | null }> {
  const api = await publicClient();
  const res = await api.get<{ jobs: PublicJob[]; nextCursor: string | null }>(
    '/v1/landing/jobs',
    {
      query: { county: query.county, cursor: query.cursor ?? undefined },
      handleErrorInline: true,
    },
  );
  if (!res.ok) return { jobs: [], nextCursor: null };
  return res.data;
}

export type FetchPublicJobResult = PublicJobDetail | 'gone' | null;

export async function fetchPublicJob(slug: string): Promise<FetchPublicJobResult> {
  const api = await publicClient();
  const res = await api.get<PublicJobDetail>(
    `/v1/landing/jobs/${encodeURIComponent(slug)}`,
    { handleErrorInline: true },
  );
  if (!res.ok) {
    if (res.error.code === 'job_gone') return 'gone';
    return null;
  }
  return res.data;
}

export type SitemapItem = { slug: string; updatedAt: string };

export async function fetchJobsSitemap(): Promise<SitemapItem[]> {
  const api = await publicClient();
  const res = await api.get<{ items: SitemapItem[] }>(
    '/v1/landing/jobs/sitemap/list',
    { handleErrorInline: true },
  );
  if (!res.ok) return [];
  return res.data.items;
}
