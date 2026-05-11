'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBookmark, faXmark, faPlus } from '@fortawesome/free-solid-svg-icons';

type SavedView = { name: string; qs: string };

type Props = {
  // Key under which views are persisted. One key per page. Examples: "workers",
  // "applications", "audit", "sms.logs", "sms.optouts".
  viewKey: string;
  // Keys present here but absent from the URL still count as "current". Use it
  // for surfaces where one query param represents the active tab, so saving
  // "Active jobs" while on the "Closed jobs" tab does the right thing.
  alwaysInclude?: string[];
};

const STORAGE_KEY = (k: string) => `agconn-admin:saved-views:${k}`;

function loadViews(key: string): SavedView[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY(key));
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (v): v is SavedView =>
        typeof v === 'object' && v !== null && typeof (v as SavedView).name === 'string' && typeof (v as SavedView).qs === 'string',
    );
  } catch {
    return [];
  }
}

function storeViews(key: string, views: SavedView[]) {
  try {
    window.localStorage.setItem(STORAGE_KEY(key), JSON.stringify(views));
  } catch {
    // Quota exceeded or private mode — silently ignore. Saved views are a
    // convenience, not a contract.
  }
}

export function SavedViews({ viewKey, alwaysInclude }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [views, setViews] = useState<SavedView[]>([]);
  const [adding, setAdding] = useState(false);
  const [draftName, setDraftName] = useState('');

  useEffect(() => {
    setViews(loadViews(viewKey));
  }, [viewKey]);

  const currentQs = (() => {
    const sp = new URLSearchParams(searchParams.toString());
    for (const k of alwaysInclude ?? []) {
      if (!sp.has(k)) sp.set(k, '');
    }
    // Drop empty values so saved view matching works even if the form submits
    // empty inputs.
    const cleaned = new URLSearchParams();
    for (const [k, v] of sp) if (v !== '') cleaned.set(k, v);
    cleaned.sort();
    return cleaned.toString();
  })();

  const activeView = views.find((v) => v.qs === currentQs);

  const applyView = useCallback(
    (qs: string) => {
      router.push(qs ? `${pathname}?${qs}` : pathname);
    },
    [router, pathname],
  );

  const saveCurrent = useCallback(() => {
    const name = draftName.trim();
    if (!name) return;
    const next = [...views.filter((v) => v.name !== name), { name, qs: currentQs }];
    setViews(next);
    storeViews(viewKey, next);
    setAdding(false);
    setDraftName('');
  }, [draftName, views, currentQs, viewKey]);

  const removeView = useCallback(
    (name: string) => {
      const next = views.filter((v) => v.name !== name);
      setViews(next);
      storeViews(viewKey, next);
    },
    [views, viewKey],
  );

  if (views.length === 0 && !adding) {
    return (
      <div className="flex items-center gap-2 text-xs">
        <FontAwesomeIcon icon={faBookmark} className="h-3 w-3 opacity-40" />
        <button
          type="button"
          onClick={() => setAdding(true)}
          className="link link-hover text-base-content/60"
        >
          Save current filters as a view
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2 text-xs">
      <FontAwesomeIcon icon={faBookmark} className="h-3 w-3 opacity-50" />
      {views.map((v) => (
        <span
          key={v.name}
          className={`group inline-flex items-center gap-1 rounded-full border px-3 py-1 ${
            activeView?.name === v.name
              ? 'border-primary bg-primary/10 text-primary'
              : 'border-base-300 hover:bg-base-200'
          }`}
        >
          <button type="button" onClick={() => applyView(v.qs)} className="font-medium">
            {v.name}
          </button>
          <button
            type="button"
            onClick={() => removeView(v.name)}
            className="text-base-content/40 hover:text-error opacity-0 transition-opacity group-hover:opacity-100"
            aria-label={`Remove ${v.name}`}
          >
            <FontAwesomeIcon icon={faXmark} className="h-2.5 w-2.5" />
          </button>
        </span>
      ))}
      {adding ? (
        <div className="bg-base-100 border-base-300 inline-flex items-center gap-1 rounded-full border py-0.5 pl-2 pr-0.5">
          <input
            autoFocus
            value={draftName}
            onChange={(e) => setDraftName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') saveCurrent();
              else if (e.key === 'Escape') {
                setAdding(false);
                setDraftName('');
              }
            }}
            placeholder="view name"
            className="bg-transparent text-xs outline-none"
            size={12}
          />
          <button type="button" onClick={saveCurrent} className="btn btn-xs btn-primary rounded-full">
            Save
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setAdding(true)}
          disabled={!!activeView}
          className="text-base-content/60 hover:text-base-content inline-flex items-center gap-1 disabled:opacity-30"
        >
          <FontAwesomeIcon icon={faPlus} className="h-2.5 w-2.5" />
          {activeView ? 'Already saved' : 'Save current'}
        </button>
      )}
    </div>
  );
}
