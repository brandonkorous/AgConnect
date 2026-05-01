'use client';

import { useState } from 'react';
import { useLocale } from 'next-intl';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import type { IconDefinition } from '@fortawesome/fontawesome-svg-core';

type Props = {
  path: string;
  label: string;
  icon?: IconDefinition;
  filename: string;
  variant?: 'pill' | 'pill-dark' | 'btn-sm';
};

const BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, '') ?? 'http://localhost:3001';

export function DownloadButton({ path, label, icon, filename, variant = 'pill-dark' }: Props) {
  const locale = useLocale();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function getClerkToken(): Promise<string | null> {
    if (typeof window === 'undefined') return null;
    try {
      type ClerkLike = { session?: { getToken?: () => Promise<string | null> } };
      const w = window as unknown as { Clerk?: ClerkLike };
      const t = await w.Clerk?.session?.getToken?.();
      return t ?? null;
    } catch {
      return null;
    }
  }

  async function download() {
    setBusy(true);
    setError(null);
    try {
      const token = await getClerkToken();
      const res = await fetch(`${BASE_URL}${path}`, {
        method: 'GET',
        headers: {
          ...(token ? { authorization: `Bearer ${token}` } : {}),
          'accept-language': locale,
        },
        credentials: 'include',
      });
      if (!res.ok) {
        setError(`Export failed (${res.status}).`);
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Export failed.');
    } finally {
      setBusy(false);
    }
  }

  const className =
    variant === 'pill-dark'
      ? 'bg-base-content text-base-100 inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold disabled:opacity-50'
      : variant === 'pill'
        ? 'btn btn-sm bg-base-100 border-base-300 rounded-full border font-medium disabled:opacity-50'
        : 'btn btn-sm bg-base-100 border-base-300 border disabled:opacity-50';

  return (
    <div className="inline-flex flex-col items-end">
      <button type="button" onClick={download} disabled={busy} className={className}>
        {icon && <FontAwesomeIcon icon={icon} className="h-3 w-3" />}
        {busy ? '…' : label}
      </button>
      {error && <span className="text-error mt-1 text-[10px]">{error}</span>}
    </div>
  );
}
