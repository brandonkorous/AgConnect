import 'server-only';
import { auth } from '@clerk/nextjs/server';

// Server-side API client for the admin app. All admin pages call /admin/v1/*
// via this helper — the admin app never touches Prisma directly.
//
// Auth flow:
//   1. Take the Clerk session token via auth().getToken() (admin Clerk instance,
//      since middleware is bound to its keys).
//   2. Forward as Bearer to api; api's clerkAdminAuthMiddleware validates the
//      JWT against the same admin instance.
//   3. Pass the active tenant id (read from the /t/<id>/... URL by the caller)
//      as X-Admin-Tenant-Id so api can pin RLS to that tenant.
//
// Dev/CI fallback: if no Clerk session, fall back to ADMIN_BEARER_TOKEN. Lets
// admin pages render during local dev without a real Clerk login.

const API_BASE = process.env.API_BASE_URL ?? process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:3001';
const ADMIN_BEARER = process.env.ADMIN_BEARER_TOKEN ?? '';

export type AdminApiOk<T> = { ok: true; data: T };
export type AdminApiErr = {
  ok: false;
  error: { code: string; message: string; toast?: 'error' | 'warning' | false };
};
export type AdminApiResponse<T> = AdminApiOk<T> | AdminApiErr;

export type AdminFetchOptions = {
  method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
  body?: unknown;
  query?: Record<string, string | number | boolean | undefined | string[]>;
  tenantId?: string | null;
  headers?: Record<string, string>;
  signal?: AbortSignal;
  raw?: false;
};

export type AdminFetchRawOptions = Omit<AdminFetchOptions, 'raw'> & { raw: true };

function buildUrl(path: string, query?: AdminFetchOptions['query']): string {
  const url = new URL(path.startsWith('/') ? path : `/${path}`, API_BASE);
  if (query) {
    for (const [k, v] of Object.entries(query)) {
      if (v === undefined) continue;
      if (Array.isArray(v)) {
        for (const item of v) url.searchParams.append(k, String(item));
      } else {
        url.searchParams.append(k, String(v));
      }
    }
  }
  return url.toString();
}

async function authHeader(): Promise<string | null> {
  try {
    const session = await auth();
    const token = await session.getToken();
    if (token) return `Bearer ${token}`;
  } catch {
    // No active Clerk context (e.g. local build smoke test). Fall through.
  }
  if (ADMIN_BEARER) return `Bearer ${ADMIN_BEARER}`;
  return null;
}

export async function adminFetch<T>(
  path: string,
  options?: AdminFetchOptions,
): Promise<AdminApiResponse<T>>;
export async function adminFetch(path: string, options: AdminFetchRawOptions): Promise<Response>;
export async function adminFetch<T>(
  path: string,
  options: AdminFetchOptions | AdminFetchRawOptions = {},
): Promise<AdminApiResponse<T> | Response> {
  const url = buildUrl(path, options.query);
  const headers: Record<string, string> = {
    'accept-language': 'en',
    ...(options.headers ?? {}),
  };
  const authz = await authHeader();
  if (authz) headers.authorization = authz;
  if (options.tenantId) headers['x-admin-tenant-id'] = options.tenantId;
  if (options.body !== undefined) headers['content-type'] = 'application/json';

  const res = await fetch(url, {
    method: options.method ?? 'GET',
    headers,
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
    cache: 'no-store',
    signal: options.signal,
  });

  if ('raw' in options && options.raw) return res;

  if (!res.ok && res.status >= 500) {
    return {
      ok: false,
      error: {
        code: 'upstream_error',
        message: `Upstream returned ${res.status}`,
      },
    } as AdminApiErr;
  }

  const json = (await res.json().catch(() => null)) as AdminApiResponse<T> | null;
  if (json && typeof json === 'object' && 'ok' in json) return json;

  return {
    ok: false,
    error: { code: 'internal_error', message: `Unexpected response (HTTP ${res.status})` },
  } as AdminApiErr;
}
