'use client';

import type { ReactNode } from 'react';
import { QueryClientBridge } from './QueryClientBridge';
import { ClerkTokenBridge } from './ClerkTokenBridge';
import { LocaleBridge } from './LocaleBridge';
import { ActiveEmployerProvider } from '@/lib/context/active-employer-context';

// Composes the client-first provider tree. Mounted inside AppShellProviders
// in [locale]/layout.tsx, INSIDE <ClerkProvider> and <NextIntlClientProvider>
// (so the bridges can read auth + locale).
//
// Toast lives upstream via @agconn/ui's <ToastProvider> in AppShellProviders.
// Don't add another toast layer here.
//
// Order:
// 1. QueryClientBridge — needed by every hook downstream
// 2. ClerkTokenBridge / LocaleBridge — render null; populate api client config
// 3. ActiveEmployerProvider — depends on api client + provides employer ctx

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <QueryClientBridge>
      <ClerkTokenBridge />
      <LocaleBridge />
      <ActiveEmployerProvider>{children}</ActiveEmployerProvider>
    </QueryClientBridge>
  );
}
