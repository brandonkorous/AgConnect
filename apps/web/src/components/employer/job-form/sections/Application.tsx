'use client';

import { useTranslations } from 'next-intl';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPhone, faGlobe } from '@fortawesome/free-solid-svg-icons';
import type { EmployerContactView } from '@/lib/api/employer';
import { SectionShell } from '../SectionShell';
import { ScreeningList } from '../ScreeningList';
import type { JobFormState, JobFormUpdate } from '../types';
import type { ErrorMap } from '../validation';

type Props = {
  state: JobFormState;
  update: JobFormUpdate;
  contacts: EmployerContactView[];
  smsApplyKeyword?: string | null;
  errors?: ErrorMap;
};

export function ApplicationSection({ state, update, contacts, smsApplyKeyword, errors = {} }: Props) {
  const t = useTranslations('employer.jobs.form_v2');
  const err = (path: string) => errors[path];

  return (
    <SectionShell
      num={6}
      id="s-application"
      title={t('application_title')}
      subtitle={t('application_sub')}
    >
      <div className="space-y-2.5">
        <label className="bg-base-200 border-base-300 flex cursor-pointer items-start gap-3 rounded-xl border p-3.5">
          <input
            type="checkbox"
            checked={state.smsApplyEnabled}
            onChange={(e) => update({ smsApplyEnabled: e.target.checked })}
            className="toggle toggle-primary toggle-sm mt-0.5"
          />
          <div className="min-w-0 flex-1">
            <div className="text-sm font-semibold">
              <FontAwesomeIcon icon={faPhone} className="text-base-content/40 mr-1.5 h-3 w-3" />
              {smsApplyKeyword
                ? t('sms_apply_with_keyword', { keyword: smsApplyKeyword })
                : t('sms_apply_pending')}
            </div>
            <div className="text-base-content/55 mt-0.5 text-xs">{t('sms_apply_sub')}</div>
          </div>
        </label>

        <label className="bg-base-200 border-base-300 flex cursor-pointer items-start gap-3 rounded-xl border p-3.5">
          <input
            type="checkbox"
            checked={state.autoTranslateEnabled}
            onChange={(e) => update({ autoTranslateEnabled: e.target.checked })}
            className="toggle toggle-primary toggle-sm mt-0.5"
          />
          <div className="min-w-0 flex-1">
            <div className="text-sm font-semibold">
              <FontAwesomeIcon icon={faGlobe} className="text-base-content/40 mr-1.5 h-3 w-3" />
              {t('auto_translate_label')}
            </div>
            <div className="text-base-content/55 mt-0.5 text-xs">{t('auto_translate_sub')}</div>
          </div>
        </label>
      </div>

      <fieldset className="fieldset mt-5">
        <legend className="fieldset-legend text-base-content/80 text-sm font-semibold">
          {t('field_screening')}
          <span className="text-base-content/55 ml-1.5 font-normal">{t('optional')}</span>
        </legend>
        <ScreeningList
          questions={state.screeningQuestions}
          onChange={(q) => update({ screeningQuestions: q })}
        />
      </fieldset>

      <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <fieldset className="fieldset">
          <legend className="fieldset-legend text-base-content/80 text-sm font-semibold">
            {t('field_foreman')}
            <span className="text-base-content/55 ml-1.5 font-normal">{t('optional')}</span>
          </legend>
          <select
            value={state.foremanContactId ?? ''}
            onChange={(e) => update({ foremanContactId: e.target.value || null })}
            className={`select select-bordered w-full${err('foremanContactId') ? ' select-error' : ''}`}
          >
            <option value="">{t('foreman_pick')}</option>
            {contacts.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} — {c.phone}
              </option>
            ))}
          </select>
          {err('foremanContactId') && <p className="label text-error">{t(`validation_reason_${err('foremanContactId')!.reason}`)}</p>}
        </fieldset>
        <fieldset className="fieldset">
          <legend className="fieldset-legend text-base-content/80 text-sm font-semibold">
            {t('field_app_deadline')}
            <span className="text-base-content/55 ml-1.5 font-normal">{t('optional')}</span>
          </legend>
          <input
            type="datetime-local"
            value={toLocalDatetime(state.applicationDeadlineAt)}
            onChange={(e) => update({ applicationDeadlineAt: fromLocalDatetime(e.target.value) })}
            className={`input input-bordered w-full${err('applicationDeadlineAt') ? ' input-error' : ''}`}
          />
          {err('applicationDeadlineAt') && <p className="label text-error">{t(`validation_reason_${err('applicationDeadlineAt')!.reason}`)}</p>}
        </fieldset>
      </div>
    </SectionShell>
  );
}

function toLocalDatetime(iso: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
function fromLocalDatetime(local: string): string {
  if (!local) return '';
  return new Date(local).toISOString();
}
