/// <reference lib="WebWorker" />
import { defaultCache } from '@serwist/next/worker';
import { Serwist } from 'serwist';

export {};

declare const self: ServiceWorkerGlobalScope & {
  __SW_MANIFEST: (string | { url: string; revision: string | null })[];
};

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: false,
  clientsClaim: false,
  navigationPreload: true,
  runtimeCaching: defaultCache,
  fallbacks: {
    entries: [
      {
        url: '/en/offline',
        matcher: ({ request }) => request.destination === 'document',
      },
      {
        url: '/es/offline',
        matcher: ({ request }) => request.destination === 'document',
      },
    ],
  },
});

self.addEventListener('message', (event: ExtendableMessageEvent) => {
  const data = event.data as { type?: string } | null;
  if (data?.type === 'SKIP_WAITING') {
    void self.skipWaiting();
  }
});

serwist.addEventListeners();
