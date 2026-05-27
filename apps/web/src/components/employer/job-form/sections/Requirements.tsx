'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheck, faPlus, faXmark } from '@fortawesome/free-solid-svg-icons';
import type { SkillLookupView } from '@/lib/api/hooks/employer';
import { CheckboxCard } from '@/components/employer/primitives';
import { SectionShell } from '../SectionShell';
import type { JobFormState, JobFormUpdate } from '../types';
import type { ErrorMap } from '../validation';

const EXPERIENCE = ['none', 'one_year', 'three_years', 'five_years'] as const;
const AGES = ['sixteen', 'eighteen', 'twenty_one'] as const;
const CUSTOM_PREFIX = 'custom:';

type Props = {
    state: JobFormState;
    update: JobFormUpdate;
    skills: SkillLookupView[];
    locale: string;
    errors?: ErrorMap;
};

export function RequirementsSection({ state, update, skills, locale, errors = {} }: Props) {
    const t = useTranslations('employer.jobs.form_v2');
    const err = (path: string) => errors[path];
    const [showCustom, setShowCustom] = useState(false);
    const [customDraft, setCustomDraft] = useState('');

    function toggleSkill(slug: string) {
        const has = state.skills.includes(slug);
        update({
            skills: has ? state.skills.filter((s) => s !== slug) : [...state.skills, slug],
        });
    }

    function addCustomSkill() {
        const label = customDraft.trim();
        if (!label) return;
        const slug = `${CUSTOM_PREFIX}${label}`;
        if (state.skills.includes(slug)) {
            setCustomDraft('');
            setShowCustom(false);
            return;
        }
        update({ skills: [...state.skills, slug] });
        setCustomDraft('');
        setShowCustom(false);
    }

    function removeCustom(slug: string) {
        update({ skills: state.skills.filter((s) => s !== slug) });
    }

    const customSkills = state.skills.filter((s) => s.startsWith(CUSTOM_PREFIX));

    return (
        <SectionShell num={4} id="s-requirements" title={t('req_title')} subtitle={t('req_sub')}>
            <fieldset className="fieldset w-full min-w-0">
                <legend className="fieldset-legend text-base-content/80 flex w-full items-baseline justify-between text-sm font-semibold">
                    <span>{t('field_skills')}</span>
                    <span className="text-base-content/55 text-xs font-normal">{t('hint_skills')}</span>
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
                                className={`badge badge-lg ${on ? 'badge-neutral' : 'badge-outline'} cursor-pointer gap-1`}
                            >
                                {on && <FontAwesomeIcon icon={faCheck} className="h-2.5 w-2.5" />}
                                {label}
                            </button>
                        );
                    })}
                    {customSkills.map((slug) => {
                        const label = slug.slice(CUSTOM_PREFIX.length);
                        return (
                            <span key={slug} className="badge badge-lg badge-neutral gap-1">
                                <FontAwesomeIcon icon={faCheck} className="h-2.5 w-2.5" />
                                {label}
                                <button
                                    type="button"
                                    onClick={() => removeCustom(slug)}
                                    aria-label={t('skill_custom_remove')}
                                    className="ml-0.5 opacity-70 hover:opacity-100"
                                >
                                    <FontAwesomeIcon icon={faXmark} className="h-2.5 w-2.5" />
                                </button>
                            </span>
                        );
                    })}
                    <button
                        type="button"
                        onClick={() => setShowCustom((v) => !v)}
                        className="badge badge-lg badge-outline border-dashed gap-1 cursor-pointer"
                    >
                        <FontAwesomeIcon icon={faPlus} className="h-2.5 w-2.5" />
                        {t('skill_custom_add')}
                    </button>
                </div>
                {showCustom && (
                    <div className="mt-2 flex items-center gap-2">
                        <input
                            type="text"
                            value={customDraft}
                            onChange={(e) => setCustomDraft(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    e.preventDefault();
                                    addCustomSkill();
                                }
                            }}
                            maxLength={40}
                            placeholder={t('skill_custom_placeholder')}
                            className="input input-bordered input-sm flex-1"
                            aria-label={t('skill_custom_add')}
                        />
                        <button
                            type="button"
                            onClick={addCustomSkill}
                            disabled={!customDraft.trim()}
                            className="btn btn-sm btn-primary rounded-full"
                        >
                            {t('screening_add_short')}
                        </button>
                    </div>
                )}
                {err('skills') && <p className="label text-error">{t(`validation_reason_${err('skills')!.reason}`)}</p>}
            </fieldset>

            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <fieldset className="fieldset w-full min-w-0">
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
                <fieldset className="fieldset w-full min-w-0">
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

            <div className="mt-4">
                <CheckboxCard
                    variant="toggle"
                    checked={state.autoMatchEnabled}
                    onChange={(v) => update({ autoMatchEnabled: v })}
                    title={t('automatch_label')}
                    description={t('automatch_sub')}
                />
            </div>
        </SectionShell>
    );
}
