'use client';

import { useEffect, useRef, useState } from 'react';
import { autosaveJob } from './api';
import type { JobFormState } from './types';
import { toApiBody } from './types';

const DEBOUNCE_MS = 30_000;

type Status = 'idle' | 'pending' | 'saving' | 'saved' | 'error';

type Args = {
  enabled: boolean;
  jobId: string | null;
  locale: string;
  state: JobFormState;
};

// Debounced 30s autosave for drafts. Skips active jobs (those need explicit
// Save Draft / Publish so we can show the re-notify banner).
export function useAutosave({ enabled, jobId, locale, state }: Args) {
  const [status, setStatus] = useState<Status>('idle');
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastBody = useRef<string>('');

  useEffect(() => {
    if (!enabled || !jobId) return;
    const body = JSON.stringify(toApiBody(state));
    if (body === lastBody.current) return; // no-op when nothing changed
    setStatus('pending');
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(async () => {
      setStatus('saving');
      const res = await autosaveJob(locale, jobId, JSON.parse(body));
      if (res.ok) {
        lastBody.current = body;
        setSavedAt(res.autosavedAt);
        setStatus('saved');
      } else {
        setStatus('error');
      }
    }, DEBOUNCE_MS);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [enabled, jobId, locale, state]);

  return { status, savedAt } as const;
}
