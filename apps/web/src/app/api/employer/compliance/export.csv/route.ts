import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const API_BASE =
  process.env.API_BASE_URL?.replace(/\/$/, '') ??
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, '') ??
  'http://localhost:3001';

export async function GET() {
  let token: string | null = null;
  try {
    const session = await auth();
    token = await session.getToken();
  } catch {
    /* unauth path falls through and upstream returns 401 */
  }

  const headers: Record<string, string> = {
    accept: 'text/csv, application/json',
  };
  if (token) headers.authorization = `Bearer ${token}`;

  const upstream = await fetch(`${API_BASE}/v1/employer/compliance/export.csv`, {
    method: 'GET',
    headers,
    cache: 'no-store',
  });

  if (!upstream.ok || !upstream.body) {
    const text = await upstream.text().catch(() => '');
    return NextResponse.json(
      { ok: false, error: { code: 'export_failed', message: text || 'upstream error' } },
      { status: upstream.status || 500 },
    );
  }

  const out = new Headers();
  const ct = upstream.headers.get('content-type');
  if (ct) out.set('content-type', ct);
  const cd = upstream.headers.get('content-disposition');
  if (cd) out.set('content-disposition', cd);
  out.set('cache-control', 'private, no-store');

  return new NextResponse(upstream.body, { status: 200, headers: out });
}
