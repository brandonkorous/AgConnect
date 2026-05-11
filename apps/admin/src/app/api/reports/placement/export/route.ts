import { NextRequest, NextResponse } from 'next/server';
import { adminFetch } from '@/lib/api-server';

// Server-side proxy: takes the GET request from the in-page link, builds the
// upstream POST body, streams the binary response back to the browser. Doing
// the proxy here (rather than calling /admin/v1/* from the browser directly)
// keeps Clerk tokens off the wire and centralizes auth forwarding.

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const email = sp.get('email');
  const body: Record<string, unknown> = {
    start: sp.get('start'),
    end: sp.get('end'),
    includeNames: sp.get('includeNames') === 'true',
    format: sp.get('format') === 'xlsx' ? 'xlsx' : 'csv',
  };
  if (email) body.email = email;
  const counties = sp.getAll('counties');
  if (counties.length) body.counties = counties;
  const funders = sp.getAll('funders');
  if (funders.length) body.funders = funders;
  const tenantIds = sp.getAll('tenantIds');
  if (tenantIds.length) body.tenantIds = tenantIds;

  const upstream = await adminFetch('/admin/v1/reports/placement/export', {
    method: 'POST',
    body,
    raw: true,
  });

  if (!upstream.ok || !upstream.body) {
    const text = await upstream.text().catch(() => '');
    return NextResponse.json(
      { ok: false, error: { code: 'export_failed', message: text || 'upstream error' } },
      { status: upstream.status || 500 },
    );
  }

  if (email) {
    return NextResponse.redirect(new URL('/reports/runs?queued=1', req.nextUrl), 303);
  }

  const headers = new Headers();
  const ct = upstream.headers.get('content-type');
  if (ct) headers.set('content-type', ct);
  const cd = upstream.headers.get('content-disposition');
  if (cd) headers.set('content-disposition', cd);
  const rc = upstream.headers.get('x-row-count');
  if (rc) headers.set('x-row-count', rc);

  return new NextResponse(upstream.body, { status: 200, headers });
}
