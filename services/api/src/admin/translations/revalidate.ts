import { createHmac } from 'node:crypto';

// Fire-and-mostly-forget POST to the web app's internal revalidate hook.
// HMAC over the JSON body + timestamp; web validates with the same secret.
//
// Failure here is non-fatal — the next-intl `unstable_cache` revalidate window
// (5 min) is the floor. The hook just makes propagation feel instant when it
// works. We log + Sentry on failure but never throw out of the caller.

const WEB_BASE =
  process.env.WEB_INTERNAL_BASE_URL?.replace(/\/$/, '') ??
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '') ??
  'http://localhost:3000';

const SECRET = process.env.INTERNAL_REVALIDATE_SECRET ?? '';

export type RevalidateInput = {
  tenantId: string | null;
  locale?: 'en' | 'es';
};

function buildTags({ tenantId, locale }: RevalidateInput): string[] {
  const scope = tenantId ?? 'global';
  const tags = ['messages', `messages:${scope}`];
  if (locale) tags.push(`messages:${scope}:${locale}`);
  return tags;
}

export async function revalidateTranslations(input: RevalidateInput): Promise<void> {
  if (!SECRET) return; // Hook disabled until secret provisioned.
  const body = JSON.stringify({ tags: buildTags(input), at: Date.now() });
  const signature = createHmac('sha256', SECRET).update(body).digest('hex');

  try {
    await fetch(`${WEB_BASE}/api/internal/revalidate`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-revalidate-signature': signature,
      },
      body,
      // Short timeout — web should respond in <100ms. If it doesn't, the 5-min
      // window will catch up.
      signal: AbortSignal.timeout(2000),
    });
  } catch (e) {
    console.warn('[revalidate] hook failed', e instanceof Error ? e.message : String(e));
  }
}
