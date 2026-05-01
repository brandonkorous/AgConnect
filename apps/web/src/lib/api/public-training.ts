import 'server-only';
import { createApiClient } from '@agconn/api-client/client';
import { getLocale } from 'next-intl/server';

const BASE_URL =
  process.env.API_BASE_URL?.replace(/\/$/, '') ??
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, '') ??
  'http://localhost:3001';

async function publicClient() {
  const locale = (await getLocale().catch(() => 'en')) as 'en' | 'es';
  return createApiClient({
    baseUrl: BASE_URL,
    getLocale: () => (locale === 'es' ? 'es' : 'en'),
  });
}

export type PublicProgram = {
  id: string;
  seoSlug: string;
  titleEn: string;
  titleEs: string;
  funder: string;
  county: string;
  capacity: number;
  enrolledCount: number;
  startDate: string;
  endDate: string;
  topics: string[];
  status: string;
};

export type PublicProgramDetail = PublicProgram & {
  descriptionEn: string;
  descriptionEs: string;
  locationName: string | null;
  locationAddress: string | null;
  sessionTimes: unknown;
  orgName: string;
  spotsLeft: number;
};

export async function fetchPublicTrainingPrograms(
  query: { county?: string; funder?: string; cursor?: string | null } = {},
): Promise<{ programs: PublicProgram[]; nextCursor: string | null }> {
  const api = await publicClient();
  const res = await api.get<{ programs: PublicProgram[]; nextCursor: string | null }>(
    '/v1/landing/training',
    {
      query: {
        county: query.county,
        funder: query.funder,
        cursor: query.cursor ?? undefined,
      },
      handleErrorInline: true,
    },
  );
  if (!res.ok) return { programs: [], nextCursor: null };
  return res.data;
}

export async function fetchPublicProgram(
  slug: string,
): Promise<PublicProgramDetail | null> {
  const api = await publicClient();
  const res = await api.get<PublicProgramDetail>(
    `/v1/landing/training/${encodeURIComponent(slug)}`,
    { handleErrorInline: true },
  );
  if (!res.ok) return null;
  return res.data;
}

export type SitemapItem = { slug: string; updatedAt: string };

export async function fetchTrainingSitemap(): Promise<SitemapItem[]> {
  const api = await publicClient();
  const res = await api.get<{ items: SitemapItem[] }>(
    '/v1/landing/training/sitemap/list',
    { handleErrorInline: true },
  );
  if (!res.ok) return [];
  return res.data.items;
}
