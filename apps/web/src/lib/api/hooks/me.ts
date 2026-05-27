'use client';

import { useQuery, useSuspenseQuery, queryOptions } from '@tanstack/react-query';
import type { UserRole } from '@/lib/auth/role-client';
import { apiClient } from '../client';
import { unwrap } from '../unwrap';
import { qk } from '../query-keys';

export type Me = {
  user: { id: string; role: UserRole; onboarded: boolean };
  tenant: { id: string; slug: string; name: string } | null;
};

const meOptions = queryOptions({
  queryKey: qk.me(),
  queryFn: async (): Promise<Me> => unwrap(await apiClient().get<Me>('/v1/me')),
  staleTime: 5 * 60_000,
  gcTime: 30 * 60_000,
});

export function useMe() {
  return useQuery(meOptions);
}
export function useMeSuspense() {
  return useSuspenseQuery(meOptions);
}
