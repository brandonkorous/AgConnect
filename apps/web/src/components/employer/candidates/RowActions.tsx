'use client';

import { useState, type MouseEvent } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheck, faComments } from '@fortawesome/free-solid-svg-icons';
import { isOk } from '@agconn/api-client';
import { pushToast } from '@agconn/ui';
import { getApiClient } from '@/lib/api/client';
import { Modal } from '@/components/employer/primitives/Modal';

type Props = {
  applicationId: string;
  messageLabel: string;
  hireLabel: string;
};

export function CandidateRowActions({ applicationId, messageLabel, hireLabel }: Props) {
  const locale = useLocale();
  const t = useTranslations('employer.candidates.row');
  const router = useRouter();
  const [modal, setModal] = useState<'hire' | 'message' | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function stop(e: MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
  }

  async function quickHire(e: MouseEvent) {
    stop(e);
    setModal('hire');
  }

  async function quickMessage(e: MouseEvent) {
    stop(e);
    setModal('message');
  }

  async function submitHire(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const f = new FormData(e.currentTarget);
    try {
      const client = getApiClient(locale === 'es' ? 'es' : 'en');
      const res = await client.post(
        `/v1/employer/applications/${applicationId}/transition`,
        {
          toStatus: 'hired',
          wageOffered: Number(f.get('wage') ?? 0),
          startDate: String(f.get('start') ?? ''),
        },
        { handleErrorInline: true },
      );
      if (!isOk(res)) {
        setError(res.error.message || t('error_hire'));
        return;
      }
      setModal(null);
      pushToast({ variant: 'success', title: t('toast_hired') });
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  async function submitMessage(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const f = new FormData(e.currentTarget);
    const body = String(f.get('body') ?? '').trim();
    if (!body) {
      setBusy(false);
      return;
    }
    try {
      const client = getApiClient(locale === 'es' ? 'es' : 'en');
      const res = await client.post<{
        message: { id: string; conversationId: string };
      }>(
        `/v1/employer/applications/${applicationId}/message`,
        { body, channel: 'app' },
        { handleErrorInline: true },
      );
      if (!isOk(res)) {
        setError(res.error.message || t('error_message'));
        return;
      }
      setModal(null);
      router.push(`/${locale}/employer/messages?thread=${res.data.message.conversationId}`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex justify-end gap-1.5" onClick={stop}>
      <button
        type="button"
        aria-label={messageLabel}
        onClick={quickMessage}
        title={messageLabel}
        className="bg-base-100 border-base-300 hover:bg-base-200 grid h-7 w-7 place-items-center rounded-md border"
      >
        <FontAwesomeIcon icon={faComments} className="h-3 w-3" />
      </button>
      <button
        type="button"
        aria-label={hireLabel}
        onClick={quickHire}
        title={hireLabel}
        className="bg-primary text-primary-content hover:bg-primary/90 grid h-7 w-7 place-items-center rounded-md"
      >
        <FontAwesomeIcon icon={faCheck} className="h-3 w-3" />
      </button>

      {modal === 'hire' && (
        <Modal title={t('hire_title')} onClose={() => setModal(null)} size="sm">
          <form onSubmit={submitHire} onClick={stop}>
            {error && <div className="alert alert-error mb-3 text-xs">{error}</div>}
            <fieldset className="fieldset">
              <legend className="fieldset-legend">{t('wage_label')}</legend>
              <input
                name="wage"
                type="number"
                step="0.5"
                min="0"
                required
                className="input w-full"
                placeholder="22.50"
              />
            </fieldset>
            <fieldset className="fieldset">
              <legend className="fieldset-legend">{t('start_label')}</legend>
              <input name="start" type="date" required className="input w-full" />
            </fieldset>
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setModal(null)}
                className="btn btn-ghost btn-sm"
              >
                {t('cancel')}
              </button>
              <button type="submit" disabled={busy} className="btn btn-primary btn-sm">
                {busy ? '…' : t('confirm_hire')}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {modal === 'message' && (
        <Modal title={t('message_title')} onClose={() => setModal(null)} size="sm">
          <form onSubmit={submitMessage} onClick={stop}>
            {error && <div className="alert alert-error mb-3 text-xs">{error}</div>}
            <fieldset className="fieldset">
              <legend className="fieldset-legend">{t('message_label')}</legend>
              <textarea
                name="body"
                rows={4}
                required
                maxLength={2000}
                className="textarea w-full"
                placeholder={t('message_placeholder')}
                autoFocus
              />
            </fieldset>
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setModal(null)}
                className="btn btn-ghost btn-sm"
              >
                {t('cancel')}
              </button>
              <button type="submit" disabled={busy} className="btn btn-primary btn-sm">
                {busy ? '…' : t('confirm_message')}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

export function RowCheckbox() {
  return (
    <input
      type="checkbox"
      className="checkbox checkbox-xs"
      onClick={(e) => e.stopPropagation()}
      readOnly
    />
  );
}
