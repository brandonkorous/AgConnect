'use client';

import { useEffect } from 'react';
import { pushToast } from '../toast/singleton';
import type { ToastInput } from '../toast/types';

export type SwCopy = {
  updateTitle: string;
  updateDescription: string;
  updateCta: string;
};

export function ServiceWorkerProvider({
  scriptUrl = '/sw.js',
  scope = '/',
  copy,
  enabled = true,
}: {
  scriptUrl?: string;
  scope?: string;
  copy: SwCopy;
  enabled?: boolean;
}) {
  useEffect(() => {
    if (!enabled || typeof window === 'undefined') return;
    if (!('serviceWorker' in navigator)) return;

    let cancelled = false;

    const onLoad = async () => {
      try {
        const reg = await navigator.serviceWorker.register(scriptUrl, { scope });
        if (cancelled) return;

        const notifyUpdate = (waiting: ServiceWorker | null) => {
          if (!waiting) return;
          const update: ToastInput = {
            variant: 'info',
            title: copy.updateTitle,
            description: copy.updateDescription,
            sticky: true,
            dedupeKey: 'sw-update',
            action: {
              label: copy.updateCta,
              onClick: () => {
                waiting.postMessage({ type: 'SKIP_WAITING' });
                window.location.reload();
              },
            },
          };
          pushToast(update);
        };

        if (reg.waiting) notifyUpdate(reg.waiting);
        reg.addEventListener('updatefound', () => {
          const installing = reg.installing;
          if (!installing) return;
          installing.addEventListener('statechange', () => {
            if (installing.state === 'installed' && navigator.serviceWorker.controller) {
              notifyUpdate(installing);
            }
          });
        });
      } catch (e) {
        console.warn('[sw] registration failed', e);
      }
    };

    if (document.readyState === 'complete') {
      void onLoad();
    } else {
      window.addEventListener('load', () => void onLoad(), { once: true });
    }

    return () => {
      cancelled = true;
    };
  }, [scriptUrl, scope, copy.updateTitle, copy.updateDescription, copy.updateCta, enabled]);

  return null;
}
