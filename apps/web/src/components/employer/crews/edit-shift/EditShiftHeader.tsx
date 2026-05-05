'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronRight, faCopy, faXmark } from '@fortawesome/free-solid-svg-icons';

type Props = {
    locale: string;
    crewName: string | null;
    shiftDate: string;
    isCancelled: boolean;
    confirmedCount: number;
    openCount: number;
    busy: boolean;
    onDuplicate: () => void;
    onCancelClick: () => void;
};

export function EditShiftHeader({
    locale,
    crewName,
    shiftDate,
    isCancelled,
    confirmedCount,
    openCount,
    busy,
    onDuplicate,
    onCancelClick,
}: Props) {
    const t = useTranslations('employer.crews.edit_shift');

    return (
        <>
            <nav
                aria-label={t('breadcrumbs_aria')}
                className="text-base-content/60 mb-3 flex flex-wrap items-center gap-1.5 text-xs"
            >
                <Link href={`/${locale}/employer/crews`} className="hover:text-base-content">
                    {t('breadcrumb_crews')}
                </Link>
                <FontAwesomeIcon icon={faChevronRight} className="h-2 w-2 opacity-60" />
                <span>{crewName ?? t('breadcrumb_no_crew')}</span>
                <FontAwesomeIcon icon={faChevronRight} className="h-2 w-2 opacity-60" />
                <span className="text-base-content/80 font-semibold">
                    {t('breadcrumb_current', { date: formatBreadcrumbDate(shiftDate, locale) })}
                </span>
            </nav>

            <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
                <div>
                    <p className="text-base-content/60 font-mono text-[11px] uppercase tracking-wider">
                        {t('eyebrow')}
                    </p>
                    <h1 className="font-display mt-2 text-4xl font-light leading-tight tracking-tight md:text-5xl">
                        {t('title_a')}{' '}
                        <em className="text-primary not-italic font-light">{t('title_b')}</em>
                    </h1>
                    <div className="text-base-content/70 mt-2 text-sm">
                        {t('subtitle', {
                            crew: crewName ?? t('breadcrumb_no_crew'),
                            confirmed: confirmedCount,
                            open: openCount,
                        })}
                    </div>
                </div>
                <div className="flex flex-wrap gap-2">
                    <button
                        type="button"
                        onClick={onDuplicate}
                        disabled={busy}
                        className="btn btn-sm bg-base-100 border-base-300 rounded-full border font-medium"
                    >
                        <FontAwesomeIcon icon={faCopy} className="h-3 w-3" />
                        {t('action_duplicate')}
                    </button>
                    {!isCancelled && (
                        <button
                            type="button"
                            onClick={onCancelClick}
                            disabled={busy}
                            className="btn btn-sm border-error/40 text-error hover:bg-error/10 rounded-full border bg-base-100 font-medium"
                        >
                            <FontAwesomeIcon icon={faXmark} className="h-3 w-3" />
                            {t('action_cancel')}
                        </button>
                    )}
                </div>
            </div>
        </>
    );
}

export function formatBreadcrumbDate(iso: string, locale: string): string {
    const [y = 0, m = 1, d = 1] = iso.split('-').map(Number);
    return new Intl.DateTimeFormat(locale === 'es' ? 'es-MX' : 'en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
    }).format(new Date(y, m - 1, d));
}
