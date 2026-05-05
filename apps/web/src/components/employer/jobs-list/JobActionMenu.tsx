'use client';

import { useEffect, useId, useRef, useState, useTransition } from 'react';
import Link from 'next/link';
import type { Route } from 'next';
import { useRouter } from 'next/navigation';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEllipsisVertical } from '@fortawesome/free-solid-svg-icons';
import {
    closeJobPostingAction,
    discardDraftJobAction,
    setJobRenotifyPausedAction,
} from '@/lib/api/jobs-actions';

type Labels = {
    label: string;
    edit: string;
    applicants: string;
    duplicate: string;
    close: string;
    discard: string;
    pauseRenotify: string;
    resumeRenotify: string;
    confirmDiscardTitle: string;
    confirmDiscardBody: string;
    confirmCloseTitle: string;
    confirmCloseBody: string;
    cancel: string;
    confirmDiscard: string;
    confirmClose: string;
};

type Props = {
    jobId: string;
    locale: string;
    status: 'draft' | 'active' | 'closed' | 'filled';
    renotifyPaused: boolean;
    labels: Labels;
};

export function JobActionMenu({ jobId, locale, status, renotifyPaused, labels }: Props) {
    const [paused, setPaused] = useState(renotifyPaused);
    const router = useRouter();
    const detailsRef = useRef<HTMLDetailsElement>(null);
    const [pending, start] = useTransition();
    const [confirm, setConfirm] = useState<null | 'discard' | 'close'>(null);
    const dialogId = useId();

    const closeMenu = () => {
        if (detailsRef.current) detailsRef.current.open = false;
    };

    useEffect(() => {
        const onDocClick = (e: MouseEvent) => {
            const el = detailsRef.current;
            if (!el || !el.open) return;
            if (e.target instanceof Node && !el.contains(e.target)) {
                el.open = false;
            }
        };
        document.addEventListener('click', onDocClick);
        return () => document.removeEventListener('click', onDocClick);
    }, []);

    const onDiscard = () => {
        closeMenu();
        setConfirm('discard');
    };
    const onClose = () => {
        closeMenu();
        setConfirm('close');
    };

    const runDiscard = () => {
        start(async () => {
            await discardDraftJobAction(jobId);
            setConfirm(null);
            router.refresh();
        });
    };
    const runClose = () => {
        start(async () => {
            await closeJobPostingAction(jobId);
            setConfirm(null);
            router.refresh();
        });
    };

    const onTogglePause = () => {
        closeMenu();
        const next = !paused;
        start(async () => {
            const res = await setJobRenotifyPausedAction(jobId, next);
            if (res.ok) {
                setPaused(res.data.renotifyPaused);
                router.refresh();
            }
        });
    };

    return (
        <>
            <details ref={detailsRef} className="dropdown dropdown-end">
                <summary
                    aria-label={labels.label}
                    className="text-base-content/50 hover:text-base-content list-none cursor-pointer rounded p-1"
                >
                    <FontAwesomeIcon icon={faEllipsisVertical} className="h-3.5 w-3.5" />
                </summary>
                <ul className="dropdown-content menu menu-sm bg-base-100 border-base-300 rounded-box z-10 mt-2 w-52 border p-2 shadow-md">
                    <li>
                        <Link href={`/${locale}/employer/jobs/${jobId}` as Route} onClick={closeMenu}>
                            {labels.edit}
                        </Link>
                    </li>
                    <li>
                        <Link
                            href={`/${locale}/employer/jobs/${jobId}/applicants` as Route}
                            onClick={closeMenu}
                        >
                            {labels.applicants}
                        </Link>
                    </li>
                    <li>
                        <Link
                            href={`/${locale}/employer/jobs/new?from=${jobId}` as Route}
                            onClick={closeMenu}
                        >
                            {labels.duplicate}
                        </Link>
                    </li>
                    {status === 'active' && (
                        <>
                            <li>
                                <button type="button" onClick={onClose}>
                                    {labels.close}
                                </button>
                            </li>
                            <li>
                                <button
                                    type="button"
                                    onClick={onTogglePause}
                                    disabled={pending}
                                >
                                    {paused ? labels.resumeRenotify : labels.pauseRenotify}
                                </button>
                            </li>
                        </>
                    )}
                    {status === 'draft' && (
                        <li>
                            <button type="button" onClick={onDiscard} className="text-error">
                                {labels.discard}
                            </button>
                        </li>
                    )}
                </ul>
            </details>

            {confirm && (
                <dialog id={dialogId} className="modal modal-open" aria-modal="true" open>
                    <div className="modal-box">
                        <h3 className="font-display text-xl font-semibold">
                            {confirm === 'discard' ? labels.confirmDiscardTitle : labels.confirmCloseTitle}
                        </h3>
                        <p className="text-base-content/70 mt-2 text-sm">
                            {confirm === 'discard' ? labels.confirmDiscardBody : labels.confirmCloseBody}
                        </p>
                        <div className="modal-action">
                            <button
                                type="button"
                                className="btn btn-sm btn-ghost rounded-full"
                                onClick={() => setConfirm(null)}
                                disabled={pending}
                            >
                                {labels.cancel}
                            </button>
                            <button
                                type="button"
                                className={`btn btn-sm rounded-full ${
                                    confirm === 'discard' ? 'btn-error' : 'btn-neutral'
                                }`}
                                onClick={confirm === 'discard' ? runDiscard : runClose}
                                disabled={pending}
                            >
                                {confirm === 'discard' ? labels.confirmDiscard : labels.confirmClose}
                            </button>
                        </div>
                    </div>
                    <button
                        type="button"
                        aria-label={labels.cancel}
                        className="modal-backdrop"
                        onClick={() => setConfirm(null)}
                    />
                </dialog>
            )}
        </>
    );
}
