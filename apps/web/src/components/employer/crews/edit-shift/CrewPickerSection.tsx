'use client';

import Link from 'next/link';
import type { Route } from 'next';
import { useTranslations } from 'next-intl';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus } from '@fortawesome/free-solid-svg-icons';
import type { CrewColor, CrewView } from '@/lib/api/employer-ops';
import { RadioCard } from '@/components/employer/primitives';
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
      <div className="grid grid-cols-1 gap-2.5 md:grid-cols-2">
        <RadioCard<string>
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
            <RadioCard<string>
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
