'use client';

import { createApiClient, type ApiClient } from '@agconn/api-client/client';

let _client: ApiClient | null = null;

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

export function getApiClient(locale: 'en' | 'es'): ApiClient {
  if (_client) return _client;
  const baseUrl =
    process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, '') ?? 'http://localhost:3001';
  _client = createApiClient({
    baseUrl,
    getLocale: () => locale,
    getSession: () => getClerkToken(),
  });
  return _client;
}
