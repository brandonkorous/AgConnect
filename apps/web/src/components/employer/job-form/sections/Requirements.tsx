'use client';

import { useTranslations } from 'next-intl';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheck, faPlus } from '@fortawesome/free-solid-svg-icons';
import type { SkillLookupView } from '@/lib/api/employer';
import { SectionShell } from '../SectionShell';
import type { JobFormState, JobFormUpdate } from '../types';

const EXPERIENCE = ['none', 'one_year', 'three_years', 'five_years'] as const;
const AGES = ['sixteen', 'eighteen', 'twenty_one'] as const;

type Props = {
  state: JobFormState;
  update: JobFormUpdate;
  skills: SkillLookupView[];
  locale: string;
};

export function RequirementsSection({ state, update, skills, locale }: Props) {
  const t = useTranslations('employer.jobs.form_v2');

  function toggleSkill(slug: string) {
    const has = state.skills.includes(slug);
    update({
      skills: has ? state.skills.filter((s) => s !== slug) : [...state.skills, slug],
    });
  }

  return (
    <SectionShell num={4} id="s-requirements" title={t('req_title')} subtitle={t('req_sub')}>
      <fieldset className="fieldset">
        <legend className="fieldset-legend text-base-content/80 flex w-full items-baseline justify-between text-sm font-semibold">
          <span>{t('field_skills')}</span>
          <span className="text-base-content/55 text-[11px] font-normal">{t('hint_skills')}</span>
        </legend>
        <div className="flex flex-wrap gap-1.5">
          {skills.map((s) => {
            const on = state.skills.includes(s.slug);
            const label = locale === 'es' ? s.labelEs : s.labelEn;
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => toggleSkill(s.slug)}
                aria-pressed={on}
                className={[
                  'inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors',
                  on
                    ? 'bg-base-content text-base-100 border-base-content'
                    : 'bg-base-100 text-base-content/70 border-base-300 hover:border-base-content/40',
                ].join(' ')}
              >
                {on && <FontAwesomeIcon icon={faCheck} className="h-2.5 w-2.5" />}
                {label}
              </button>
            );
          })}
          <button
            type="button"
            disabled
            className="border-base-300 text-base-content/45 inline-flex cursor-not-allowed items-center gap-1 rounded-full border border-dashed px-3 py-1.5 text-xs font-semibold"
          >
            <FontAwesomeIcon icon={faPlus} className="h-2.5 w-2.5" />
            {t('skill_custom')}
          </button>
        </div>
      </fieldset>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <fieldset className="fieldset">
          <legend className="fieldset-legend text-base-content/80 text-sm font-semibold">
            {t('field_min_experience')}
          </legend>
          <select
            value={state.minExperience}
            onChange={(e) =>
              update({ minExperience: e.target.value as JobFormState['minExperience'] })
            }
            className="select select-bordered w-full"
          >
            {EXPERIENCE.map((k) => (
              <option key={k} value={k}>
                {t(`experience_${k}`)}
              </option>
            ))}
          </select>
        </fieldset>
        <fieldset className="fieldset">
          <legend className="fieldset-legend text-base-content/80 text-sm font-semibold">
            {t('field_min_age')}
          </legend>
          <select
            value={state.minAge}
            onChange={(e) => update({ minAge: e.target.value as JobFormState['minAge'] })}
            className="select select-bordered w-full"
          >
            {AGES.map((k) => (
              <option key={k} value={k}>
                {t(`age_${k}`)}
              </option>
            ))}
          </select>
        </fieldset>
      </div>

      <label className="bg-base-200 border-base-300 mt-4 flex cursor-pointer items-start gap-3 rounded-xl border p-3.5">
        <input
          type="checkbox"
          checked={state.autoMatchEnabled}
          onChange={(e) => update({ autoMatchEnabled: e.target.checked })}
          className="toggle toggle-primary toggle-sm mt-0.5"
        />
        <div className="min-w-0 flex-1">
          <div className="text-sm font-semibold">{t('automatch_label')}</div>
          <div className="text-base-content/55 mt-0.5 text-xs">{t('automatch_sub')}</div>
        </div>
      </label>
    </SectionShell>
  );
}
