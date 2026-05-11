import { NextRequest, NextResponse } from 'next/server';
import { adminFetch } from '@/lib/api-server';

export const dynamic = 'force-dynamic';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const result = await adminFetch<{ url: string }>(
    `/admin/v1/reports/runs/${encodeURIComponent(id)}/download`,
  );

  if (!result.ok) {
    return NextResponse.json(
      {
        ok: false,
        error: { code: 'download_failed', message: result.error.message || 'no signed url' },
      },
      { status: 502 },
    );
  }

  return NextResponse.redirect(result.data.url, 303);
}
