'use client';

import { useState, useTransition } from 'react';
import { useFormatter, useTranslations } from 'next-intl';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faMapLocationDot,
    faCheck,
    faSpinner,
} from '@fortawesome/free-solid-svg-icons';
import { arriveAtShiftAction } from '@/lib/api/me-actions';

type Props = {
    assignmentId: string;
    initialArrivedAt: string | null;
};

export function ArrivalTile({ assignmentId, initialArrivedAt }: Props) {
    const t = useTranslations('worker.field.today.arrival');
    const formatter = useFormatter();
    const [arrivedAt, setArrivedAt] = useState<string | null>(initialArrivedAt);
    const [error, setError] = useState<string | null>(null);
    const [pending, startTransition] = useTransition();

    if (arrivedAt) {
        const at = new Date(arrivedAt);
        return (
            <div className="bg-success/10 border-success/40 text-success flex items-center gap-3 rounded-2xl border px-5 py-5">
                <span className="bg-success text-success-content grid h-11 w-11 shrink-0 place-items-center rounded-full">
                    <FontAwesomeIcon icon={faCheck} className="h-5 w-5" aria-hidden />
                </span>
                <div className="min-w-0 flex-1">
                    <p className="text-base-content text-base font-semibold">
                        {t('arrived')}
                    </p>
                    <p className="text-base-content/70 text-sm tabular-nums slashed-zero">
                        {t('arrived_at_time', {
                            time: formatter.dateTime(at, { hour: 'numeric', minute: '2-digit' }),
                        })}
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div>
            <button
                type="button"
                disabled={pending}
                onClick={() => {
                    setError(null);
                    startTransition(async () => {
                        const res = await arriveAtShiftAction(assignmentId);
                        if (res.ok) setArrivedAt(res.data.arrivedAt);
                        else setError(t('error'));
                    });
                }}
                className="bg-primary text-primary-content active:bg-primary/90 disabled:bg-primary/70 flex h-[72px] w-full items-center justify-center gap-3 rounded-2xl text-lg font-bold transition-colors disabled:cursor-progress"
            >
                <FontAwesomeIcon
                    icon={pending ? faSpinner : faMapLocationDot}
                    className={['h-5 w-5', pending ? 'animate-spin' : ''].join(' ')}
                    aria-hidden
                />
                {pending ? t('submitting') : t('cta')}
            </button>
            {error && (
                <p className="text-error mt-2 text-center text-sm font-medium">{error}</p>
            )}
        </div>
    );
}
