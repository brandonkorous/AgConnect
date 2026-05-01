'use client';

import { createApiClient, type ApiClient } from '@agconn/api-client/client';

let _client: ApiClient | null = null;

export function getApiClient(locale: 'en' | 'es'): ApiClient {
  if (_client) return _client;
  const baseUrl =
    process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, '') ?? 'http://localhost:3001';
  _client = createApiClient({
    baseUrl,
    getLocale: () => locale,
  });
  return _client;
}
