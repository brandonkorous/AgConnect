import { useTranslations } from 'next-intl';
import { SHIFTS_BY_DAY, type ShiftTone } from './shiftsMockData';

const TONE: Record<ShiftTone, string> = {
  primary: 'bg-primary/15 text-primary',
  ink: 'bg-base-content text-base-100',
  accent: 'bg-warning/25 text-warning-content',
  ghost: 'bg-base-200 text-base-content/60',
};

const MONTH_START_OFFSET = -2;
const TODAY = 3;

export function ShiftsCalendar() {
  const t = useTranslations('worker.shifts.calendar');
  const days = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const;
  const cells = Array.from({ length: 35 }, (_, i) => {
    const day = i + MONTH_START_OFFSET + 1;
    const inMonth = day >= 1 && day <= 31;
    return { day, inMonth };
  });

  return (
    <div className="border-base-300 bg-base-100 overflow-hidden rounded-2xl border">
      <div className="border-base-300 flex items-center justify-between border-b px-5 py-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            aria-label={t('prev')}
            className="bg-base-200 grid h-8 w-8 place-items-center rounded-full text-base"
          >
            ‹
          </button>
          <div className="font-serif text-[22px] tracking-[-0.02em]">
            {t('month_label')}
          </div>
          <button
            type="button"
            aria-label={t('next')}
            className="bg-base-200 grid h-8 w-8 place-items-center rounded-full text-base"
          >
            ›
          </button>
        </div>
        <div className="bg-base-200 inline-flex items-center rounded-full p-[2px] font-mono text-[11.5px]">
          <span className="bg-base-content text-base-100 rounded-full px-3 py-[5px] font-bold">
            {t('view_month')}
          </span>
          <span className="text-base-content/60 px-3 py-[5px] font-semibold">
            {t('view_week')}
          </span>
          <span className="text-base-content/60 px-3 py-[5px] font-semibold">
            {t('view_agenda')}
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
          const shifts = SHIFTS_BY_DAY[c.day] ?? [];
          const isToday = c.inMonth && c.day === TODAY;
          const display = c.inMonth
            ? c.day
            : c.day < 1
              ? 30 + c.day
              : c.day - 31;
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
                  {display}
                </div>
                {isToday && (
                  <span className="text-primary font-mono text-[9px] font-bold tracking-[0.1em]">
                    {t('today')}
                  </span>
                )}
              </div>
              {shifts.map((sh, j) => (
                <div
                  key={j}
                  className={[
                    'mb-[3px] truncate rounded-[5px] px-[7px] py-1 text-[10.5px] font-semibold leading-tight',
                    TONE[sh.tone],
                  ].join(' ')}
                >
                  {sh.time && (
                    <span className="mr-1 font-mono opacity-75">{sh.time}</span>
                  )}
                  {sh.label}
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}
