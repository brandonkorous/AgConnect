'use client';

import { createApiClient, type ApiClient } from '@agconn/api-client/client';
import { tokenStore } from './token-store';

let _client: ApiClient | null = null;
let _currentLocale: 'en' | 'es' = 'en';
let _activeEmployerId: string | null = null;

async function getSessionToken(): Promise<string | null> {
  const fromStore = tokenStore.get();
  if (fromStore) return fromStore();
  if (typeof window === 'undefined') return null;
  try {
    type ClerkLike = { session?: { getToken?: () => Promise<string | null> } };
    const w = window as unknown as { Clerk?: ClerkLike };
    return (await w.Clerk?.session?.getToken?.()) ?? null;
  } catch {
    return null;
  }
}

function getExtraHeaders(): Record<string, string> | undefined {
  return _activeEmployerId ? { 'X-Employer-Id': _activeEmployerId } : undefined;
}

function initClient(): ApiClient {
  const baseUrl =
    process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, '') ?? 'http://localhost:3001';
  return createApiClient({
    baseUrl,
    getLocale: () => _currentLocale,
    getSession: getSessionToken,
    getHeaders: getExtraHeaders,
  });
}

// Singleton access used by hooks.
export function apiClient(): ApiClient {
  if (!_client) _client = initClient();
  return _client;
}

// Setters used by bridge components inside <AppProviders>.
export function setApiClientLocale(locale: 'en' | 'es'): void {
  _currentLocale = locale;
}
export function setApiClientActiveEmployer(id: string | null): void {
  _activeEmployerId = id;
}

// Backwards-compat shim used by ~20 existing client components.
// Migrating callers to `apiClient()` happens in PR 5 (cleanup).
export function getApiClient(locale: 'en' | 'es'): ApiClient {
  setApiClientLocale(locale);
  return apiClient();
}
