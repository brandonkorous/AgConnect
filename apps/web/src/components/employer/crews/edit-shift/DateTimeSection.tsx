'use client';

import { useTranslations } from 'next-intl';
import { SectionCard } from './SectionCard';
import type { ShiftDraft } from './types';

type Props = {
  draft: ShiftDraft;
  onChange: (patch: Partial<ShiftDraft>) => void;
};

export function DateTimeSection({ draft, onChange }: Props) {
  const t = useTranslations('employer.crews.edit_shift.date_time');

  const hoursPerDay = (() => {
    if (!draft.endTime) return 0;
    const [sh = 0, sm = 0] = draft.startTime.split(':').map(Number);
    const [eh = 0, em = 0] = draft.endTime.split(':').map(Number);
    return Math.max(0, (eh * 60 + em - (sh * 60 + sm)) / 60);
  })();

  return (
    <SectionCard id="date" title={t('title')} sub={t('sub')}>
      <div className="grid grid-cols-1 gap-3.5 md:grid-cols-2">
        <Field label={t('shift_date_label')}>
          <input
            type="date"
            required
            value={draft.shiftDate}
            onChange={(e) => onChange({ shiftDate: e.target.value })}
            className="input w-full"
          />
        </Field>
        <Field label={t('status_label')}>
          <select
            value={draft.status}
            onChange={(e) =>
              onChange({ status: e.target.value as ShiftDraft['status'] })
            }
            className="select w-full"
          >
            {(['scheduled', 'in_progress', 'completed', 'cancelled'] as const).map((s) => (
              <option key={s} value={s}>
                {t(`status.${s}`)}
              </option>
            ))}
          </select>
        </Field>
        <Field label={t('start_time_label')}>
          <input
            type="time"
            required
            value={draft.startTime}
            onChange={(e) => onChange({ startTime: e.target.value })}
            className="input w-full"
          />
        </Field>
        <Field label={t('end_time_label')}>
          <input
            type="time"
            value={draft.endTime}
            onChange={(e) => onChange({ endTime: e.target.value })}
            className="input w-full"
          />
        </Field>
      </div>

      <div className="bg-base-200/40 mt-4 rounded-xl p-3.5">
        <div className="text-base-content/60 font-mono text-[10px] font-bold uppercase tracking-wider">
          {t('stat.hours_per_day')}
        </div>
        <div className="mt-1 font-mono text-lg font-bold tabular-nums">
          {`${hoursPerDay.toFixed(1)} h`}
        </div>
      </div>
    </SectionCard>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <fieldset className="fieldset w-full min-w-0">
      <legend className="fieldset-legend">{label}</legend>
      {children}
    </fieldset>
  );
}
