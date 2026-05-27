'use client';

import { useState, useTransition } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faArrowRotateRight,
    faPaperPlane,
    faPause,
    faPlay,
} from '@fortawesome/free-solid-svg-icons';
import { reopenJob, republishJob, setJobRenotifyPaused } from './api';

type JobStatus = 'draft' | 'active' | 'closed' | 'filled';

type Props = {
    locale: string;
    jobId: string;
    status: JobStatus;
    renotifyPaused: boolean;
};

export function JobStatusActions({ locale, jobId, status, renotifyPaused }: Props) {
    const t = useTranslations('employer.jobs.form_v2');
    const queryClient = useQueryClient();
    const [pending, start] = useTransition();
    const [feedback, setFeedback] = useState<{ kind: 'ok' | 'err'; message: string } | null>(null);
    const [paused, setPaused] = useState(renotifyPaused);

    if (status !== 'active' && status !== 'closed') return null;

    function clearLater() {
        setTimeout(() => setFeedback(null), 4000);
    }

    function onTogglePause() {
        const next = !paused;
        start(async () => {
            const res = await setJobRenotifyPaused(locale, jobId, next);
            if (!res.ok) {
                setFeedback({ kind: 'err', message: res.message || t('renotify_pause_failed') });
                clearLater();
                return;
            }
            setPaused(res.renotifyPaused);
            setFeedback({
                kind: 'ok',
                message: res.renotifyPaused ? t('renotify_paused_ok') : t('renotify_resumed_ok'),
            });
            clearLater();
            void queryClient.invalidateQueries({ queryKey: ['employer'] });
        });
    }

    function onRepublish() {
        start(async () => {
            const res = await republishJob(locale, jobId);
            if (!res.ok) {
                setFeedback({ kind: 'err', message: res.message || t('republish_failed') });
            } else {
                setFeedback({
                    kind: 'ok',
                    message: res.enqueued ? t('republish_dispatched') : t('republish_no_automatch'),
                });
            }
            clearLater();
        });
    }

    function onReopen() {
        start(async () => {
            const res = await reopenJob(locale, jobId);
            if (!res.ok) {
                setFeedback({ kind: 'err', message: res.message || t('reopen_failed') });
                clearLater();
                return;
            }
            void queryClient.invalidateQueries({ queryKey: ['employer'] });
        });
    }

    return (
        <div className="flex flex-wrap items-center gap-2">
            {status === 'active' && (
                <>
                    <button
                        type="button"
                        onClick={onTogglePause}
                        disabled={pending}
                        className="btn btn-sm btn-ghost border-base-300 rounded-full border"
                        aria-pressed={paused}
                    >
                        <FontAwesomeIcon icon={paused ? faPlay : faPause} className="h-3 w-3" />
                        {paused ? t('renotify_resume_button') : t('renotify_pause_button')}
                    </button>
                    <button
                        type="button"
                        onClick={onRepublish}
                        disabled={pending}
                        className="btn btn-sm btn-ghost border-base-300 rounded-full border"
                    >
                        <FontAwesomeIcon icon={faPaperPlane} className="h-3 w-3" />
                        {t('republish_button')}
                    </button>
                </>
            )}
            {status === 'closed' && (
                <button
                    type="button"
                    onClick={onReopen}
                    disabled={pending}
                    className="btn btn-sm btn-primary rounded-full"
                >
                    <FontAwesomeIcon icon={faArrowRotateRight} className="h-3 w-3" />
                    {t('reopen_button')}
                </button>
            )}
            {feedback && (
                <span
                    role="status"
                    className={
                        feedback.kind === 'ok'
                            ? 'text-success font-mono text-xs font-bold uppercase tracking-wider'
                            : 'text-error font-mono text-xs font-bold uppercase tracking-wider'
                    }
                >
                    {feedback.message}
                </span>
            )}
        </div>
    );
}
