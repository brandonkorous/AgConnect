'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheck, faTriangleExclamation } from '@fortawesome/free-solid-svg-icons';
import type { SaveAction } from './save-handlers';

type Props = {
    locale: string;
    isActive: boolean;
    isDraft: boolean;
    canPublish: boolean;
    submitting: boolean;
    errorCount: number;
    savedAt: string | null;
    onSave: (action: SaveAction) => void;
};

export function JobFormFooter({
    locale,
    isActive,
    isDraft,
    canPublish,
    submitting,
    errorCount,
    savedAt,
    onSave,
}: Props) {
    const t = useTranslations('employer.jobs.form_v2');
    const blocked = errorCount > 0;
    const draftLabel = isActive ? t('save_changes') : t('save_draft');

    return (
        <div className="bg-base-100 border-base-300 shadow-pop sticky bottom-4 z-10 mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border p-4">
            <div className="flex items-center gap-3">
                {blocked ? (
                    <span className="bg-error/10 text-error grid h-9 w-9 place-items-center rounded-full">
                        <FontAwesomeIcon icon={faTriangleExclamation} className="h-4 w-4" />
                    </span>
                ) : (
                    <span className="bg-primary/10 text-primary grid h-9 w-9 place-items-center rounded-full">
                        <FontAwesomeIcon icon={faCheck} className="h-4 w-4" />
                    </span>
                )}
                <div className="min-w-0">
                    <div className="text-sm font-semibold">
                        {blocked
                            ? t('save_bar_blocked', { count: errorCount })
                            : t('save_bar_complete')}
                    </div>
                    <div className="text-base-content/55 text-xs">
                        {savedAt
                            ? t('save_bar_autosaved', { time: relativeTime(savedAt, locale) })
                            : t('save_bar_unsaved')}
                    </div>
                </div>
            </div>
            <div className="flex flex-wrap gap-2">
                <Link
                    href={`/${locale}/employer/jobs`}
                    className="btn btn-ghost btn-sm border-base-300 rounded-full border"
                >
                    {t('cancel')}
                </Link>
                {isActive ? (
                    <>
                        <button
                            type="button"
                            disabled={submitting}
                            onClick={() => onSave('save_no_notify')}
                            className="btn btn-sm border-base-300 rounded-full border bg-transparent"
                        >
                            {t('save_no_notify')}
                        </button>
                        <button
                            type="button"
                            disabled={submitting}
                            onClick={() => onSave('save_notify')}
                            className="btn btn-primary btn-sm rounded-full"
                        >
                            <FontAwesomeIcon icon={faCheck} className="h-3 w-3" />
                            {t('save_notify_crew')}
                        </button>
                    </>
                ) : (
                    <>
                        <button
                            type="button"
                            disabled={submitting}
                            onClick={() => onSave('draft')}
                            className="btn btn-sm border-base-300 rounded-full border bg-transparent"
                        >
                            {draftLabel}
                        </button>
                        <button
                            type="button"
                            disabled={submitting || !canPublish || !isDraft}
                            title={!canPublish ? t('publish_blocked_pending_verification') : undefined}
                            onClick={() => onSave('publish')}
                            className="btn btn-primary btn-sm rounded-full"
                        >
                            <FontAwesomeIcon icon={faCheck} className="h-3 w-3" />
                            {t('publish')}
                        </button>
                    </>
                )}
            </div>
        </div>
    );
}

function relativeTime(iso: string, locale: string): string {
    const ms = Date.now() - new Date(iso).getTime();
    const sec = Math.round(ms / 1000);
    const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });
    if (sec < 60) return rtf.format(-sec, 'second');
    const min = Math.round(sec / 60);
    if (min < 60) return rtf.format(-min, 'minute');
    const hr = Math.round(min / 60);
    return rtf.format(-hr, 'hour');
}
