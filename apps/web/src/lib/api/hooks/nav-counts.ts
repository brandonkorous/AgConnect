'use client';

import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../client';
import { unwrap } from '../unwrap';
import { qk } from '../query-keys';
import type { ApplicationsPage } from './applications';
import type { JobsPage } from './jobs';
import type { ThreadList } from './messages';
import type { SavedSearch } from './saved-searches';

// Worker shell nav counts. Aggregated client-side via Promise.all of the
// four sources, then reduced to the badge counts the sidebar needs.
//
// This is a *composite* hook — it depends on the same endpoints as their
// dedicated hooks, but TanStack Query dedupes across the cache by key. The
// returned promise is a single cache entry; the individual fetches are
// shared with sibling consumers (e.g. WorkerKpiRow calling useApplications).

export type WorkerNavCounts = {
  browse_jobs: number;
  my_applications: number;
  messages: number;
  saved_searches: number;
};

export function useWorkerNavCounts() {
  return useQuery({
    queryKey: qk.myNavCounts(),
    queryFn: async (): Promise<WorkerNavCounts> => {
      const client = apiClient();
      const [jobs, apps, threads, saved] = await Promise.all([
        client.get<JobsPage>('/v1/jobs', { query: { limit: 1 } }).then(unwrap)
          .catch(() => null),
        client.get<ApplicationsPage>('/v1/applications', { query: { limit: 50 } })
          .then(unwrap)
          .catch(() => null),
        client.get<ThreadList>('/v1/me/messages').then(unwrap).catch(() => null),
        client.get<{ savedSearches: SavedSearch[] }>('/v1/saved-searches')
          .then(unwrap)
          .catch(() => null),
      ]);

      const myApplications =
        apps?.applications.filter(
          (a) => a.status === 'applied' || a.status === 'reviewed',
        ).length ?? 0;

      return {
        browse_jobs: jobs?.totalCount ?? jobs?.jobs.length ?? 0,
        my_applications: myApplications,
        messages: threads?.totalUnread ?? 0,
        saved_searches: saved?.savedSearches.length ?? 0,
      };
    },
    staleTime: 60_000,
  });
}
