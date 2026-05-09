'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  CONSENT_STORAGE_KEY,
  CONSENT_VERSION,
  defaultDenyChoices,
  type ConsentChoices,
  type ConsentRecord,
} from './types';

type ConsentApi = {
  choices: ConsentChoices;
  hasDecided: boolean;
  gpcActive: boolean;
  setChoices: (next: ConsentChoices) => void;
  acceptAll: () => void;
  rejectNonEssential: () => void;
  reset: () => void;
};

const detectGpc = (): boolean => {
  if (typeof window === 'undefined') return false;
  type GpcNav = Navigator & { globalPrivacyControl?: boolean };
  return Boolean((window.navigator as GpcNav).globalPrivacyControl);
};

const ConsentContext = createContext<ConsentApi | null>(null);

const readRecord = (): ConsentRecord | null => {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(CONSENT_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ConsentRecord;
    if (parsed.version !== CONSENT_VERSION) return null;
    return parsed;
  } catch {
    return null;
  }
};

const writeRecord = (choices: ConsentChoices): ConsentRecord => {
  const record: ConsentRecord = { version: CONSENT_VERSION, ts: Date.now(), choices };
  if (typeof window !== 'undefined') {
    try {
      window.localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(record));
      window.dispatchEvent(new CustomEvent('agconn:consent-changed', { detail: record }));
    } catch {
      // localStorage may be unavailable (Safari private mode); fall through
    }
  }
  return record;
};

export function ConsentProvider({ children }: { children: React.ReactNode }) {
  const [record, setRecord] = useState<ConsentRecord | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [gpcActive, setGpcActive] = useState(false);

  useEffect(() => {
    setRecord(readRecord());
    setGpcActive(detectGpc());
    setHydrated(true);
    const onChange = (e: Event) => {
      const detail = (e as CustomEvent<ConsentRecord>).detail;
      if (detail) setRecord(detail);
    };
    window.addEventListener('agconn:consent-changed', onChange);
    return () => window.removeEventListener('agconn:consent-changed', onChange);
  }, []);

  const setChoices = useCallback((next: ConsentChoices) => {
    setRecord(writeRecord(next));
  }, []);

  const acceptAll = useCallback(() => {
    setRecord(writeRecord({ essential: true, functional: true, analytics: true }));
  }, []);

  const rejectNonEssential = useCallback(() => {
    setRecord(writeRecord(defaultDenyChoices));
  }, []);

  const reset = useCallback(() => {
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(CONSENT_STORAGE_KEY);
      window.dispatchEvent(new CustomEvent('agconn:consent-changed', { detail: null }));
    }
    setRecord(null);
  }, []);

  const api = useMemo<ConsentApi>(
    () => {
      const stored = record?.choices ?? defaultDenyChoices;
      const choices: ConsentChoices = gpcActive
        ? { ...stored, analytics: false }
        : stored;
      return {
        choices,
        hasDecided: hydrated && (record !== null || gpcActive),
        gpcActive,
        setChoices,
        acceptAll,
        rejectNonEssential,
        reset,
      };
    },
    [record, hydrated, gpcActive, setChoices, acceptAll, rejectNonEssential, reset],
  );

  return <ConsentContext.Provider value={api}>{children}</ConsentContext.Provider>;
}

export const useConsent = (): ConsentApi => {
  const c = useContext(ConsentContext);
  if (!c) throw new Error('useConsent called outside <ConsentProvider>');
  return c;
};
