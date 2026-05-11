import { NextRequest, NextResponse } from 'next/server';
import { adminFetch } from '@/lib/api-server';

// Generic CSV export proxy. Forwards GET /api/export/<segments...>?<query>
// to /admin/v1/<segments...>?<query>, streaming the binary body back. Only
// paths ending in `export.csv` are allowed so the proxy can't be abused as
// a general api tunnel — every export endpoint follows that naming convention.

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  const { path } = await ctx.params;
  const last = path[path.length - 1];
  if (last !== 'export.csv') {
    return NextResponse.json({ ok: false, error: { code: 'forbidden' } }, { status: 403 });
  }

  const target = `/admin/v1/${path.join('/')}${req.nextUrl.search}`;
  const upstream = await adminFetch(target, { raw: true });

  if (!upstream.ok || !upstream.body) {
    const text = await upstream.text().catch(() => '');
    return NextResponse.json(
      { ok: false, error: { code: 'export_failed', message: text || 'upstream error' } },
      { status: upstream.status || 500 },
    );
  }

  const headers = new Headers();
  const ct = upstream.headers.get('content-type');
  if (ct) headers.set('content-type', ct);
  const cd = upstream.headers.get('content-disposition');
  if (cd) headers.set('content-disposition', cd);

  return new NextResponse(upstream.body, { status: 200, headers });
}
