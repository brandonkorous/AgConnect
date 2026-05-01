'use client';

import { useEffect, useState } from 'react';

type BeforeInstallPromptEvent = Event & {
  readonly platforms: string[];
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
};

const STORAGE_KEY = 'pwa.install.dismissed';

export type InstallPromptCopy = {
  title: string;
  body: string;
  cta: string;
  later: string;
};

export function InstallPrompt({ copy }: { copy: InstallPromptCopy }) {
  const [evt, setEvt] = useState<BeforeInstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [standalone, setStandalone] = useState(false);

  useEffect(() => {
    setDismissed(typeof window !== 'undefined' && window.localStorage.getItem(STORAGE_KEY) === '1');
    if (typeof window !== 'undefined') {
      setStandalone(window.matchMedia('(display-mode: standalone)').matches);
    }
    const handler = (e: Event) => {
      e.preventDefault();
      setEvt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  if (!evt || dismissed || standalone) return null;

  return (
    <div className="bg-base-200 border-base-300 fixed bottom-4 left-1/2 z-40 w-[min(28rem,calc(100vw-2rem))] -translate-x-1/2 rounded-2xl border p-4 shadow-md">
      <h3 className="text-base-content font-serif text-base font-medium">{copy.title}</h3>
      <p className="text-base-content/80 mt-1 text-sm">{copy.body}</p>
      <div className="mt-3 flex justify-end gap-2">
        <button
          type="button"
          className="btn btn-ghost btn-sm"
          onClick={() => {
            window.localStorage.setItem(STORAGE_KEY, '1');
            setDismissed(true);
          }}
        >
          {copy.later}
        </button>
        <button
          type="button"
          className="btn btn-primary btn-sm"
          onClick={async () => {
            try {
              await evt.prompt();
            } finally {
              setEvt(null);
            }
          }}
        >
          {copy.cta}
        </button>
      </div>
    </div>
  );
}
