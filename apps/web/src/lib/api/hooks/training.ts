'use client';

import { useQuery, useSuspenseQuery, queryOptions } from '@tanstack/react-query';
import { apiClient } from '../client';
import { unwrap } from '../unwrap';

export type ProgramCard = {
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

export type ProgramDetail = ProgramCard & {
  descriptionEn: string;
  descriptionEs: string;
  locationName: string | null;
  locationAddress: string | null;
  sessionTimes: unknown;
  orgName: string;
  orgEmail: string | null;
};

export type EnrollmentRow = {
  id: string;
  status: 'enrolled' | 'completed' | 'dropped';
  enrolledAt: string;
  completedAt: string | null;
  droppedAt: string | null;
  certificateId: string | null;
  certUrl: string | null;
};

export type ProgramDetailResponse = {
  program: ProgramDetail;
  enrollment: EnrollmentRow | null;
  spotsLeft: number;
};

export type EnrollmentListItem = EnrollmentRow & { program: ProgramCard };

export type ProgramsPage = { programs: ProgramCard[]; nextCursor: string | null };

export type TrainingQuery = {
  q?: string;
  county?: string[];
  funder?: string[];
  topics?: string[];
  hasCapacity?: boolean;
  startBefore?: string;
  startAfter?: string;
  cursor?: string | null;
  limit?: number;
};

function trainingOptions(query: TrainingQuery) {
  return queryOptions({
    queryKey: ['training', query] as const,
    queryFn: async (): Promise<ProgramsPage> =>
      unwrap(
        await apiClient().get<ProgramsPage>('/v1/training', {
          query: {
            q: query.q,
            county: query.county,
            funder: query.funder,
            topics: query.topics,
            hasCapacity: query.hasCapacity,
            startBefore: query.startBefore,
            startAfter: query.startAfter,
            cursor: query.cursor ?? undefined,
            limit: query.limit ?? 20,
          },
        }),
      ),
    staleTime: 5 * 60_000,
  });
}

export function useTrainingPrograms(query: TrainingQuery = {}) {
  return useQuery(trainingOptions(query));
}
export function useTrainingProgramsSuspense(query: TrainingQuery = {}) {
  return useSuspenseQuery(trainingOptions(query));
}

function programOptions(slug: string) {
  return queryOptions({
    queryKey: ['training', 'program', slug] as const,
    queryFn: async (): Promise<ProgramDetailResponse | null> => {
      const res = await apiClient().get<ProgramDetailResponse>(
        `/v1/training/${encodeURIComponent(slug)}`,
        { handleErrorInline: true },
      );
      if (!res.ok) return null;
      return res.data;
    },
    staleTime: 5 * 60_000,
  });
}

export function useProgramSuspense(slug: string) {
  return useSuspenseQuery(programOptions(slug));
}

function enrollmentsOptions(status: 'all' | 'upcoming' | 'completed' | 'dropped') {
  return queryOptions({
    queryKey: ['enrollments', status] as const,
    queryFn: async (): Promise<EnrollmentListItem[]> => {
      const data = unwrap(
        await apiClient().get<{ enrollments: EnrollmentListItem[] }>(
          '/v1/me/enrollments',
          { query: status === 'all' ? {} : { status } },
        ),
      );
      return data.enrollments;
    },
    staleTime: 5 * 60_000,
  });
}

export function useEnrollmentsSuspense(
  status: 'all' | 'upcoming' | 'completed' | 'dropped' = 'all',
) {
  return useSuspenseQuery(enrollmentsOptions(status));
}
