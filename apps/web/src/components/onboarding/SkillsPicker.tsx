'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useOnboardingDraft } from '@/lib/useOnboardingDraft';
import { patchOnboardingAction } from '@/lib/api/onboarding-actions';
import { onboardingPath } from '@/lib/onboarding-steps';

const DEFAULT_SKILLS = [
  'harvesting',
  'pruning',
  'irrigation',
  'tractor',
  'forklift',
  'crew_lead',
  'bilingual',
  'packing',
  'equipment_repair',
  'pesticide',
] as const;

const MAX_SKILLS = 20;

type Props = { locale: string };

export function SkillsPicker({ locale }: Props) {
  const t = useTranslations('worker.onboarding');
  const router = useRouter();
  const { value, setValue, clear } = useOnboardingDraft<{ skills: string[] }>(
    'skills',
    { skills: [] },
  );
  const [custom, setCustom] = useState('');
  const [submitting, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const selected = new Set(value.skills);

  function toggle(label: string) {
    const next = new Set(selected);
    if (next.has(label)) next.delete(label);
    else if (next.size < MAX_SKILLS) next.add(label);
    setValue({ skills: Array.from(next) });
  }

  function addCustom() {
    const v = custom.trim();
    if (!v || v.length > 60 || selected.size >= MAX_SKILLS) return;
    if (!selected.has(v)) {
      setValue({ skills: [...value.skills, v] });
    }
    setCustom('');
  }

  function next() {
    if (value.skills.length === 0) return;
    setError(null);
    startTransition(async () => {
      const res = await patchOnboardingAction({ skills: value.skills });
      if (!res.ok) {
        setError(t('error.generic'));
        return;
      }
      await clear();
      router.push(onboardingPath(locale, 'availability'));
    });
  }

  return (
    <div className="grid gap-5">
      <div className="flex flex-wrap gap-2">
        {DEFAULT_SKILLS.map((key) => {
          const label = t(`skill.${key}` as 'skill.harvesting');
          const active = selected.has(label);
          return (
            <button
              type="button"
              key={key}
              aria-pressed={active}
              onClick={() => toggle(label)}
              className={[
                'rounded-full border px-3.5 py-2 text-sm font-medium transition-colors',
                active
                  ? 'bg-primary text-primary-content border-primary'
                  : 'bg-base-100 border-base-300 hover:bg-base-200',
              ].join(' ')}
            >
              {label}
            </button>
          );
        })}
        {Array.from(selected)
          .filter(
            (label) =>
              !DEFAULT_SKILLS.map((k) => t(`skill.${k}` as 'skill.harvesting')).includes(label),
          )
          .map((label) => (
            <button
              type="button"
              key={label}
              onClick={() => toggle(label)}
              className="bg-secondary text-secondary-content rounded-full border px-3.5 py-2 text-sm font-medium"
            >
              {label} ✕
            </button>
          ))}
      </div>

      <fieldset className="fieldset">
        <legend className="fieldset-legend">{t('skill.add_custom')}</legend>
        <div className="flex gap-2">
          <input
            type="text"
            value={custom}
            onChange={(e) => setCustom(e.target.value)}
            maxLength={60}
            className="input input-bordered flex-1"
          />
          <button
            type="button"
            onClick={addCustom}
            disabled={!custom.trim() || selected.size >= MAX_SKILLS}
            className="btn btn-outline"
          >
            +
          </button>
        </div>
      </fieldset>

      <div className="text-base-content/60 text-sm">
        {selected.size} / {MAX_SKILLS}
      </div>

      {error && <div className="text-error text-[12px]">{error}</div>}
      <button
        type="button"
        onClick={next}
        disabled={selected.size === 0 || submitting}
        className="btn btn-primary btn-lg w-full"
      >
        {t('profile.continue')}
      </button>
    </div>
  );
}
