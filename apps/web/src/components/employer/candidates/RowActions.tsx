'use client';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheck, faComments } from '@fortawesome/free-solid-svg-icons';

type Props = {
  applicationId: string;
  messageLabel: string;
  hireLabel: string;
};

export function CandidateRowActions({ applicationId, messageLabel, hireLabel }: Props) {
  void applicationId;
  return (
    <div className="flex justify-end gap-1.5">
      <button
        type="button"
        aria-label={messageLabel}
        onClick={(e) => e.preventDefault()}
        className="bg-base-100 border-base-300 grid h-7 w-7 place-items-center rounded-md border"
      >
        <FontAwesomeIcon icon={faComments} className="h-3 w-3" />
      </button>
      <button
        type="button"
        aria-label={hireLabel}
        onClick={(e) => e.preventDefault()}
        className="bg-primary text-primary-content grid h-7 w-7 place-items-center rounded-md"
      >
        <FontAwesomeIcon icon={faCheck} className="h-3 w-3" />
      </button>
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
