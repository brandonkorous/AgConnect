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
    <div className="join flex-wrap">
      {WEEKDAYS.map((d) => {
        const on = isDayOn(value, d);
        return (
          <button
            key={d}
            type="button"
            aria-pressed={on}
            onClick={() => onChange(toggleDay(value, d))}
            className={`btn btn-sm join-item ${on ? 'btn-primary' : 'btn-outline'}`}
          >
            {t(d as Weekday)}
          </button>
        );
      })}
    </div>
  );
}
