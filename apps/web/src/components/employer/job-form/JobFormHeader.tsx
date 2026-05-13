'use client';

import { useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronRight, faCopy, faEye } from '@fortawesome/free-solid-svg-icons';
import { StatusBadge } from '@/components/employer/primitives';
import { AutosaveBadge, type AutosaveStatus } from './AutosaveBadge';
import { CloseJobDialog } from './CloseJobDialog';
import { JobStatusActions } from './JobStatusActions';

type Mode = 'create' | 'edit';
type JobStatus = 'draft' | 'active' | 'closed' | 'filled';

type Props = {
    mode: Mode;
    title: string;
    jobId: string | null;
    humanId: string | null;
    status: JobStatus;
    publishedAt: string | null;
    startDate: string;
    applicantsCount: number;
    spotsOpen: number;
    autosaveStatus: AutosaveStatus;
    savedAt: string | null;
    locale: string;
    renotifyPaused: boolean;
};

export function JobFormHeader({
    mode,
    title,
    jobId,
    humanId,
    status,
    publishedAt,
    startDate,
    applicantsCount,
    spotsOpen,
    autosaveStatus,
    savedAt,
    locale,
    renotifyPaused,
}: Props) {
    const t = useTranslations('employer.jobs.form_v2');
    const tList = useTranslations('employer.jobs.list');
    const router = useRouter();
    const closeDialogRef = useRef<HTMLDialogElement>(null);

    const isLive = status === 'active' && !!publishedAt;
    const badge = resolveStatusBadge({ mode, status, startDate, applicantsCount, locale, t });

    const showDuplicate = mode === 'edit' && status !== 'draft' && !!jobId;
    const showClose = mode === 'edit' && status === 'active' && !!jobId;

    return (
        <div className="mb-5 pt-2">
            <nav aria-label="Breadcrumb" className="text-base-content/55 mb-2 flex items-center gap-1.5 text-xs">
                <Link href={`/${locale}/employer/jobs`} className="hover:text-base-content no-underline">
                    {tList('title')}
                </Link>
                <FontAwesomeIcon icon={faChevronRight} className="h-2.5 w-2.5" />
                <span className="text-base-content font-semibold">
                    {mode === 'edit' ? t('breadcrumb_edit') : t('breadcrumb_new')}
                </span>
            </nav>
            <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                    <div className="mb-1.5 flex flex-wrap items-center gap-2">
                        <StatusBadge status={badge.tone} label={badge.label} />
                        {humanId && mode === 'edit' && (
                            <span className="text-base-content/55 font-mono text-xs uppercase tracking-wider">
                                #{humanId}
                            </span>
                        )}
                    </div>
                    <h1 className="font-display text-4xl font-light leading-tight tracking-tight md:text-5xl">
                        {mode === 'edit' ? t('h1_edit') : t('h1_new')}{' '}
                        {title && <em className="text-primary font-light italic">{title}</em>}
                    </h1>
                    {mode === 'edit' && isLive && (
                        <div className="text-base-content/65 mt-2 flex flex-wrap items-center gap-2 text-sm">
                            <span className="bg-base-200 text-base-content/70 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 font-mono text-xs font-bold uppercase tracking-wider">
                                <span className="bg-success h-1.5 w-1.5 rounded-full" aria-hidden />
                                {t('spots_open', { n: spotsOpen })}
                            </span>
                            <AutosaveBadge status={autosaveStatus} savedAt={savedAt} locale={locale} />
                        </div>
                    )}
                </div>
                {mode === 'edit' && (
                    <div className="flex flex-wrap items-center gap-2">
                        {jobId && (status === 'active' || status === 'closed') && (
                            <JobStatusActions
                                locale={locale}
                                jobId={jobId}
                                status={status}
                                renotifyPaused={renotifyPaused}
                            />
                        )}
                        {showDuplicate && (
                            <button
                                type="button"
                                onClick={() => router.push(`/${locale}/employer/jobs/new?from=${jobId}`)}
                                className="btn btn-sm btn-ghost border-base-300 rounded-full border"
                            >
                                <FontAwesomeIcon icon={faCopy} className="h-3 w-3" />
                                {tList('duplicate')}
                            </button>
                        )}
                        {showClose && (
                            <button
                                type="button"
                                onClick={() => closeDialogRef.current?.showModal()}
                                className="btn btn-sm btn-ghost border-base-300 text-error rounded-full border"
                            >
                                {tList('close')}
                            </button>
                        )}
                        <label
                            htmlFor="preview-drawer"
                            className="btn btn-sm btn-primary rounded-full xl:hidden"
                            aria-label={t('open_preview')}
                        >
                            <FontAwesomeIcon icon={faEye} className="h-3 w-3" />
                            {t('preview_button')}
                        </label>
                    </div>
                )}
            </div>

            <CloseJobDialog ref={closeDialogRef} locale={locale} jobId={jobId} />
        </div>
    );
}

function startsAfterToday(startDate: string): boolean {
    if (!startDate) return false;
    const today = new Date();
    const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    return startDate > todayKey;
}

function resolveStatusBadge(args: {
    mode: Mode;
    status: JobStatus;
    startDate: string;
    applicantsCount: number;
    locale: string;
    t: ReturnType<typeof useTranslations>;
}): { tone: 'draft' | 'live' | 'closed' | 'filled'; label: string } {
    const { mode, status, startDate, applicantsCount, locale, t } = args;
    if (mode === 'create' || status === 'draft') {
        return { tone: 'draft', label: t('header_meta_draft') };
    }
    if (status === 'closed') return { tone: 'closed', label: t('header_meta_closed') };
    if (status === 'filled') return { tone: 'filled', label: t('header_meta_filled') };
    if (status === 'active') {
        if (startsAfterToday(startDate)) {
            return {
                tone: 'live',
                label: t('header_meta_starts', { date: formatStartDate(startDate, locale) }),
            };
        }
        return { tone: 'live', label: t('header_meta_live', { applicants: applicantsCount }) };
    }
    return { tone: 'draft', label: t('header_meta_draft') };
}

function formatStartDate(yyyymmdd: string, locale: string): string {
    const [y, m, d] = yyyymmdd.split('-').map(Number);
    if (!y || !m || !d) return yyyymmdd;
    return new Date(y, m - 1, d).toLocaleDateString(locale, { month: 'short', day: 'numeric' });
}
