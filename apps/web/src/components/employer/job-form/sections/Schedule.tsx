'use client';

import { useTranslations } from 'next-intl';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSun } from '@fortawesome/free-solid-svg-icons';
import { SectionShell } from '../SectionShell';
import { WorkingDaysPicker } from '../WorkingDaysPicker';
import type { JobFormState, JobFormUpdate } from '../types';

type Props = {
  state: JobFormState;
  update: JobFormUpdate;
};

export function ScheduleSection({ state, update }: Props) {
  const t = useTranslations('employer.jobs.form_v2');
  return (
    <SectionShell num={2} id="s-schedule" title={t('schedule_title')} subtitle={t('schedule_sub')}>
      <div className="grid gap-4 sm:grid-cols-2">
        <fieldset className="fieldset">
          <legend className="fieldset-legend text-base-content/80 text-sm font-semibold">
            {t('field_start_date')}
          </legend>
          <input
            type="date"
            required
            value={state.startDate}
            onChange={(e) => update({ startDate: e.target.value })}
            className="input input-bordered w-full"
          />
        </fieldset>
        <fieldset className="fieldset">
          <legend className="fieldset-legend text-base-content/80 text-sm font-semibold">
            {t('field_end_date')}
            <span className="text-base-content/55 ml-1.5 font-normal">{t('optional')}</span>
          </legend>
          <input
            type="date"
            value={state.endDate}
            onChange={(e) => update({ endDate: e.target.value })}
            className="input input-bordered w-full"
          />
        </fieldset>
        <fieldset className="fieldset">
          <legend className="fieldset-legend text-base-content/80 text-sm font-semibold">
            {t('field_daily_start')}
          </legend>
          <input
            type="time"
            value={state.dailyStartTime}
            onChange={(e) => update({ dailyStartTime: e.target.value })}
            className="input input-bordered w-full"
          />
        </fieldset>
        <fieldset className="fieldset">
          <legend className="fieldset-legend text-base-content/80 text-sm font-semibold">
            {t('field_daily_end')}
          </legend>
          <input
            type="time"
            value={state.dailyEndTime}
            onChange={(e) => update({ dailyEndTime: e.target.value })}
            className="input input-bordered w-full"
          />
        </fieldset>
      </div>

      <fieldset className="fieldset mt-4">
        <legend className="fieldset-legend text-base-content/80 text-sm font-semibold">
          {t('field_working_days')}
        </legend>
        <WorkingDaysPicker
          value={state.workingDays}
          onChange={(v) => update({ workingDays: v })}
        />
      </fieldset>

      <div
        role="note"
        className="bg-base-200 border-base-300 mt-4 flex items-start gap-2.5 rounded-xl border border-dashed p-3.5 text-sm"
      >
        <FontAwesomeIcon icon={faSun} className="text-warning mt-0.5 h-4 w-4" />
        <p className="text-base-content/70 leading-relaxed">
          <strong className="text-base-content">{t('heat_advisory_title')}</strong>{' '}
          {t('heat_advisory_body')}
        </p>
      </div>
    </SectionShell>
  );
}
