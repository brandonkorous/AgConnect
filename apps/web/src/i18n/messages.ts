import 'server-only';
import { unstable_cache } from 'next/cache';
import { fetchMessages, withLastGood, type Locale, type Messages } from './messages-fetch';

export type { Locale, Messages };

const BASE_URL =
    process.env.API_BASE_URL?.replace(/\/$/, '') ??
    process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, '') ??
    'http://localhost:3001';

const isDev = process.env.NODE_ENV !== 'production';

export async function getMessages(
    locale: Locale,
    tenantId: string | null = null,
): Promise<Messages> {
    const scope = tenantId ?? 'global';
    const load = () => fetchMessages(BASE_URL, locale, tenantId);
    // Dev skips the cache so newly seeded keys resolve on the next request.
    if (isDev) return withLastGood(`${locale}|${scope}`, load);
    // fetchMessages throws on failure, and unstable_cache does not keep a thrown result.
    const cached = unstable_cache(load, ['messages', locale, scope, 'v4'], {
        revalidate: 300,
        tags: ['messages', `messages:${scope}`, `messages:${scope}:${locale}`],
    });
    return withLastGood(`${locale}|${scope}`, cached);
}
