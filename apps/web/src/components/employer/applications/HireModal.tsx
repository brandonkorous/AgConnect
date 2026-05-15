'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Modal } from './Modal';
import { transitionApplication } from './transitionApplication';

type Props = {
  locale: string;
  applicationId: string;
  workerName: string;
  onClose: () => void;
  onSuccess: () => void;
};

export function HireModal({ locale, applicationId, workerName, onClose, onSuccess }: Props) {
  const t = useTranslations('employer.hire_modal');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const wage = Number(f.get('wage') ?? 0);
    const start = String(f.get('start') ?? '');
    const note = String(f.get('note') ?? '');
    if (!(wage > 0) || !start) return;
    setBusy(true);
    setError(null);
    const res = await transitionApplication(locale, applicationId, {
      toStatus: 'hired',
      wageOffered: wage,
      startDate: start,
      note: note || undefined,
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
          <legend className="fieldset-legend">{t('wage_label')}</legend>
          <input
            name="wage"
            type="number"
            step="0.5"
            min="0"
            required
            className="input w-full"
          />
          <p className="label">{t('wage_help')}</p>
        </fieldset>
        <fieldset className="fieldset">
          <legend className="fieldset-legend">{t('start_date')}</legend>
          <input name="start" type="date" required className="input w-full" />
        </fieldset>
        <fieldset className="fieldset">
          <legend className="fieldset-legend">{t('note')}</legend>
          <textarea name="note" rows={2} className="textarea w-full" />
        </fieldset>
        <p className="text-base-content/60 mt-3 text-xs">
          {t('notify', { name: workerName })}
        </p>
        {error && <div className="alert alert-error mt-3 text-sm">{error}</div>}
        <div className="mt-4 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="btn btn-ghost btn-sm">
            {t('cancel')}
          </button>
          <button type="submit" disabled={busy} className="btn btn-primary btn-sm">
            {t('confirm')}
          </button>
        </div>
      </form>
    </Modal>
  );
}
