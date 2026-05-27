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
