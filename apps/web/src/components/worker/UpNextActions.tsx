'use client';

import { useState, useTransition } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheck, faLocationDot, faXmark } from '@fortawesome/free-solid-svg-icons';
import { confirmShiftAction, declineShiftAction } from '@/lib/api/me-actions';
import type { ShiftRow } from '@/lib/api/me';

type Props = {
    assignmentId: string;
    status: ShiftRow['status'];
    locale: string;
    directionsUrl: string;
    labels: {
        confirm: string;
        decline: string;
        directions: string;
        error: string;
    };
};

export function UpNextActions({
    assignmentId,
    status,
    directionsUrl,
    labels,
}: Props) {
    const [isPending, startTransition] = useTransition();
    const [error, setError] = useState<string | null>(null);
    const [optimisticStatus, setOptimisticStatus] = useState<ShiftRow['status']>(status);

    const isConfirmed = optimisticStatus === 'confirmed' || optimisticStatus === 'attended';
    const isDeclined = optimisticStatus === 'declined';

    function confirm() {
        setError(null);
        const prev = optimisticStatus;
        setOptimisticStatus('confirmed');
        startTransition(async () => {
            const res = await confirmShiftAction(assignmentId);
            if (!res.ok) {
                setOptimisticStatus(prev);
                setError(labels.error);
            }
        });
    }

    function decline() {
        setError(null);
        const prev = optimisticStatus;
        setOptimisticStatus('declined');
        startTransition(async () => {
            const res = await declineShiftAction(assignmentId);
            if (!res.ok) {
                setOptimisticStatus(prev);
                setError(labels.error);
            }
        });
    }

    return (
        <div className="mt-5">
            <div className="flex flex-wrap gap-2.5">
                {!isConfirmed && !isDeclined && (
                    <>
                        <button
                            type="button"
                            onClick={confirm}
                            disabled={isPending}
                            className="btn btn-accent btn-sm"
                        >
                            <FontAwesomeIcon icon={faCheck} className="h-3 w-3" />
                            {labels.confirm}
                        </button>
                        <button
                            type="button"
                            onClick={decline}
                            disabled={isPending}
                            className="btn btn-sm border border-white/25 bg-transparent text-neutral-content hover:bg-white/10"
                        >
                            <FontAwesomeIcon icon={faXmark} className="h-3 w-3" />
                            {labels.decline}
                        </button>
                    </>
                )}
                <a
                    href={directionsUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="btn btn-sm border border-white/25 bg-transparent text-neutral-content hover:bg-white/10"
                >
                    <FontAwesomeIcon icon={faLocationDot} className="h-3 w-3" />
                    {labels.directions}
                </a>
            </div>
            {error && (
                <div role="alert" className="alert alert-error alert-soft mt-3 text-sm">
                    {error}
                </div>
            )}
        </div>
    );
}
