'use client';

import { useTranslations } from 'next-intl';
import { SectionCard } from '../edit-shift/SectionCard';
import { DOW_KEYS } from '../edit-shift/types';
import { countSeriesDates, daySpanDays, type NewShiftDraft } from './types';

// Mirrors the server-side span cap in @agconn/schemas (SERIES_MAX_DAYS).
const SERIES_MAX_DAYS = 90;

type FieldErrorMap = {
  rangeStart?: string | null;
  rangeEnd?: string | null;
  weekdayMask?: string | null;
  startTime?: string | null;
  endTime?: string | null;
};

type Props = {
  draft: NewShiftDraft;
  onChange: (patch: Partial<NewShiftDraft>) => void;
  errors?: FieldErrorMap;
};

export function SeriesDateSection({ draft, onChange, errors }: Props) {
  const t = useTranslations('employer.crews.new_shift.series');
  const tDate = useTranslations('employer.crews.edit_shift.date_time');

  const rangeInvalid = Boolean(
    draft.rangeStart && draft.rangeEnd && draft.rangeEnd < draft.rangeStart,
  );
  const tooLong = daySpanDays(draft.rangeStart, draft.rangeEnd) > SERIES_MAX_DAYS;
  const count = countSeriesDates(draft.rangeStart, draft.rangeEnd, draft.weekdayMask);

  return (
    <SectionCard id="date" title={t('title')} sub={t('sub')}>
      <div className="grid grid-cols-1 gap-3.5 md:grid-cols-2">
        <Field label={t('range_start_label')} error={errors?.rangeStart ?? null}>
          <input
            type="date"
            required
            value={draft.rangeStart}
            onChange={(e) =>
              onChange({ rangeStart: e.target.value, shiftDate: e.target.value })
            }
            aria-invalid={errors?.rangeStart ? true : undefined}
            className={['input w-full', errors?.rangeStart ? 'input-error' : ''].join(' ')}
          />
        </Field>
        <Field label={t('range_end_label')} error={errors?.rangeEnd ?? null}>
          <input
            type="date"
            required
            value={draft.rangeEnd}
            min={draft.rangeStart || undefined}
            onChange={(e) => onChange({ rangeEnd: e.target.value })}
            aria-invalid={errors?.rangeEnd ? true : undefined}
            className={['input w-full', errors?.rangeEnd ? 'input-error' : ''].join(' ')}
          />
        </Field>
        <Field label={tDate('start_time_label')} error={errors?.startTime ?? null}>
          <input
            type="time"
            required
            value={draft.startTime}
            onChange={(e) => onChange({ startTime: e.target.value })}
            aria-invalid={errors?.startTime ? true : undefined}
            className={['input w-full', errors?.startTime ? 'input-error' : ''].join(' ')}
          />
        </Field>
        <Field label={tDate('end_time_label')} error={errors?.endTime ?? null}>
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
        <legend className="fieldset-legend">{t('weekdays_label')}</legend>
        <div className="join w-full">
          {DOW_KEYS.map((d, i) => {
            const on = draft.weekdayMask[i] ?? false;
            return (
              <input
                key={d}
                type="checkbox"
                className="btn btn-sm join-item flex-1"
                aria-label={tDate(`dow.${d}`)}
                aria-pressed={on}
                checked={on}
                onChange={() => {
                  const next = [...draft.weekdayMask];
                  next[i] = !on;
                  onChange({ weekdayMask: next });
                }}
              />
            );
          })}
        </div>
        {errors?.weekdayMask ? (
          <p className="label text-error">{errors.weekdayMask}</p>
        ) : (
          <p className="label">{t('weekdays_help')}</p>
        )}

        <div className="bg-base-200/40 mt-3 rounded-xl p-3.5">
          {rangeInvalid ? (
            <PreviewLine tone="warning">{t('count_none')}</PreviewLine>
          ) : tooLong ? (
            <PreviewLine tone="warning">{t('count_too_many')}</PreviewLine>
          ) : count === 0 ? (
            <PreviewLine tone="warning">{t('count_none')}</PreviewLine>
          ) : (
            <PreviewLine tone="primary">
              {t('count_preview', { count })}
            </PreviewLine>
          )}
        </div>
      </fieldset>
    </SectionCard>
  );
}

function PreviewLine({
  tone,
  children,
}: {
  tone: 'primary' | 'warning';
  children: React.ReactNode;
}) {
  return (
    <p
      className={[
        'font-mono text-sm font-bold tabular-nums',
        tone === 'primary' ? 'text-primary' : 'text-warning',
      ].join(' ')}
    >
      {children}
    </p>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string | null;
  children: React.ReactNode;
}) {
  return (
    <fieldset className="fieldset w-full min-w-0">
      <legend className="fieldset-legend">{label}</legend>
      {children}
      {error ? <p className="label text-error">{error}</p> : null}
    </fieldset>
  );
}
