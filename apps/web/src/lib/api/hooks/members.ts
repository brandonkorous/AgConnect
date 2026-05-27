'use client';

import { useQuery, useSuspenseQuery, queryOptions } from '@tanstack/react-query';
import type { MemberView } from '@agconn/schemas';
import { apiClient } from '../client';

export type { MemberView };

export type MembershipView = {
  employerId: string;
  tenantId: string;
  legalName: string;
  roleKey: string;
  permissions: string[];
  scopeQualifier: string | null;
};

export type MembershipsResult = {
  activeEmployerId: string | null;
  memberships: MembershipView[];
};

async function safeGet<T>(path: string, fallback: T): Promise<T> {
  const res = await apiClient().get<T>(path, { handleErrorInline: true });
  if (!res.ok) return fallback;
  return res.data;
}

const membersOptions = queryOptions({
  queryKey: ['employer', 'members'] as const,
  queryFn: async (): Promise<MemberView[]> => {
    const data = await safeGet<{ members: MemberView[] }>('/v1/employer/members', {
      members: [],
    });
    return data.members;
  },
  staleTime: 60_000,
});

export function useMembers() {
  return useQuery(membersOptions);
}
export function useMembersSuspense() {
  return useSuspenseQuery(membersOptions);
}

const myMembershipsOptions = queryOptions({
  queryKey: ['me', 'employer-memberships'] as const,
  queryFn: async (): Promise<MembershipsResult> =>
    safeGet<MembershipsResult>('/v1/me/employer-memberships', {
      activeEmployerId: null,
      memberships: [],
    }),
  staleTime: 5 * 60_000,
});

export function useMyMemberships() {
  return useQuery(myMembershipsOptions);
}
export function useMyMembershipsSuspense() {
  return useSuspenseQuery(myMembershipsOptions);
}
