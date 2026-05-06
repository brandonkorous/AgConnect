import 'server-only';
import { getServerApiClient } from './server-client';

export type JobCard = {
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

export type JobDetail = JobCard & {
  descriptionEn: string;
  descriptionEs: string;
  applyBy: string | null;
  status: string;
  publishedAt: string | null;
  applicationStatus: string | null;
  applicationId: string | null;
  dailyStartTime: string | null;
  dailyEndTime: string | null;
  workingDays: number;
  payFrequency: string;
  mealsProvided: boolean;
  pickupPoint: string | null;
  positionsTotal: number;
  hireCount: number;
};

export type JobsQuery = {
  q?: string;
  county?: string[];
  skills?: string[];
  wageMin?: number;
  wageMax?: number;
  startBefore?: string;
  startAfter?: string;
  housing?: boolean;
  transport?: boolean;
  sort?: 'best' | 'newest' | 'wage_high' | 'starts_soon';
  cursor?: string | null;
  limit?: number;
};

export type CropKey =
  | 'grape'
  | 'almond'
  | 'tomato'
  | 'citrus'
  | 'strawberry'
  | 'lettuce';

export type JobsPage = {
  jobs: JobCard[];
  nextCursor: string | null;
  totalCount: number;
  cropCounts: Record<CropKey, number>;
};

export async function fetchJobs(query: JobsQuery = {}): Promise<JobsPage> {
  const api = await getServerApiClient();
  const res = await api.get<JobsPage>('/v1/jobs', {
    query: {
      q: query.q,
      county: query.county,
      skills: query.skills,
      wageMin: query.wageMin,
      wageMax: query.wageMax,
      startBefore: query.startBefore,
      startAfter: query.startAfter,
      housing: query.housing,
      transport: query.transport,
      sort: query.sort,
      limit: query.limit ?? 20,
      cursor: query.cursor ?? undefined,
    },
    handleErrorInline: true,
  });
  if (!res.ok) {
    return {
      jobs: [],
      nextCursor: null,
      totalCount: 0,
      cropCounts: {
        grape: 0,
        almond: 0,
        tomato: 0,
        citrus: 0,
        strawberry: 0,
        lettuce: 0,
      },
    };
  }
  return res.data;
}

export async function fetchJob(slug: string): Promise<JobDetail | null> {
  const api = await getServerApiClient();
  const res = await api.get<JobDetail>(`/v1/jobs/${encodeURIComponent(slug)}`, {
    handleErrorInline: true,
  });
  if (!res.ok) return null;
  return res.data;
}

export type RecommendedJob = JobCard & { matchScore: number };

export async function fetchRecommendedJobs(): Promise<RecommendedJob[]> {
  const api = await getServerApiClient();
  const res = await api.get<{ jobs: RecommendedJob[] }>('/v1/jobs/recommended', {
    handleErrorInline: true,
  });
  if (!res.ok) return [];
  return res.data.jobs;
}
