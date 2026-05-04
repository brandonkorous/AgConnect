'use client';

import { useTranslations } from 'next-intl';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faBriefcase,
  faGraduationCap,
  faMinus,
  faStar,
  faCheck,
} from '@fortawesome/free-solid-svg-icons';
import type { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import type { ShiftType } from '@/lib/api/employer-ops';
import { SectionCard } from './SectionCard';

const TYPES: Array<{ k: ShiftType; icon: IconDefinition }> = [
  { k: 'work', icon: faBriefcase },
  { k: 'training', icon: faGraduationCap },
  { k: 'off', icon: faMinus },
  { k: 'holiday', icon: faStar },
];

type Props = {
  value: ShiftType;
  onChange: (next: ShiftType) => void;
};

export function ShiftTypeSection({ value, onChange }: Props) {
  const t = useTranslations('employer.crews.edit_shift.shift_type');

  return (
    <SectionCard id="type" title={t('title')} sub={t('sub')}>
      <div className="grid gap-2.5 md:grid-cols-2 lg:grid-cols-4">
        {TYPES.map((type) => {
          const sel = value === type.k;
          return (
            <button
              key={type.k}
              type="button"
              onClick={() => onChange(type.k)}
              className={[
                'relative cursor-pointer rounded-2xl p-4 text-left transition',
                sel
                  ? 'border-primary bg-primary/10 border-2'
                  : 'border-base-300 hover:border-base-content/30 hover:bg-base-200/40 border bg-base-100',
              ].join(' ')}
            >
              <FontAwesomeIcon
                icon={type.icon}
                className={[
                  'h-4 w-4',
                  sel ? 'text-primary' : 'text-base-content/40',
                ].join(' ')}
              />
              <div className="mt-2 text-sm font-semibold leading-tight">
                {t(`option.${type.k}.label`)}
              </div>
              <div className="text-base-content/60 mt-1 text-[11px]">
                {t(`option.${type.k}.desc`)}
              </div>
              {sel && (
                <span className="bg-primary text-primary-content absolute right-3 top-3 grid h-5 w-5 place-items-center rounded-full">
                  <FontAwesomeIcon icon={faCheck} className="h-2.5 w-2.5" />
                </span>
              )}
            </button>
          );
        })}
      </div>
    </SectionCard>
  );
}
