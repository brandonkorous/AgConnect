'use client';

import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { setApiClientActiveEmployer } from '@/lib/api/client';

// Multi-employer members select which employer they're acting as. Persisted
// to localStorage AND mirrored to a cookie so the proxy / SSR pages can see
// it. The API validates the value against the caller's membership set;
// invalid values fall back server-side, so client-state staleness can't
// escalate into wrong-tenant writes.

const STORAGE_KEY = 'agconn_active_employer';
const COOKIE_KEY = 'agconn_active_employer';

type Ctx = {
  activeEmployerId: string | null;
  setActiveEmployer: (id: string | null) => void;
};

const ActiveEmployerContext = createContext<Ctx | null>(null);

function readInitial(): string | null {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem(STORAGE_KEY);
}

function writeCookie(id: string | null) {
  if (typeof document === 'undefined') return;
  if (id) {
    document.cookie = `${COOKIE_KEY}=${id}; path=/; SameSite=Lax`;
  } else {
    document.cookie = `${COOKIE_KEY}=; path=/; Max-Age=0; SameSite=Lax`;
  }
}

export function ActiveEmployerProvider({ children }: { children: ReactNode }) {
  const [activeEmployerId, setIdState] = useState<string | null>(readInitial);

  useEffect(() => {
    setApiClientActiveEmployer(activeEmployerId);
    writeCookie(activeEmployerId);
    if (typeof window !== 'undefined') {
      if (activeEmployerId) window.localStorage.setItem(STORAGE_KEY, activeEmployerId);
      else window.localStorage.removeItem(STORAGE_KEY);
    }
  }, [activeEmployerId]);

  const setActiveEmployer = useCallback((id: string | null) => setIdState(id), []);

  return (
    <ActiveEmployerContext.Provider value={{ activeEmployerId, setActiveEmployer }}>
      {children}
    </ActiveEmployerContext.Provider>
  );
}

export function useActiveEmployer(): Ctx {
  const ctx = useContext(ActiveEmployerContext);
  if (!ctx) throw new Error('useActiveEmployer must be used inside <ActiveEmployerProvider>');
  return ctx;
}
