'use client';

import { createContext, useContext } from 'react';
import type { ReactNode } from 'react';
import { useMe, type Me } from '@/lib/api/hooks/me';

// RoleContext is a thin wrapper around useMe(). Cache stays the source of
// truth — no duplicate state, no drift. Components that need just the role
// or onboarded flag can read here instead of pulling the full Me object
// through useQuery every time.

type RoleSnapshot = {
  me: Me | undefined;
  role: Me['user']['role'] | undefined;
  onboarded: boolean;
  isLoading: boolean;
};

const RoleContext = createContext<RoleSnapshot | null>(null);

export function RoleProvider({ children }: { children: ReactNode }) {
  const { data: me, isPending } = useMe();
  const value: RoleSnapshot = {
    me,
    role: me?.user.role,
    onboarded: me?.user.onboarded ?? false,
    isLoading: isPending,
  };
  return <RoleContext.Provider value={value}>{children}</RoleContext.Provider>;
}

export function useRole(): RoleSnapshot {
  const ctx = useContext(RoleContext);
  if (!ctx) throw new Error('useRole must be used inside <RoleProvider>');
  return ctx;
}
