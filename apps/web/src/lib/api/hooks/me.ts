'use client';

import { useQuery } from '@tanstack/react-query';
import type { UserRole } from '@agconn/auth';
import { apiClient } from '../client';
import { unwrap } from '../unwrap';
import { qk } from '../query-keys';

export type Me = {
  user: { id: string; role: UserRole; onboarded: boolean };
  tenant: { id: string; slug: string; name: string } | null;
};

export function useMe() {
  return useQuery({
    queryKey: qk.me(),
    queryFn: async (): Promise<Me> => unwrap(await apiClient().get<Me>('/v1/me')),
    staleTime: 5 * 60_000,
    gcTime: 30 * 60_000,
  });
}
