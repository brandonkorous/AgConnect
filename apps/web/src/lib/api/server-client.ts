import 'server-only';
import { auth } from '@clerk/nextjs/server';
import { getLocale } from 'next-intl/server';
import { createApiClient, type ApiClient } from '@agconn/api-client/client';

const BASE_URL =
  process.env.API_BASE_URL?.replace(/\/$/, '') ??
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, '') ??
  'http://localhost:3001';

const clerkConfigured = Boolean(
  process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY && process.env.CLERK_SECRET_KEY,
);

export async function getServerApiClient(): Promise<ApiClient> {
  const locale = (await getLocale().catch(() => 'en')) as 'en' | 'es';
  const token = clerkConfigured ? await getToken() : null;
  return createApiClient({
    baseUrl: BASE_URL,
    getLocale: () => (locale === 'es' ? 'es' : 'en'),
    getSession: () => token,
  });
}

async function getToken(): Promise<string | null> {
  try {
    const session = await auth();
    return (await session.getToken()) ?? null;
  } catch {
    return null;
  }
}

export type Unwrap<T> = T extends { ok: true; data: infer D } ? D : never;
