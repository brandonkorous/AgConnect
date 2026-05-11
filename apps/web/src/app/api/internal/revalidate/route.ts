import { NextRequest, NextResponse } from 'next/server';
import { createHmac, timingSafeEqual } from 'node:crypto';
import { updateTag } from 'next/cache';

// Internal-only revalidate hook called by services/api after a translation
// edit. HMAC-signed with INTERNAL_REVALIDATE_SECRET (shared with api). The
// route is exposed under /api/internal/* and disallowed in robots.ts; only the
// api pod knows the secret so external callers can't trigger revalidations.

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const SECRET = process.env.INTERNAL_REVALIDATE_SECRET ?? '';
const MAX_TAG_AGE_MS = 5 * 60 * 1000;

type Body = { tags?: string[]; at?: number };

function verifySignature(rawBody: string, signature: string | null): boolean {
  if (!SECRET || !signature) return false;
  const expected = createHmac('sha256', SECRET).update(rawBody).digest('hex');
  if (expected.length !== signature.length) return false;
  try {
    return timingSafeEqual(Buffer.from(expected, 'hex'), Buffer.from(signature, 'hex'));
  } catch {
    return false;
  }
}

export async function POST(req: NextRequest) {
  if (!SECRET) {
    return NextResponse.json(
      { ok: false, error: { code: 'not_configured', message: 'revalidate disabled' } },
      { status: 503 },
    );
  }

  const raw = await req.text();
  if (!verifySignature(raw, req.headers.get('x-revalidate-signature'))) {
    return NextResponse.json(
      { ok: false, error: { code: 'forbidden', message: 'invalid signature' } },
      { status: 403 },
    );
  }

  let body: Body;
  try {
    body = JSON.parse(raw) as Body;
  } catch {
    return NextResponse.json(
      { ok: false, error: { code: 'bad_request', message: 'invalid json' } },
      { status: 400 },
    );
  }

  // Replay window: reject signed payloads older than 5 minutes.
  if (typeof body.at === 'number' && Math.abs(Date.now() - body.at) > MAX_TAG_AGE_MS) {
    return NextResponse.json(
      { ok: false, error: { code: 'expired', message: 'payload too old' } },
      { status: 400 },
    );
  }

  // Next 16: `updateTag(tag)` is the route-handler-safe primitive for
  // on-demand invalidation. `revalidateTag` now requires a cache profile and
  // is intended for server actions.
  const tags = Array.isArray(body.tags) ? body.tags.filter((t) => typeof t === 'string') : [];
  for (const t of tags) updateTag(t);
  return NextResponse.json({ ok: true, data: { revalidated: tags.length } });
}
