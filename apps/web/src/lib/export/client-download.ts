'use client';

import { tokenStore } from '@/lib/api/token-store';
import type { Paystub } from '@/lib/api/hooks/pay';
import type { ShiftRow } from '@/lib/api/hooks/shifts';

export function downloadBlob(filename: string, body: string | Blob, contentType: string): void {
  if (typeof window === 'undefined') return;
  const blob = typeof body === 'string' ? new Blob([body], { type: contentType }) : body;
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.style.display = 'none';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Authenticated download from /v1/* on the Hono API. Used for endpoints that
// stream a binary or CSV payload (where the typed apiClient JSON wrapper
// doesn't fit). Pulls the Clerk token via the same token store the apiClient
// uses, then triggers a Blob download.
export async function downloadFromApi(
  path: string,
  filename: string,
  extraHeaders?: Record<string, string>,
): Promise<void> {
  const baseUrl =
    process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, '') ?? 'http://localhost:3001';
  const getter = tokenStore.get();
  const token = getter ? await getter() : null;
  const headers: Record<string, string> = { accept: 'text/csv, application/octet-stream' };
  if (token) headers.authorization = `Bearer ${token}`;
  if (extraHeaders) Object.assign(headers, extraHeaders);
  const res = await fetch(`${baseUrl}${path}`, { method: 'GET', headers, cache: 'no-store' });
  if (!res.ok) throw new Error(`download failed: ${res.status}`);
  const blob = await res.blob();
  downloadBlob(filename, blob, blob.type || 'application/octet-stream');
}

function csvEscape(v: string | number): string {
  const s = String(v);
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export function buildPaystubsCsv(paystubs: Paystub[]): string {
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
    ]
      .map(csvEscape)
      .join(','),
  );
  return [headers.join(','), ...rows].join('\n');
}

function pad(n: number): string {
  return n < 10 ? `0${n}` : String(n);
}

function fmtICalDate(date: string, time: string | null): string {
  const [y, m, d] = date.split('-').map(Number);
  if (!time) return `${y}${pad(m ?? 1)}${pad(d ?? 1)}`;
  const [hh, mm] = time.split(':').map(Number);
  return `${y}${pad(m ?? 1)}${pad(d ?? 1)}T${pad(hh ?? 0)}${pad(mm ?? 0)}00`;
}

function icsEscape(s: string): string {
  return s
    .replace(/\\/g, '\\\\')
    .replace(/\n/g, '\\n')
    .replace(/,/g, '\\,')
    .replace(/;/g, '\\;');
}

function shiftToVevent(shift: ShiftRow): string {
  const summary = icsEscape(
    shift.shift.jobTitleEn ?? shift.shift.crewName ?? `Shift · ${shift.shift.employer}`,
  );
  const location = icsEscape(shift.shift.locationLabel);
  const description = icsEscape(
    [shift.shift.employer, shift.shift.notes ?? ''].filter(Boolean).join(' — '),
  );
  const dtStart = fmtICalDate(shift.shift.date, shift.shift.startTime);
  const dtEnd = fmtICalDate(shift.shift.date, shift.shift.endTime ?? shift.shift.startTime);
  const hasTime = Boolean(shift.shift.startTime);
  return [
    'BEGIN:VEVENT',
    `UID:${shift.id}@agconn.com`,
    `SUMMARY:${summary}`,
    `LOCATION:${location}`,
    `DESCRIPTION:${description}`,
    hasTime ? `DTSTART:${dtStart}` : `DTSTART;VALUE=DATE:${dtStart}`,
    hasTime ? `DTEND:${dtEnd}` : `DTEND;VALUE=DATE:${dtEnd}`,
    'STATUS:CONFIRMED',
    'END:VEVENT',
  ].join('\r\n');
}

export function buildShiftsIcs(shifts: ShiftRow[]): string {
  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//AGCONN//Worker Shifts//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'X-WR-CALNAME:AGCONN shifts',
    ...shifts.map(shiftToVevent),
    'END:VCALENDAR',
  ].join('\r\n');
}
