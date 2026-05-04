import 'server-only';
import { unstable_cache } from 'next/cache';

export type Locale = 'en' | 'es';
export type Messages = Record<string, unknown>;

const BASE_URL =
  process.env.API_BASE_URL?.replace(/\/$/, '') ??
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, '') ??
  'http://localhost:3001';

interface MessagesResponse {
  ok: true;
  data: { locale: Locale; tenantId: string | null; messages: Messages };
}

async function fetchFromApi(locale: Locale, tenantId: string | null): Promise<Messages> {
  const url = new URL('/v1/i18n/messages', BASE_URL);
  url.searchParams.set('locale', locale);
  if (tenantId) url.searchParams.set('tenantId', tenantId);

  let res: Response;
  try {
    res = await fetch(url.toString(), {
      // We do our own caching via unstable_cache (or bypass it in dev). The HTTP
      // layer should never cache here — otherwise reseeds become invisible.
      cache: 'no-store',
    });
  } catch (e) {
    console.error(`[i18n] fetch threw at ${url.toString()}:`, e);
    return {};
  }
  if (!res.ok) {
    console.error(`[i18n] fetch failed: HTTP ${res.status} at ${url.toString()}`);
    return {};
  }
  const text = await res.text();
  let json: MessagesResponse | null = null;
  try {
    json = JSON.parse(text) as MessagesResponse;
  } catch (e) {
    console.error(`[i18n] JSON parse failed (len=${text.length}, head=${text.slice(0, 200)}):`, e);
    return {};
  }
  if (!json?.ok) {
    console.error(`[i18n] envelope not ok:`, JSON.stringify(json).slice(0, 200));
    return {};
  }
  const keyCount = Object.keys(json.data.messages ?? {}).length;
  console.log(`[i18n] loaded ${keyCount} top-level namespaces for locale=${locale}`);
  return json.data.messages;
}

const isDev = process.env.NODE_ENV !== 'production';

export async function getMessages(
  locale: Locale,
  tenantId: string | null = null,
): Promise<Messages> {
  if (isDev) {
    // Skip the cache entirely in dev so newly seeded translation keys
    // resolve on the next request instead of waiting out the 5-minute window.
    return fetchFromApi(locale, tenantId);
  }
  const cached = unstable_cache(
    async () => fetchFromApi(locale, tenantId),
    ['messages', locale, tenantId ?? 'global', 'v3'],
    {
      revalidate: 300,
      tags: ['messages', `messages:${tenantId ?? 'global'}`, `messages:${tenantId ?? 'global'}:${locale}`],
    },
  );
  return cached();
}
