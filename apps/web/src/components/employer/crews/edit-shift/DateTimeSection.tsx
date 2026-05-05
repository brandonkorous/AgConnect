'use client';

import { useTranslations } from 'next-intl';
import { SectionCard } from './SectionCard';
import { DOW_KEYS, dowOfDate, type ShiftDraft } from './types';

type FieldErrorMap = {
  shiftDate?: string | null;
  startTime?: string | null;
  endTime?: string | null;
};

type Props = {
  draft: ShiftDraft;
  onChange: (patch: Partial<ShiftDraft>) => void;
  crewSize: number;
  errors?: FieldErrorMap;
};

export function DateTimeSection({ draft, onChange, crewSize, errors }: Props) {
  const t = useTranslations('employer.crews.edit_shift.date_time');

  const hoursPerDay = (() => {
    if (!draft.endTime) return 0;
    const [sh = 0, sm = 0] = draft.startTime.split(':').map(Number);
    const [eh = 0, em = 0] = draft.endTime.split(':').map(Number);
    return Math.max(0, (eh * 60 + em - (sh * 60 + sm)) / 60);
  })();
  const baseDow = dowOfDate(draft.shiftDate);
  const activeDays = DOW_KEYS.reduce(
    (n, k) => (k === baseDow || draft.repeatDow[k] ? n + 1 : n),
    0,
  );
  const totalCrewHours = Math.round(hoursPerDay * activeDays * Math.max(crewSize, 0));

  return (
    <SectionCard id="date" title={t('title')} sub={t('sub')}>
      <div className="grid gap-3.5 md:grid-cols-2">
        <Field label={t('shift_date_label')} error={errors?.shiftDate ?? null}>
          <input
            type="date"
            required
            value={draft.shiftDate}
            onChange={(e) => onChange({ shiftDate: e.target.value })}
            aria-invalid={errors?.shiftDate ? true : undefined}
            className={['input w-full', errors?.shiftDate ? 'input-error' : ''].join(' ')}
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
        <Field label={t('start_time_label')} error={errors?.startTime ?? null}>
          <input
            type="time"
            required
            value={draft.startTime}
            onChange={(e) => onChange({ startTime: e.target.value })}
            aria-invalid={errors?.startTime ? true : undefined}
            className={['input w-full', errors?.startTime ? 'input-error' : ''].join(' ')}
          />
        </Field>
        <Field label={t('end_time_label')} error={errors?.endTime ?? null}>
          <input
            type="time"
            value={draft.endTime}
            onChange={(e) => onChange({ endTime: e.target.value })}
            aria-invalid={errors?.endTime ? true : undefined}
            className={['input w-full', errors?.endTime ? 'input-error' : ''].join(' ')}
          />
        </Field>
      </div>

      <fieldset className="fieldset mt-5 w-full min-w-0">
        <legend className="fieldset-legend">{t('repeat_label')}</legend>
        <div className="join w-full">
          {DOW_KEYS.map((d) => {
            const isBase = d === baseDow;
            const on = isBase || draft.repeatDow[d];
            return (
              <input
                key={d}
                type="checkbox"
                className="btn btn-sm join-item flex-1"
                aria-label={t(`dow.${d}`)}
                aria-pressed={on}
                checked={on}
                disabled={isBase}
                title={isBase ? t('repeat_base_help') : undefined}
                onChange={() =>
                  onChange({
                    repeatDow: { ...draft.repeatDow, [d]: !on },
                  })
                }
              />
            );
          })}
        </div>
        <p className="label">{t('repeat_help')}</p>

        <div className="bg-base-200/40 mt-3 grid grid-cols-3 gap-3 rounded-xl p-3.5">
          <Stat label={t('stat.hours_per_day')} value={`${hoursPerDay.toFixed(1)} h`} />
          <Stat label={t('stat.active_days')} value={String(activeDays)} />
          <Stat
            label={t('stat.total_hours')}
            value={`${totalCrewHours} h`}
            tone="primary"
          />
        </div>
      </div>
    </SectionCard>
  );
}

function Field({
  label,
  sub,
  error,
  children,
}: {
  label: string;
  sub?: string;
  error?: string | null;
  children: React.ReactNode;
}) {
  return (
    <fieldset className="fieldset w-full min-w-0">
      <legend className="fieldset-legend">{label}</legend>
      {children}
      {error ? (
        <p className="label text-error">{error}</p>
      ) : sub ? (
        <p className="label">{sub}</p>
      ) : null}
    </fieldset>
  );
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: 'primary';
}) {
  return (
    <div>
      <div className="text-base-content/60 font-mono text-[10px] font-bold uppercase tracking-wider">
        {label}
      </div>
      <div
        className={[
          'mt-1 font-mono text-lg font-bold tabular-nums',
          tone === 'primary' ? 'text-primary' : '',
        ].join(' ')}
      >
        {value}
      </div>
    </div>
  );
}
