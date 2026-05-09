import { NextRequest, NextResponse } from 'next/server';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:3001';
const ADMIN_TOKEN = process.env.ADMIN_BEARER_TOKEN ?? '';

export const dynamic = 'force-dynamic';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const upstream = await fetch(`${API_BASE}/admin/v1/reports/runs/${encodeURIComponent(id)}/download`, {
    headers: { authorization: `Bearer ${ADMIN_TOKEN}` },
    cache: 'no-store',
  });

  if (!upstream.ok) {
    const text = await upstream.text().catch(() => '');
    return NextResponse.json(
      { ok: false, error: { code: 'download_failed', message: text || 'upstream error' } },
      { status: upstream.status || 500 },
    );
  }

  const json = (await upstream.json()) as { ok: true; data: { url: string } } | { ok: false };
  if (!json.ok) {
    return NextResponse.json(
      { ok: false, error: { code: 'download_failed', message: 'no signed url' } },
      { status: 502 },
    );
  }

  return NextResponse.redirect(json.data.url, 303);
}
