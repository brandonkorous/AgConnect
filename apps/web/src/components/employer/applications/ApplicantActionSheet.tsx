'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import type { Route } from 'next';
import { useTranslations } from 'next-intl';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEye, faCheck, faHandshake, faXmark } from '@fortawesome/free-solid-svg-icons';

type Status = 'applied' | 'reviewed' | 'hired' | 'rejected' | 'withdrawn';

type Props = {
  workerName: string;
  detailHref: string;
  currentStatus: Status;
  onClose: () => void;
  onMarkReviewed: () => void;
  onHire: () => void;
  onReject: () => void;
};

export function ApplicantActionSheet({
  workerName,
  detailHref,
  currentStatus,
  onClose,
  onMarkReviewed,
  onHire,
  onReject,
}: Props) {
  const t = useTranslations('employer.applicant_detail');
  const tKan = useTranslations('employer.kanban');

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const canReview = currentStatus === 'applied';
  const canHire = currentStatus === 'applied' || currentStatus === 'reviewed';
  const canReject = currentStatus === 'applied' || currentStatus === 'reviewed';

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-label={workerName}
    >
      <div className="bg-base-100 w-full max-w-md rounded-t-2xl p-4 shadow-xl">
        <div className="mb-3 flex items-center justify-between">
          <div className="text-sm font-semibold">{workerName}</div>
          <button
            type="button"
            onClick={onClose}
            aria-label={tKan('cancel')}
            className="text-base-content/50 hover:text-base-content p-1"
          >
            <FontAwesomeIcon icon={faXmark} className="h-4 w-4" />
          </button>
        </div>
        <div className="flex flex-col gap-2">
          <Link
            href={detailHref as Route}
            className="btn btn-ghost border-base-300 justify-start border"
          >
            <FontAwesomeIcon icon={faEye} className="mr-2 h-3 w-3" />
            {t('back')}
          </Link>
          {canReview && (
            <button
              type="button"
              onClick={onMarkReviewed}
              className="btn btn-ghost border-base-300 justify-start border"
            >
              <FontAwesomeIcon icon={faCheck} className="mr-2 h-3 w-3" />
              {t('mark_reviewed')}
            </button>
          )}
          {canHire && (
            <button
              type="button"
              onClick={onHire}
              className="btn btn-primary justify-start"
            >
              <FontAwesomeIcon icon={faHandshake} className="mr-2 h-3 w-3" />
              {t('hire')}
            </button>
          )}
          {canReject && (
            <button
              type="button"
              onClick={onReject}
              className="btn btn-ghost border-error/30 text-error justify-start border"
            >
              <FontAwesomeIcon icon={faXmark} className="mr-2 h-3 w-3" />
              {t('reject')}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
