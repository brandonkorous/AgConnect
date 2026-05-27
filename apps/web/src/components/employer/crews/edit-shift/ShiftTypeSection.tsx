'use client';

import { useTranslations } from 'next-intl';
import {
  faBriefcase,
  faGraduationCap,
  faMinus,
  faStar,
} from '@fortawesome/free-solid-svg-icons';
import type { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import type { ShiftType } from '@/lib/api/hooks/employer-ops';
import { RadioCard } from '@/components/employer/primitives';
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
      <div className="grid grid-cols-1 gap-2.5 md:grid-cols-2 lg:grid-cols-4">
        {TYPES.map((type) => (
          <RadioCard<ShiftType>
            key={type.k}
            name="shiftType"
            value={type.k}
            checked={value === type.k}
            onChange={onChange}
            icon={type.icon}
            title={t(`option.${type.k}.label`)}
            description={t(`option.${type.k}.desc`)}
          />
        ))}
      </div>
    </SectionCard>
  );
}
