'use client';

import { useQuery, useSuspenseQuery, queryOptions } from '@tanstack/react-query';
import { apiClient } from '../client';
import { unwrap } from '../unwrap';
import { qk } from '../query-keys';

export type CropKey =
  | 'grape'
  | 'almond'
  | 'tomato'
  | 'citrus'
  | 'strawberry'
  | 'lettuce';

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

export type JobsPage = {
  jobs: JobCard[];
  nextCursor: string | null;
  totalCount: number;
  cropCounts: Record<CropKey, number>;
};

export type RecommendedJob = JobCard & { matchScore: number };

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

export type JobDetailResult =
  | { status: 'ok'; data: JobDetail }
  | { status: 'gone' };

function jobsOptions(query: JobsQuery) {
  return queryOptions({
    queryKey: qk.jobs(query),
    queryFn: async (): Promise<JobsPage> =>
      unwrap(
        await apiClient().get<JobsPage>('/v1/jobs', {
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
            cursor: query.cursor ?? undefined,
            limit: query.limit,
          },
        }),
      ),
    staleTime: 60_000,
  });
}

const recommendedJobsOptions = queryOptions({
  queryKey: qk.recommendedJobs(),
  queryFn: async (): Promise<RecommendedJob[]> => {
    const data = unwrap(
      await apiClient().get<{ jobs: RecommendedJob[] }>('/v1/jobs/recommended'),
    );
    return data.jobs;
  },
  staleTime: 5 * 60_000,
});

export function useJobs(query: JobsQuery = {}) {
  return useQuery(jobsOptions(query));
}
export function useJobsSuspense(query: JobsQuery = {}) {
  return useSuspenseQuery(jobsOptions(query));
}

export function useRecommendedJobs() {
  return useQuery(recommendedJobsOptions);
}
export function useRecommendedJobsSuspense() {
  return useSuspenseQuery(recommendedJobsOptions);
}

function jobOptions(slug: string) {
  return queryOptions({
    queryKey: qk.job(slug),
    queryFn: async (): Promise<JobDetailResult> => {
      const res = await apiClient().get<JobDetail>(
        `/v1/jobs/${encodeURIComponent(slug)}`,
      );
      if (res.ok) return { status: 'ok', data: res.data };
      if (res.error.code === 'job_gone') return { status: 'gone' };
      throw new Error(res.error.message || res.error.code);
    },
    staleTime: 60_000,
  });
}

export function useJob(slug: string) {
  return useQuery(jobOptions(slug));
}
export function useJobSuspense(slug: string) {
  return useSuspenseQuery(jobOptions(slug));
}
