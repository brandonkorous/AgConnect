'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronRight, faCopy, faXmark } from '@fortawesome/free-solid-svg-icons';
import type { CrewView } from '@/lib/api/hooks/employer-ops';

type Props = {
    locale: string;
    mode: 'new' | 'edit';
    crew: CrewView | null;
    draftName: string;
    memberCount: number;
    foremanName: string | null;
    busy: boolean;
    onDuplicate: () => void;
    onArchiveClick: () => void;
};

export function CrewEditorHeader({
    locale,
    mode,
    crew,
    draftName,
    memberCount,
    foremanName,
    busy,
    onDuplicate,
    onArchiveClick,
}: Props) {
    const t = useTranslations('employer.crews.edit_crew');

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
                <span className="text-base-content/80 font-semibold">
                    {mode === 'new' ? t('breadcrumb_new') : draftName || crew?.name || t('breadcrumb_edit')}
                </span>
            </nav>

            <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
                <div>
                    <p className="text-base-content/60 font-mono text-xs uppercase tracking-wider">
                        {t(mode === 'new' ? 'eyebrow_new' : 'eyebrow_edit', { count: memberCount })}
                    </p>
                    <h1 className="font-display mt-2 text-4xl font-light leading-tight tracking-tight md:text-5xl">
                        {mode === 'new' ? (
                            <>
                                {t('title_new_a')}{' '}
                                <em className="text-primary not-italic font-light">{t('title_new_b')}</em>
                            </>
                        ) : (
                            <>
                                {draftName.split('·')[0]?.trim() || t('breadcrumb_edit')}
                                {draftName.includes('·') && (
                                    <>
                                        {' · '}
                                        <em className="text-primary not-italic font-light">
                                            {draftName.split('·').slice(1).join('·').trim()}
                                        </em>
                                    </>
                                )}
                            </>
                        )}
                    </h1>
                    {mode === 'edit' && (
                        <div className="text-base-content/70 mt-2 text-sm">
                            {t('subtitle_edit', {
                                foreman: foremanName ?? t('no_foreman'),
                                count: memberCount,
                            })}
                        </div>
                    )}
                </div>
                {mode === 'edit' && crew && (
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
                        <button
                            type="button"
                            onClick={onArchiveClick}
                            disabled={busy}
                            className="btn btn-sm border-error/40 text-error hover:bg-error/10 rounded-full border bg-base-100 font-medium"
                        >
                            <FontAwesomeIcon icon={faXmark} className="h-3 w-3" />
                            {t('action_archive')}
                        </button>
                    </div>
                )}
            </div>
        </>
    );
}
