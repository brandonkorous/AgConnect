'use client';

import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister';
import { persistQueryClient } from '@tanstack/react-query-persist-client';

// Persists the existing react-query cache to localStorage for /field routes
// only. Field workers need fast, offline-tolerant access to today's shift,
// pinned threads, and recent applications even on flaky cell coverage.
//
// Why localStorage (sync) not IndexedDB (async): the field cache is small
// (single-user, few KB), and sync persisters compose with the global
// QueryClient already mounted by QueryClientBridge. An async persister would
// require a separate provider tree, which would partition the cache.
//
// Key namespace agconn-field-cache-v1 lets us invalidate by version bump.

const CACHE_KEY = 'agconn-field-cache-v1';
const MAX_AGE_MS = 1000 * 60 * 60 * 24 * 7;

export function FieldOfflinePersistor() {
  const queryClient = useQueryClient();
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const persister = createSyncStoragePersister({
      storage: window.localStorage,
      key: CACHE_KEY,
    });
    const [unsubscribe] = persistQueryClient({
      queryClient,
      persister,
      maxAge: MAX_AGE_MS,
    });
    return () => {
      unsubscribe();
    };
  }, [queryClient]);
  return null;
}
