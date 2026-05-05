/// <reference lib="WebWorker" />
import { defaultCache } from '@serwist/next/worker';
import {
  Serwist,
  NetworkFirst,
  StaleWhileRevalidate,
  CacheFirst,
  ExpirationPlugin,
  CacheableResponsePlugin,
} from 'serwist';

export {};

declare const self: ServiceWorkerGlobalScope & {
  __SW_MANIFEST: (string | { url: string; revision: string | null })[];
};

// Field Mode is the offline-resilient surface — workers may open it on a bus,
// in a packing house, or with one bar of signal. We give its document
// navigations and the worker-scoped API reads aggressive runtime caching so
// the screens render even when the network is gone.
const fieldRuntimeCaching = [
  {
    matcher: ({ request, url, sameOrigin }: { request: Request; url: URL; sameOrigin: boolean }) =>
      sameOrigin && request.destination === 'document' && /^\/(en|es)\/field(\/|$)/.test(url.pathname),
    handler: new NetworkFirst({
      cacheName: 'field-pages',
      networkTimeoutSeconds: 4,
      plugins: [
        new ExpirationPlugin({ maxEntries: 24, maxAgeSeconds: 24 * 60 * 60 }),
        new CacheableResponsePlugin({ statuses: [0, 200] }),
      ],
    }),
  },
  {
    matcher: ({ url }: { url: URL }) =>
      /\/v1\/me\/(shifts|messages|applications)/.test(url.pathname),
    handler: new StaleWhileRevalidate({
      cacheName: 'field-me-api',
      plugins: [
        new ExpirationPlugin({ maxEntries: 32, maxAgeSeconds: 6 * 60 * 60 }),
        new CacheableResponsePlugin({ statuses: [0, 200] }),
      ],
    }),
  },
  {
    matcher: ({ url }: { url: URL }) => /\/v1\/i18n\/messages/.test(url.pathname),
    handler: new CacheFirst({
      cacheName: 'field-i18n',
      plugins: [
        new ExpirationPlugin({ maxEntries: 4, maxAgeSeconds: 7 * 24 * 60 * 60 }),
        new CacheableResponsePlugin({ statuses: [0, 200] }),
      ],
    }),
  },
];

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: false,
  clientsClaim: false,
  navigationPreload: true,
  runtimeCaching: [...fieldRuntimeCaching, ...defaultCache],
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
