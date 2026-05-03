'use client';

import { useTranslations } from 'next-intl';
import { WEEKDAYS, isDayOn, toggleDay, type Weekday } from './types';

type Props = {
  value: number;
  onChange: (next: number) => void;
};

export function WorkingDaysPicker({ value, onChange }: Props) {
  const t = useTranslations('employer.jobs.form_v2.weekday_short');
  return (
    <div className="flex flex-wrap gap-1.5">
      {WEEKDAYS.map((d) => {
        const on = isDayOn(value, d);
        return (
          <button
            key={d}
            type="button"
            aria-pressed={on}
            onClick={() => onChange(toggleDay(value, d))}
            className={[
              'min-w-[60px] rounded-lg border px-3 py-2 text-xs font-semibold transition-colors',
              on
                ? 'bg-primary/10 text-primary border-primary'
                : 'bg-base-100 text-base-content/60 border-base-300 hover:border-base-content/30',
            ].join(' ')}
          >
            {t(d as Weekday)}
          </button>
        );
      })}
    </div>
  );
}
