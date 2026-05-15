'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { HireModal } from './applications/HireModal';
import { RejectModal } from './applications/RejectModal';
import { transitionApplication } from './applications/transitionApplication';

type Status = 'applied' | 'reviewed' | 'hired' | 'rejected' | 'withdrawn';

type Props = {
  locale: string;
  applicationId: string;
  currentStatus: Status;
  workerName: string;
  jobTitle: string;
};

export function ApplicantActions({
  locale,
  applicationId,
  currentStatus,
  workerName,
  jobTitle,
}: Props) {
  const t = useTranslations('employer.applicant_detail');
  const router = useRouter();

  const [modal, setModal] = useState<'hire' | 'reject' | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canReview = currentStatus === 'applied';
  const canHire = currentStatus === 'applied' || currentStatus === 'reviewed';
  const canReject = currentStatus === 'applied' || currentStatus === 'reviewed';

  async function markReviewed() {
    setBusy(true);
    setError(null);
    const res = await transitionApplication(locale, applicationId, {
      toStatus: 'reviewed',
    });
    setBusy(false);
    if (!res.ok) {
      setError(res.message || 'Failed.');
      return;
    }
    router.refresh();
  }

  function onSuccess() {
    setModal(null);
    router.refresh();
  }

  return (
    <>
      <div className="border-base-300 mt-6 flex flex-wrap gap-2 border-t pt-6">
        {canReview && (
          <button
            type="button"
            disabled={busy}
            onClick={markReviewed}
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
        <HireModal
          locale={locale}
          applicationId={applicationId}
          workerName={workerName}
          onClose={() => setModal(null)}
          onSuccess={onSuccess}
        />
      )}
      {modal === 'reject' && (
        <RejectModal
          locale={locale}
          applicationId={applicationId}
          workerName={workerName}
          jobTitle={jobTitle}
          onClose={() => setModal(null)}
          onSuccess={onSuccess}
        />
      )}
    </>
  );
}
