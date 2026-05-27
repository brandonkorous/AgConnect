'use client';

import { useQuery, useSuspenseQuery, queryOptions } from '@tanstack/react-query';
import { apiClient } from '../client';
import { unwrap } from '../unwrap';
import { qk } from '../query-keys';

export type AppStatus = 'applied' | 'reviewed' | 'hired' | 'rejected' | 'withdrawn';

export type ApplicationListItem = {
  id: string;
  status: AppStatus;
  wageOffered: number | null;
  workerNote: string | null;
  appliedAt: string;
  reviewedAt: string | null;
  hiredAt: string | null;
  rejectedAt: string | null;
  withdrawnAt: string | null;
  startDate: string | null;
  countyAtApply: string | null;
  skillsAtApply: string[];
  job: {
    id: string;
    seoSlug: string;
    titleEn: string;
    titleEs: string;
    county: string;
    wageMin: number;
    wageMax: number;
    startDate: string;
    employerName: string;
  };
};

export type ApplicationsPage = {
  applications: ApplicationListItem[];
  nextCursor: string | null;
};

export type ApplicationsStatusFilter = 'all' | 'active' | 'hired' | 'closed';

export type ApplicationDetail = {
  application: ApplicationListItem;
  job: {
    id: string;
    seoSlug: string;
    titleEn: string;
    titleEs: string;
    descriptionEn: string;
    descriptionEs: string;
    county: string;
    wageMin: number;
    wageMax: number;
    startDate: string;
    endDate: string | null;
    status: string;
  };
  events: {
    id: string;
    fromStatus: string | null;
    toStatus: string;
    actorRole: string;
    metadata: unknown;
    createdAt: string;
  }[];
  employer: {
    id: string;
    name: string;
    phone: string | null;
    email: string | null;
  };
};

function applicationsOptions(status: ApplicationsStatusFilter) {
  return queryOptions({
    queryKey: [...qk.applications(), status] as const,
    queryFn: async (): Promise<ApplicationsPage> =>
      unwrap(
        await apiClient().get<ApplicationsPage>('/v1/applications', {
          query: {
            ...(status !== 'all' ? { status } : {}),
            limit: 50,
          },
        }),
      ),
    staleTime: 60_000,
  });
}

export function useApplications(status: ApplicationsStatusFilter = 'all') {
  return useQuery(applicationsOptions(status));
}
export function useApplicationsSuspense(status: ApplicationsStatusFilter = 'all') {
  return useSuspenseQuery(applicationsOptions(status));
}

function applicationOptions(id: string) {
  return queryOptions({
    queryKey: [...qk.applications(), 'detail', id] as const,
    queryFn: async (): Promise<ApplicationDetail> =>
      unwrap(
        await apiClient().get<ApplicationDetail>(`/v1/applications/${id}`),
      ),
    staleTime: 30_000,
  });
}

export function useApplication(id: string) {
  return useQuery(applicationOptions(id));
}
export function useApplicationSuspense(id: string) {
  return useSuspenseQuery(applicationOptions(id));
}
