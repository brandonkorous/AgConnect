'use client';

import { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheck, faLocationDot, faXmark } from '@fortawesome/free-solid-svg-icons';
import {
    useConfirmShiftMutation,
    useDeclineShiftMutation,
} from '@/lib/api/hooks/mutations/me';
import type { ShiftRow } from '@/lib/api/hooks/shifts';

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
    const confirmMut = useConfirmShiftMutation();
    const declineMut = useDeclineShiftMutation();
    const isPending = confirmMut.isPending || declineMut.isPending;
    const [error, setError] = useState<string | null>(null);
    const [optimisticStatus, setOptimisticStatus] = useState<ShiftRow['status']>(status);

    const isConfirmed = optimisticStatus === 'confirmed' || optimisticStatus === 'attended';
    const isDeclined = optimisticStatus === 'declined';

    async function confirm() {
        setError(null);
        const prev = optimisticStatus;
        setOptimisticStatus('confirmed');
        const res = await confirmMut.mutateAsync(assignmentId);
        if (!res.ok) {
            setOptimisticStatus(prev);
            setError(labels.error);
        }
    }

    async function decline() {
        setError(null);
        const prev = optimisticStatus;
        setOptimisticStatus('declined');
        const res = await declineMut.mutateAsync(assignmentId);
        if (!res.ok) {
            setOptimisticStatus(prev);
            setError(labels.error);
        }
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
