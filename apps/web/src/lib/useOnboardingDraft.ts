'use client';

import { useEffect, useRef, useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { clearDraft, getDraft, setDraft } from './onboarding-draft';

const SAVE_DEBOUNCE_MS = 350;

// React hook for IndexedDB-backed onboarding step state. Loads on mount,
// debounces writes on change, and exposes `clear()` so the form can wipe its
// draft when the API accepts the step.
export function useOnboardingDraft<T>(
  step: string,
  initial: T,
): {
  value: T;
  setValue: (next: T | ((prev: T) => T)) => void;
  loaded: boolean;
  clear: () => Promise<void>;
} {
  const { user } = useUser();
  const scope = user?.id ?? 'anonymous';
  const [value, setLocal] = useState<T>(initial);
  const [loaded, setLoaded] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const draft = await getDraft<T>(scope, step);
      if (cancelled) return;
      if (draft !== null) setLocal(draft);
      setLoaded(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [scope, step]);

  function setValue(next: T | ((prev: T) => T)) {
    setLocal((prev) => {
      const v = typeof next === 'function' ? (next as (p: T) => T)(prev) : next;
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => {
        void setDraft(scope, step, v);
      }, SAVE_DEBOUNCE_MS);
      return v;
    });
  }

  async function clear() {
    if (timer.current) clearTimeout(timer.current);
    await clearDraft(scope, step);
  }

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  return { value, setValue, loaded, clear };
}
