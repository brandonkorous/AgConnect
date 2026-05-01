'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';

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

type Props = { locale: string };

const MAX_SKILLS = 20;

export function SkillsPicker({ locale }: Props) {
  const t = useTranslations('worker.onboarding');
  const router = useRouter();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [custom, setCustom] = useState('');

  function toggle(key: string) {
    const next = new Set(selected);
    if (next.has(key)) next.delete(key);
    else if (next.size < MAX_SKILLS) next.add(key);
    setSelected(next);
  }

  function addCustom() {
    const v = custom.trim();
    if (!v || v.length > 60 || selected.size >= MAX_SKILLS) return;
    const next = new Set(selected);
    next.add(v);
    setSelected(next);
    setCustom('');
  }

  function next() {
    if (selected.size === 0) return;
    if (typeof window !== 'undefined') {
      const existing = JSON.parse(
        window.localStorage.getItem('agconn:onboarding:profile') ?? '{}',
      );
      window.localStorage.setItem(
        'agconn:onboarding:profile',
        JSON.stringify({ ...existing, skills: Array.from(selected) }),
      );
    }
    router.push(`/${locale}/onboarding/availability`);
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
        {/* Custom chips that aren't in the default list */}
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

      <button
        type="button"
        onClick={next}
        disabled={selected.size === 0}
        className="btn btn-primary btn-lg w-full"
      >
        {t('profile.continue')}
      </button>
    </div>
  );
}
