import { NextRequest, NextResponse } from 'next/server';
import { adminFetch } from '@/lib/api-server';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const body: Record<string, unknown> = {
    start: sp.get('start'),
    end: sp.get('end'),
    view: sp.get('view') ?? 'rows',
    scope: sp.get('scope') ?? 'enrollments',
    format: sp.get('format') === 'xlsx' ? 'xlsx' : 'csv',
    includeNames: sp.get('includeNames') === 'true',
  };
  const counties = sp.getAll('counties');
  if (counties.length) body.counties = counties;
  const funders = sp.getAll('funders');
  if (funders.length) body.funders = funders;

  const upstream = await adminFetch('/admin/v1/reports/training/export', {
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

  const headers = new Headers();
  const ct = upstream.headers.get('content-type');
  if (ct) headers.set('content-type', ct);
  const cd = upstream.headers.get('content-disposition');
  if (cd) headers.set('content-disposition', cd);
  const rc = upstream.headers.get('x-row-count');
  if (rc) headers.set('x-row-count', rc);
  return new NextResponse(upstream.body, { status: 200, headers });
}
