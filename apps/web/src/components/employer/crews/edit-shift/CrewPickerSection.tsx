'use client';

import Link from 'next/link';
import type { Route } from 'next';
import { useTranslations } from 'next-intl';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheck, faPlus } from '@fortawesome/free-solid-svg-icons';
import type { CrewColor, CrewView } from '@/lib/api/employer-ops';
import { SectionCard } from './SectionCard';

// Schedule-color swatches. Mirrors edit-crew/types.ts CREW_COLORS so a crew
// reads the same wherever it appears.
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
        <button
          type="button"
          onClick={() => onChange(null)}
          className={[
            'relative cursor-pointer rounded-2xl p-3.5 text-left transition',
            value === null
              ? 'border-primary bg-primary/10 border-2'
              : 'border-base-300 hover:border-base-content/30 hover:bg-base-200/40 border bg-base-100',
          ].join(' ')}
        >
          <div className="flex items-center gap-3">
            <span className="bg-base-200 border-base-300 grid h-9 w-9 place-items-center rounded-xl border font-mono text-xs font-bold">
              —
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-semibold">{t('none_label')}</span>
              <span className="text-base-content/60 block text-[11px]">{t('none_help')}</span>
            </span>
            {value === null && (
              <span className="bg-primary text-primary-content grid h-5 w-5 place-items-center rounded-full">
                <FontAwesomeIcon icon={faCheck} className="h-2.5 w-2.5" />
              </span>
            )}
          </div>
        </button>
        {crews.map((c) => {
          const sel = c.id === value;
          const initial =
            c.shortCode?.charAt(0).toUpperCase() ||
            c.name.replace(/^Crew\s+/i, '').charAt(0).toUpperCase() ||
            c.name.charAt(0).toUpperCase();
          return (
            <button
              key={c.id}
              type="button"
              onClick={() => onChange(c.id)}
              className={[
                'relative cursor-pointer rounded-2xl p-3.5 text-left transition',
                sel
                  ? 'border-primary bg-primary/10 border-2'
                  : 'border-base-300 hover:border-base-content/30 hover:bg-base-200/40 border bg-base-100',
              ].join(' ')}
            >
              <div className="flex items-center gap-3">
                <span
                  className={[
                    'grid h-9 w-9 place-items-center rounded-xl font-display text-base font-light text-white',
                    COLOR_BG[c.color] ?? 'bg-primary',
                  ].join(' ')}
                >
                  {initial}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold leading-snug">{c.name}</span>
                  <span className="text-base-content/60 mt-0.5 block text-[11px] leading-snug">
                    {c.foremanName ?? t('hiring_foreman')} · {c.memberCount} {t('size_short')}
                  </span>
                </span>
                {sel && (
                  <span className="bg-primary text-primary-content grid h-5 w-5 place-items-center rounded-full">
                    <FontAwesomeIcon icon={faCheck} className="h-2.5 w-2.5" />
                  </span>
                )}
              </div>
            </button>
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
