import { NextRequest, NextResponse } from 'next/server';

// Server-side proxy so the admin bearer token never reaches the browser.
// Forwards the export request to the api service, then streams the file
// (CSV or XLSX) back to the user with the original Content-Disposition.

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:3001';
const ADMIN_TOKEN = process.env.ADMIN_BEARER_TOKEN ?? '';

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

  const upstream = await fetch(`${API_BASE}/admin/v1/reports/placement/export`, {
    method: 'POST',
    headers: {
      authorization: `Bearer ${ADMIN_TOKEN}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!upstream.ok || !upstream.body) {
    const text = await upstream.text().catch(() => '');
    return NextResponse.json(
      { ok: false, error: { code: 'export_failed', message: text || 'upstream error' } },
      { status: upstream.status || 500 },
    );
  }

  // Email-delivery path returns JSON {status: 'queued'} — bounce back to the runs
  // page. Admin chrome is EN-only per docs/30-admin/02-placement-report/04-ui.md.
  if (email) {
    return NextResponse.redirect(
      new URL('/en/admin/reports/runs?queued=1', req.nextUrl),
      303,
    );
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
