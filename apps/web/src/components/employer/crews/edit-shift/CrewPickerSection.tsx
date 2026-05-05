'use client';

import Link from 'next/link';
import type { Route } from 'next';
import { useTranslations } from 'next-intl';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheck, faPlus } from '@fortawesome/free-solid-svg-icons';
import type { CrewColor, CrewView } from '@/lib/api/employer-ops';
import { SectionCard } from './SectionCard';

const COLOR_BG: Record<CrewColor, string> = {
  grape: 'bg-[#6B2B5E]',
  almond: 'bg-[#C58A5A]',
  citrus: 'bg-[#E07A1F]',
  tomato: 'bg-[#C73E2A]',
  lettuce: 'bg-[#4A8C3A]',
  olive: 'bg-primary',
};

type Props = {
  crews: CrewView[];
  value: string | null;
  onChange: (crewId: string | null) => void;
  locale: string;
};

export function CrewPickerSection({ crews, value, onChange, locale }: Props) {
  const t = useTranslations('employer.crews.edit_shift.crew_picker');

  return (
    <SectionCard id="crew" title={t('title')} sub={t('sub')}>
      <div className="grid gap-2.5 md:grid-cols-2">
        <CrewCardOption
          name="crew"
          value=""
          checked={value === null}
          onChange={() => onChange(null)}
          title={t('none_label')}
          description={t('none_help')}
          chip={
            <span className="bg-base-200 border-base-300 grid h-9 w-9 place-items-center rounded-xl border font-mono text-xs font-bold">
              —
            </span>
          }
        />
        {crews.map((c) => {
          const initial =
            c.shortCode?.charAt(0).toUpperCase() ||
            c.name.replace(/^Crew\s+/i, '').charAt(0).toUpperCase() ||
            c.name.charAt(0).toUpperCase();
          return (
            <CrewCardOption
              key={c.id}
              name="crew"
              value={c.id}
              checked={c.id === value}
              onChange={() => onChange(c.id)}
              title={c.name}
              description={`${c.foremanName ?? t('hiring_foreman')} · ${c.memberCount} ${t('size_short')}`}
              chip={
                <span
                  className={[
                    'grid h-9 w-9 place-items-center rounded-xl font-display text-base font-light text-white',
                    COLOR_BG[c.color] ?? 'bg-primary',
                  ].join(' ')}
                >
                  {initial}
                </span>
              }
            />
          );
        })}
      </div>
      <div className="mt-3.5">
        <Link
          href={`/${locale}/employer/crews/new` as Route}
          className="text-primary hover:text-primary/80 inline-flex cursor-pointer items-center gap-1.5 text-xs font-semibold"
        >
          <FontAwesomeIcon icon={faPlus} className="h-2.5 w-2.5" />
          {t('create_crew')}
        </Link>
      </div>
    </SectionCard>
  );
}

function CrewCardOption({
  name,
  value,
  checked,
  onChange,
  title,
  description,
  chip,
}: {
  name: string;
  value: string;
  checked: boolean;
  onChange: () => void;
  title: string;
  description: string;
  chip: React.ReactNode;
}) {
  const stateClasses = checked
    ? 'border-primary ring-2 ring-primary/30 bg-primary/5'
    : 'border-base-300 bg-base-100 hover:border-base-content/30';
  return (
    <label
      className={[
        'flex items-center gap-3 rounded-2xl border p-3.5 transition-colors',
        'focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2',
        'cursor-pointer',
        stateClasses,
      ].join(' ')}
    >
      <input
        type="radio"
        name={name}
        value={value}
        checked={checked}
        onChange={onChange}
        className="sr-only"
      />
      {chip}
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold leading-snug">{title}</span>
        <span className="text-base-content/60 mt-0.5 block text-[11px] leading-snug">
          {description}
        </span>
      </span>
      {checked && (
        <span className="bg-primary text-primary-content grid h-5 w-5 place-items-center rounded-full">
          <FontAwesomeIcon icon={faCheck} className="h-2.5 w-2.5" />
        </span>
      )}
    </label>
  );
}
