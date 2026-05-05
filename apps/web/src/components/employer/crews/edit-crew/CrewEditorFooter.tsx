'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheck } from '@fortawesome/free-solid-svg-icons';

type Props = {
  locale: string;
  mode: 'new' | 'edit';
  busy: boolean;
  canSubmit: boolean;
  isNameValid: boolean;
  isDirty: boolean;
  lastSavedAt: number | null;
  onSave: () => void;
};

export function CrewEditorFooter({
  locale,
  mode,
  busy,
  canSubmit,
  isNameValid,
  isDirty,
  lastSavedAt,
  onSave,
}: Props) {
  const t = useTranslations('employer.crews.edit_crew');

  return (
    <div className="bg-base-100 border-base-300 shadow-pop sticky bottom-4 z-10 mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border p-4">
      <div className="flex items-center gap-3">
        <span className="bg-primary/10 text-primary grid h-9 w-9 place-items-center rounded-full">
          <FontAwesomeIcon icon={faCheck} className="h-4 w-4" />
        </span>
        <div className="min-w-0">
          <div className="text-sm font-semibold">
            {saveBarTitle({ mode, isNameValid, isDirty, lastSavedAt, t })}
          </div>
          <div className="text-base-content/55 text-xs">
            {saveBarHelp({ mode, isNameValid, lastSavedAt, t })}
          </div>
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        <Link
          href={`/${locale}/employer/crews`}
          className="btn btn-ghost btn-sm border-base-300 rounded-full border"
        >
          {t('footer_cancel')}
        </Link>
        <button
          type="button"
          onClick={onSave}
          disabled={busy || !canSubmit}
          className={[
            'btn btn-primary btn-sm rounded-full',
            !canSubmit ? 'btn-disabled' : '',
          ].join(' ')}
        >
          <FontAwesomeIcon icon={faCheck} className="h-3 w-3" />
          {busy ? '…' : mode === 'new' ? t('footer_create') : t('footer_save')}
        </button>
      </div>
    </div>
  );
}

function saveBarTitle({
  mode,
  isNameValid,
  isDirty,
  lastSavedAt,
  t,
}: {
  mode: 'new' | 'edit';
  isNameValid: boolean;
  isDirty: boolean;
  lastSavedAt: number | null;
  t: ReturnType<typeof useTranslations>;
}): string {
  if (mode === 'edit' && lastSavedAt != null && !isDirty) {
    return t('save_bar_saved', { ago: relativeTime(lastSavedAt, t) });
  }
  if (mode === 'new') {
    return isNameValid ? t('save_bar_new') : t('save_bar_new_incomplete');
  }
  return isDirty ? t('save_bar_edit') : t('save_bar_edit_clean');
}

function saveBarHelp({
  mode,
  isNameValid,
  lastSavedAt,
  t,
}: {
  mode: 'new' | 'edit';
  isNameValid: boolean;
  lastSavedAt: number | null;
  t: ReturnType<typeof useTranslations>;
}): string {
  if (mode === 'edit' && lastSavedAt != null) {
    return t('save_bar_help_edit');
  }
  if (mode === 'new' && !isNameValid) {
    return t('save_bar_help_new_incomplete');
  }
  return mode === 'new' ? t('save_bar_help_new') : t('save_bar_help_edit');
}

function relativeTime(ts: number, t: ReturnType<typeof useTranslations>): string {
  const seconds = Math.max(0, Math.floor((Date.now() - ts) / 1000));
  if (seconds < 45) return t('relative_just_now');
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return t('relative_minutes', { n: minutes });
  const hours = Math.floor(minutes / 60);
  return t('relative_hours', { n: hours });
}
