import { NextResponse } from 'next/server';
import { fetchMyPay } from '@/lib/api/me';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function csvEscape(v: string | number): string {
  const s = String(v);
  if (/[",\n]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

export async function GET() {
  const { paystubs } = await fetchMyPay();
  const headers = [
    'period',
    'employer',
    'pay_date',
    'hours',
    'overtime_hours',
    'gross_usd',
    'bonus_usd',
    'taxes_usd',
    'net_usd',
    'status',
  ];
  const rows = paystubs.map((p) =>
    [
      p.period,
      p.employer,
      p.payDate,
      p.hours.toFixed(2),
      p.overtimeHours.toFixed(2),
      (p.grossCents / 100).toFixed(2),
      (p.bonusCents / 100).toFixed(2),
      (p.taxesCents / 100).toFixed(2),
      (p.netCents / 100).toFixed(2),
      p.status,
    ].map(csvEscape).join(','),
  );
  const body = [headers.join(','), ...rows].join('\n');

  return new NextResponse(body, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="agconn-paystubs.csv"',
      'Cache-Control': 'private, no-store',
    },
  });
}
