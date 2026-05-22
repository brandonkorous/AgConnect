'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheck } from '@fortawesome/free-solid-svg-icons';

type Props = {
  locale: string;
  shiftDate: string;
  isComplete: boolean;
  shiftCount: number;
  busy: boolean;
  onCreate: () => void;
};

export function NewShiftFooter({
  locale,
  shiftDate,
  isComplete,
  shiftCount,
  busy,
  onCreate,
}: Props) {
  const t = useTranslations('employer.crews.new_shift');

  return (
    <div className="bg-base-100 border-base-300 shadow-pop sticky bottom-4 z-10 mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border p-4">
      <div className="flex items-center gap-3">
        <span
          className={[
            'grid h-9 w-9 place-items-center rounded-full',
            isComplete ? 'bg-primary/10 text-primary' : 'bg-base-200 text-base-content/50',
          ].join(' ')}
        >
          <FontAwesomeIcon icon={faCheck} className="h-4 w-4" />
        </span>
        <div className="min-w-0">
          <div className="text-sm font-semibold">
            {isComplete ? t('save_bar_complete') : t('save_bar_incomplete')}
          </div>
          <div className="text-base-content/55 text-xs">
            {!isComplete
              ? t('save_bar_help_incomplete')
              : t('save_bar_series', { count: shiftCount })}
          </div>
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        <Link
          href={`/${locale}/employer/crews?week=${shiftDate}`}
          className="btn btn-ghost btn-sm border-base-300 rounded-full border"
        >
          {t('footer_cancel')}
        </Link>
        <button
          type="button"
          onClick={onCreate}
          disabled={busy || !isComplete}
          className={[
            'btn btn-primary btn-sm rounded-full',
            !isComplete ? 'btn-disabled' : '',
          ].join(' ')}
        >
          {busy ? (
            <span className="loading loading-spinner loading-sm" aria-hidden />
          ) : (
            <FontAwesomeIcon icon={faCheck} className="h-3 w-3" />
          )}
          {t('footer_create')}
        </button>
      </div>
    </div>
  );
}
