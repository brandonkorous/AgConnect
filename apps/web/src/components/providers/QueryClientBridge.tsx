'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { useState } from 'react';
import type { ReactNode } from 'react';

// Holds the singleton QueryClient for the browser session. Created lazily on
// first render via useState so it survives hot reload + parallel renders
// without re-creating the cache.
//
// Defaults:
// - staleTime 60s: avoids re-fetch storms on rapid component remounts
// - refetchOnWindowFocus false: field workers on flaky connections don't
//   want a refetch every time they tab away and back
// - retry 1: one retry on transient failure; offline path handled separately
// - gcTime 5m: keep cached data 5 minutes after last consumer unmounts

function createClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60_000,
        gcTime: 300_000,
        refetchOnWindowFocus: false,
        retry: 1,
      },
      mutations: {
        retry: 0,
      },
    },
  });
}

export function QueryClientBridge({ children }: { children: ReactNode }) {
  const [client] = useState(createClient);
  return (
    <QueryClientProvider client={client}>
      {children}
      {process.env.NODE_ENV === 'development' && (
        <ReactQueryDevtools initialIsOpen={false} buttonPosition="bottom-left" />
      )}
    </QueryClientProvider>
  );
}
