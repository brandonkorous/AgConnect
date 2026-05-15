import { NextResponse } from 'next/server';
import { fetchMyShifts, type ShiftRow } from '@/lib/api/me';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function pad(n: number): string {
    return n < 10 ? `0${n}` : String(n);
}

function fmtICalDate(date: string, time: string | null): string {
    // date: yyyy-mm-dd, time: HH:MM (24h) — emit floating local time, no Z.
    const [y, m, d] = date.split('-').map(Number);
    if (!time) return `${y}${pad(m ?? 1)}${pad(d ?? 1)}`;
    const [hh, mm] = time.split(':').map(Number);
    return `${y}${pad(m ?? 1)}${pad(d ?? 1)}T${pad(hh ?? 0)}${pad(mm ?? 0)}00`;
}

function escape(s: string): string {
    return s.replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/,/g, '\\,').replace(/;/g, '\\;');
}

function shiftToVevent(shift: ShiftRow): string {
    const summary = escape(
        shift.shift.jobTitleEn ?? shift.shift.crewName ?? `Shift · ${shift.shift.employer}`,
    );
    const location = escape(shift.shift.locationLabel);
    const description = escape(
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

export async function GET() {
    const shifts = await fetchMyShifts();
    const body = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//AGCONN//Worker Shifts//EN',
        'CALSCALE:GREGORIAN',
        'METHOD:PUBLISH',
        'X-WR-CALNAME:AGCONN shifts',
        ...shifts.map(shiftToVevent),
        'END:VCALENDAR',
    ].join('\r\n');

    return new NextResponse(body, {
        status: 200,
        headers: {
            'Content-Type': 'text/calendar; charset=utf-8',
            'Content-Disposition': 'attachment; filename="agconn-shifts.ics"',
            'Cache-Control': 'private, no-store',
        },
    });
}
