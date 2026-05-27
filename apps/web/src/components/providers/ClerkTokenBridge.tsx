'use client';

import { useEffect } from 'react';
import { useAuth } from '@clerk/nextjs';
import { tokenStore } from '@/lib/api/token-store';

// Populates the api client's token store with a stable getter from Clerk's
// useAuth hook. Once mounted (and isLoaded), every api request reads the
// token via Clerk's internally-cached path instead of going through the
// `window.Clerk.session.getToken()` global handshake.
//
// Mounted exactly once inside <ClerkProvider>. Renders nothing.

export function ClerkTokenBridge() {
  const { isLoaded, getToken } = useAuth();

  useEffect(() => {
    if (!isLoaded) return;
    tokenStore.set(() => getToken());
    return () => tokenStore.set(null);
  }, [isLoaded, getToken]);

  return null;
}
