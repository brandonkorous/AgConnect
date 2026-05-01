'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus } from '@fortawesome/free-solid-svg-icons';
import { NewCrewModal } from './NewCrewModal';

type Props = {
  variant?: 'primary' | 'ghost' | 'cta';
};

export function NewCrewButton({ variant = 'ghost' }: Props) {
  const t = useTranslations('employer.crews');
  const [open, setOpen] = useState(false);

  const className =
    variant === 'primary'
      ? 'btn btn-sm btn-primary rounded-full'
      : variant === 'cta'
        ? 'btn btn-primary rounded-full'
        : 'btn btn-sm bg-base-100 border-base-300 rounded-full border font-medium';

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={className}>
        <FontAwesomeIcon icon={faPlus} className="h-3 w-3" />
        {t('new_crew_label')}
      </button>
      <NewCrewModal open={open} onClose={() => setOpen(false)} />
    </>
  );
}
