'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faCircleCheck,
    faSpinner,
} from '@fortawesome/free-solid-svg-icons';
import { useConfirmShiftMutation } from '@/lib/api/hooks/mutations/me';

type Props = {
    assignmentId: string;
    onConfirmed?: () => void;
};

export function ConfirmTile({ assignmentId, onConfirmed }: Props) {
    const t = useTranslations('worker.field.today.confirm');
    const [confirmed, setConfirmed] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const confirmMut = useConfirmShiftMutation();
    const pending = confirmMut.isPending;

    if (confirmed) return null;

    return (
        <div className="bg-base-100 border-base-300 rounded-2xl border p-4">
            <p className="text-base-content text-base font-semibold">{t('title')}</p>
            <p className="text-base-content/70 mt-1 text-sm">{t('body')}</p>
            <button
                type="button"
                disabled={pending}
                onClick={async () => {
                    setError(null);
                    const res = await confirmMut.mutateAsync(assignmentId);
                    if (res.ok) {
                        setConfirmed(true);
                        onConfirmed?.();
                    } else {
                        setError(t('error'));
                    }
                }}
                className="bg-base-content text-base-100 active:bg-base-content/90 disabled:bg-base-content/60 mt-3 flex h-[60px] w-full items-center justify-center gap-2 rounded-full text-base font-semibold transition-colors disabled:cursor-progress"
            >
                <FontAwesomeIcon
                    icon={pending ? faSpinner : faCircleCheck}
                    className={['h-4 w-4', pending ? 'animate-spin' : ''].join(' ')}
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
