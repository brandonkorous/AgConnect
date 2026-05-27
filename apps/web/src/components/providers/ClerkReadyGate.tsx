'use client';

import { useAuth } from '@clerk/nextjs';
import type { ReactNode } from 'react';

// Holds back children until Clerk has finished bootstrapping. Without this,
// useSuspenseQuery hooks inside the shell fire before ClerkTokenBridge has
// populated tokenStore, so the api client sends requests without a Bearer
// header and the API answers 401. With one retry (see QueryClientBridge),
// the race usually lost and the dashboard stayed in an error state. Mount
// this at the top of every authenticated shell.

export function ClerkReadyGate({
  children,
  fallback,
}: {
  children: ReactNode;
  fallback: ReactNode;
}) {
  const { isLoaded } = useAuth();
  if (!isLoaded) return <>{fallback}</>;
  return <>{children}</>;
}
