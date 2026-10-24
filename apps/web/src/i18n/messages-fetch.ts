// Import-free so node:test can load it; messages.ts adds the Next cache on top.

export type Locale = 'en' | 'es';
export type Messages = Record<string, unknown>;

interface MessagesResponse {
    ok: boolean;
    data?: { locale: Locale; tenantId: string | null; messages?: Messages };
}

// Throws on any failure (including an empty tree) so unstable_cache never keeps it.
export async function fetchMessages(
    baseUrl: string,
    locale: Locale,
    tenantId: string | null,
    fetchImpl: typeof fetch = fetch,
): Promise<Messages> {
    const url = new URL('/v1/i18n/messages', baseUrl);
    url.searchParams.set('locale', locale);
    if (tenantId) url.searchParams.set('tenantId', tenantId);
    // Our own caching sits on top; the HTTP layer must not cache, or reseeds become invisible.
    const res = await fetchImpl(url.toString(), { cache: 'no-store' });
    if (!res.ok) throw new Error(`[i18n] HTTP ${res.status} at ${url.toString()}`);
    const json = (await res.json()) as MessagesResponse;
    const messages = json?.ok ? json.data?.messages : undefined;
    if (!messages || Object.keys(messages).length === 0) {
        throw new Error(`[i18n] no messages for locale=${locale} at ${url.toString()}`);
    }
    return messages;
}

const lastGood = new Map<string, Messages>();

// A failed load falls back to the last good copy for this key (or {} on a cold start).
export async function withLastGood(key: string, load: () => Promise<Messages>): Promise<Messages> {
    try {
        const messages = await load();
        lastGood.set(key, messages);
        return messages;
    } catch (e) {
        console.error('[i18n] messages unavailable, serving the last good copy', e);
        return lastGood.get(key) ?? {};
    }
}
