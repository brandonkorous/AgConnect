'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Modal } from './Modal';
import { transitionApplication } from './transitionApplication';

type Props = {
  locale: string;
  applicationId: string;
  workerName: string;
  jobTitle: string;
  employerDisplayName?: string;
  onClose: () => void;
  onSuccess: () => void;
};

const REASONS = ['not_qualified', 'too_far', 'position_filled', 'no_response', 'other'] as const;

export function RejectModal({
  locale,
  applicationId,
  workerName,
  jobTitle,
  employerDisplayName,
  onClose,
  onSuccess,
}: Props) {
  const t = useTranslations('employer.reject_modal');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const reason = String(f.get('reason') ?? '');
    const details = String(f.get('details') ?? '');
    setBusy(true);
    setError(null);
    const res = await transitionApplication(locale, applicationId, {
      toStatus: 'rejected',
      rejectionReason: reason || undefined,
      rejectionReasonText: details || undefined,
    });
    setBusy(false);
    if (!res.ok) {
      setError(res.message || 'Failed.');
      return;
    }
    onSuccess();
  }

  return (
    <Modal title={t('title', { name: workerName })} onClose={onClose}>
      <form onSubmit={submit}>
        <fieldset className="fieldset">
          <legend className="fieldset-legend">{t('reason_label')}</legend>
          {REASONS.map((r) => (
            <label key={r} className="label cursor-pointer justify-start gap-3 py-1">
              <input type="radio" name="reason" value={r} className="radio radio-sm" />
              <span className="text-sm">{t(`reason.${r}`)}</span>
            </label>
          ))}
        </fieldset>
        <fieldset className="fieldset">
          <legend className="fieldset-legend">{t('details')}</legend>
          <textarea name="details" rows={2} className="textarea w-full" />
        </fieldset>
        <p className="text-base-content/60 mt-3 text-xs">
          {t('preview', {
            name: workerName,
            employer: employerDisplayName ?? '',
            jobTitle,
          })}
        </p>
        {error && <div className="alert alert-error mt-3 text-sm">{error}</div>}
        <div className="mt-4 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="btn btn-ghost btn-sm">
            {t('cancel')}
          </button>
          <button type="submit" disabled={busy} className="btn btn-error btn-sm">
            {t('confirm')}
          </button>
        </div>
      </form>
    </Modal>
  );
}
