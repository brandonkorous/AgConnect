'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { isOk } from '@agconn/api-client';
import { getApiClient } from '@/lib/api/client';

type Status = 'applied' | 'reviewed' | 'hired' | 'rejected' | 'withdrawn';

type Props = {
  locale: string;
  applicationId: string;
  currentStatus: Status;
  workerName: string;
  jobTitle: string;
};

export function ApplicantActions({ locale, applicationId, currentStatus, workerName, jobTitle }: Props) {
  const t = useTranslations('employer.applicant_detail');
  const tHire = useTranslations('employer.hire_modal');
  const tReject = useTranslations('employer.reject_modal');
  const router = useRouter();

  const [modal, setModal] = useState<'hire' | 'reject' | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function transition(payload: Record<string, unknown>) {
    setBusy(true);
    setError(null);
    try {
      const client = getApiClient(locale === 'es' ? 'es' : 'en');
      const res = await client.post(
        `/v1/employer/applications/${applicationId}/transition`,
        payload,
        { handleErrorInline: true },
      );
      if (!isOk(res)) {
        setError(res.error.message || 'Failed.');
        return;
      }
      setModal(null);
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  const canReview = currentStatus === 'applied';
  const canHire = currentStatus === 'applied' || currentStatus === 'reviewed';
  const canReject = currentStatus === 'applied' || currentStatus === 'reviewed';

  return (
    <>
      <div className="border-base-300 mt-6 flex flex-wrap gap-2 border-t pt-6">
        {canReview && (
          <button
            type="button"
            disabled={busy}
            onClick={() => transition({ toStatus: 'reviewed' })}
            className="btn btn-ghost border-base-300 btn-sm border"
          >
            {t('mark_reviewed')}
          </button>
        )}
        {canHire && (
          <button
            type="button"
            disabled={busy}
            onClick={() => setModal('hire')}
            className="btn btn-primary btn-sm"
          >
            {t('hire')}
          </button>
        )}
        {canReject && (
          <button
            type="button"
            disabled={busy}
            onClick={() => setModal('reject')}
            className="btn btn-ghost border-error/30 text-error btn-sm border"
          >
            {t('reject')}
          </button>
        )}
      </div>
      {error && <div className="alert alert-error mt-3 text-sm">{error}</div>}

      {modal === 'hire' && (
        <Modal title={tHire('title', { name: workerName })} onClose={() => setModal(null)}>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const f = new FormData(e.currentTarget);
              transition({
                toStatus: 'hired',
                wageOffered: Number(f.get('wage') ?? 0),
                startDate: String(f.get('start') ?? ''),
                note: String(f.get('note') ?? '') || undefined,
              });
            }}
          >
            <fieldset className="fieldset">
              <legend className="fieldset-legend">{tHire('wage_label')}</legend>
              <input name="wage" type="number" step="0.5" min="0" required className="input w-full" />
              <p className="label">{tHire('wage_help')}</p>
            </fieldset>
            <fieldset className="fieldset">
              <legend className="fieldset-legend">{tHire('start_date')}</legend>
              <input name="start" type="date" required className="input w-full" />
            </fieldset>
            <fieldset className="fieldset">
              <legend className="fieldset-legend">{tHire('note')}</legend>
              <textarea name="note" rows={2} className="textarea w-full" />
            </fieldset>
            <p className="text-base-content/60 mt-3 text-xs">{tHire('notify', { name: workerName })}</p>
            <div className="mt-4 flex justify-end gap-2">
              <button type="button" onClick={() => setModal(null)} className="btn btn-ghost btn-sm">
                {tHire('cancel')}
              </button>
              <button type="submit" disabled={busy} className="btn btn-primary btn-sm">
                {tHire('confirm')}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {modal === 'reject' && (
        <Modal title={tReject('title', { name: workerName })} onClose={() => setModal(null)}>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const f = new FormData(e.currentTarget);
              transition({
                toStatus: 'rejected',
                rejectionReason: String(f.get('reason') ?? '') || undefined,
                rejectionReasonText: String(f.get('details') ?? '') || undefined,
              });
            }}
          >
            <fieldset className="fieldset">
              <legend className="fieldset-legend">{tReject('reason_label')}</legend>
              {(['not_qualified', 'too_far', 'position_filled', 'no_response', 'other'] as const).map((r) => (
                <label key={r} className="label cursor-pointer justify-start gap-3 py-1">
                  <input type="radio" name="reason" value={r} className="radio radio-sm" />
                  <span className="text-sm">{tReject(`reason.${r}`)}</span>
                </label>
              ))}
            </fieldset>
            <fieldset className="fieldset">
              <legend className="fieldset-legend">{tReject('details')}</legend>
              <textarea name="details" rows={2} className="textarea w-full" />
            </fieldset>
            <p className="text-base-content/60 mt-3 text-xs">
              {tReject('preview', { name: workerName, employer: 'Sunridge', jobTitle })}
            </p>
            <div className="mt-4 flex justify-end gap-2">
              <button type="button" onClick={() => setModal(null)} className="btn btn-ghost btn-sm">
                {tReject('cancel')}
              </button>
              <button type="submit" disabled={busy} className="btn btn-error btn-sm">
                {tReject('confirm')}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}

function Modal({
  title,
  children,
  onClose,
}: {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div
        role="dialog"
        aria-modal="true"
        className="bg-base-100 w-full max-w-md rounded-2xl p-6 shadow-xl"
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-semibold">{title}</h2>
          <button type="button" onClick={onClose} className="text-base-content/50 hover:text-base-content">
            ×
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
