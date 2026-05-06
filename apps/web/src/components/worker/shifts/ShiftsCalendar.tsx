import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import type { Route } from 'next';
import type { ShiftRow } from '@/lib/api/me';

const TONE: Record<string, string> = {
  confirmed: 'bg-primary/15 text-primary',
  attended: 'bg-base-content text-base-100',
  assigned: 'bg-warning/25 text-warning-content',
  declined: 'bg-base-200 text-base-content/60',
  no_show: 'bg-error/20 text-error',
};

type Props = { shifts: ShiftRow[]; locale: string; year: number; month: number };

function pad2(n: number): string {
  return n < 10 ? `0${n}` : String(n);
}

function monthParam(year: number, month: number): string {
  return `${year}-${pad2(month + 1)}`;
}

function shiftMonth(year: number, month: number, delta: number): { year: number; month: number } {
  const date = new Date(Date.UTC(year, month + delta, 1));
  return { year: date.getUTCFullYear(), month: date.getUTCMonth() };
}

export async function ShiftsCalendar({ shifts, locale, year, month }: Props) {
  const t = await getTranslations({ locale, namespace: 'worker.shifts.calendar' });
  const days = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const;

  const today = new Date();
  const monthStart = new Date(Date.UTC(year, month, 1));
  const monthStartWeekday = (monthStart.getUTCDay() + 6) % 7;
  const cells = Array.from({ length: 35 }, (_, i) => {
    const day = i - monthStartWeekday + 1;
    const inMonth = day >= 1 && day <= daysInMonth(monthStart);
    const date = new Date(monthStart);
    date.setUTCDate(day);
    return { day, inMonth, date };
  });

  const byDate = new Map<string, ShiftRow[]>();
  for (const s of shifts) {
    const key = s.shift.date;
    const list = byDate.get(key) ?? [];
    list.push(s);
    byDate.set(key, list);
  }

  const monthLabel = monthStart.toLocaleDateString(locale, {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  });
  const prev = shiftMonth(year, month, -1);
  const next = shiftMonth(year, month, 1);
  const prevHref = `?month=${monthParam(prev.year, prev.month)}`;
  const nextHref = `?month=${monthParam(next.year, next.month)}`;

  return (
    <div className="border-base-300 bg-base-100 overflow-hidden rounded-2xl border">
      <div className="border-base-300 flex items-center justify-between border-b px-5 py-4">
        <div className="flex items-center gap-3">
          <Link
            href={prevHref as Route}
            aria-label={t('prev')}
            className="bg-base-200 grid h-8 w-8 place-items-center rounded-full text-base no-underline"
          >
            ‹
          </Link>
          <div className="font-serif text-[22px] tracking-[-0.02em]">
            {monthLabel}
          </div>
          <Link
            href={nextHref as Route}
            aria-label={t('next')}
            className="bg-base-200 grid h-8 w-8 place-items-center rounded-full text-base no-underline"
          >
            ›
          </Link>
        </div>
        <div className="bg-base-200 inline-flex items-center rounded-full p-[2px] font-mono text-[11.5px]">
          <span className="bg-base-content text-base-100 rounded-full px-3 py-[5px] font-bold">
            {t('view_month')}
          </span>
        </div>
      </div>

      <div className="border-base-300 grid grid-cols-7 border-b">
        {days.map((d) => (
          <div
            key={d}
            className="text-base-content/60 px-3 py-2.5 font-mono text-[10.5px] font-bold uppercase tracking-[0.1em]"
          >
            {t(`weekday.${d}`)}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7">
        {cells.map((c, i) => {
          const dateKey = c.date.toISOString().slice(0, 10);
          const cellShifts = byDate.get(dateKey) ?? [];
          const isToday =
            c.inMonth &&
            c.date.getUTCFullYear() === today.getUTCFullYear() &&
            c.date.getUTCMonth() === today.getUTCMonth() &&
            c.date.getUTCDate() === today.getUTCDate();

          return (
            <div
              key={i}
              className={[
                'min-h-[92px] p-2',
                (i + 1) % 7 !== 0 ? 'border-base-300 border-r' : '',
                i < 28 ? 'border-base-300 border-b' : '',
                !c.inMonth
                  ? 'bg-base-200/40 opacity-50'
                  : isToday
                    ? 'bg-base-200'
                    : 'bg-base-100',
              ].join(' ')}
            >
              <div className="mb-1 flex items-center justify-between">
                <div
                  className={[
                    'font-mono text-[11.5px]',
                    isToday
                      ? 'text-primary font-bold'
                      : 'text-base-content/80 font-medium',
                  ].join(' ')}
                >
                  {c.inMonth ? c.date.getUTCDate() : ''}
                </div>
                {isToday && (
                  <span className="text-primary font-mono text-[9px] font-bold tracking-[0.1em]">
                    {t('today')}
                  </span>
                )}
              </div>
              {cellShifts.slice(0, 2).map((sh) => (
                <div
                  key={sh.id}
                  className={[
                    'mb-[3px] truncate rounded-[5px] px-[7px] py-1 text-[10.5px] font-semibold leading-tight',
                    TONE[sh.status] ?? TONE.assigned,
                  ].join(' ')}
                >
                  <span className="mr-1 font-mono opacity-75">{sh.shift.startTime}</span>
                  {sh.shift.employer.split(' ')[0]} ·{' '}
                  {(sh.shift.jobTitleEn ?? sh.shift.crewName ?? '').slice(0, 12)}
                </div>
              ))}
              {cellShifts.length > 2 && (
                <div className="bg-base-200 text-base-content/60 mb-[3px] truncate rounded-[5px] px-[7px] py-1 text-[10.5px] font-semibold">
                  +{cellShifts.length - 2}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function daysInMonth(d: Date): number {
  return new Date(
    Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0),
  ).getUTCDate();
}
