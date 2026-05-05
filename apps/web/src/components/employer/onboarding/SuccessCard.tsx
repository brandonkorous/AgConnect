'use client';

import { useTranslations } from 'next-intl';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCircleCheck } from '@fortawesome/free-solid-svg-icons';

type Props = { onContinue: () => void };

export function SuccessCard({ onContinue }: Props) {
  const t = useTranslations('employer.onboarding');

  return (
    <div className="bg-base-100 border-base-300 mx-auto w-full max-w-xl rounded-3xl border p-10 text-center shadow-md">
      <span className="bg-primary/10 text-primary mx-auto grid h-12 w-12 place-items-center rounded-full">
        <FontAwesomeIcon icon={faCircleCheck} className="h-5 w-5" />
      </span>
      <h1 className="font-display mt-5 text-3xl font-light leading-tight tracking-tight">
        {t('success.title')}
      </h1>
      <p className="text-base-content/65 mx-auto mt-3 max-w-md text-sm leading-relaxed">
        {t('success.body')}
      </p>
      <button
        type="button"
        onClick={onContinue}
        className="btn btn-primary mt-6 rounded-full font-semibold"
      >
        {t('success.cta')}
      </button>
    </div>
  );
}
