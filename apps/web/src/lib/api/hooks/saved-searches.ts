'use client';

import { useQuery, useSuspenseQuery, queryOptions } from '@tanstack/react-query';
import { apiClient } from '../client';
import { unwrap } from '../unwrap';
import { qk } from '../query-keys';

export type SavedSearch = {
  id: string;
  name: string | null;
  filters: {
    county?: string[];
    skills?: string[];
    wageMin?: number;
    wageMax?: number;
    startBefore?: string;
    startAfter?: string;
    housing?: boolean;
    transport?: boolean;
    noExperience?: boolean;
  };
  alertChannel: 'sms' | 'email' | 'both' | 'none';
  alertActive: boolean;
  lastNotifiedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

const savedSearchesOptions = queryOptions({
  queryKey: qk.savedSearches(),
  queryFn: async (): Promise<SavedSearch[]> => {
    const data = unwrap(
      await apiClient().get<{ savedSearches: SavedSearch[] }>('/v1/saved-searches'),
    );
    return data.savedSearches;
  },
  staleTime: 5 * 60_000,
});

export function useSavedSearches() {
  return useQuery(savedSearchesOptions);
}
export function useSavedSearchesSuspense() {
  return useSuspenseQuery(savedSearchesOptions);
}
