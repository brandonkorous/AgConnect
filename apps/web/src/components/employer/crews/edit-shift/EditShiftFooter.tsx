'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheck } from '@fortawesome/free-solid-svg-icons';
import { formatBreadcrumbDate } from './EditShiftHeader';

type Props = {
    locale: string;
    shiftDate: string;
    repeatCount: number;
    busy: boolean;
    onSaveQuiet: () => void;
    onSaveNotify: () => void;
};

export function EditShiftFooter({
    locale,
    shiftDate,
    repeatCount,
    busy,
    onSaveQuiet,
    onSaveNotify,
}: Props) {
    const t = useTranslations('employer.crews.edit_shift');

    return (
        <div className="bg-base-100 border-base-300 shadow-pop sticky bottom-4 z-10 mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border p-4">
            <div className="flex items-center gap-3">
                <span className="bg-primary/10 text-primary grid h-9 w-9 place-items-center rounded-full">
                    <FontAwesomeIcon icon={faCheck} className="h-4 w-4" />
                </span>
                <div className="min-w-0">
                    <div className="text-sm font-semibold">
                        {t('save_bar_complete', { date: formatBreadcrumbDate(shiftDate, locale) })}
                    </div>
                    <div className="text-base-content/55 text-xs">
                        {repeatCount > 0
                            ? t('save_bar_repeat', { count: repeatCount })
                            : t('save_bar_single')}
                    </div>
                </div>
            </div>
            <div className="flex flex-wrap gap-2">
                <Link
                    href={`/${locale}/employer/crews?week=${shiftDate}`}
                    className="btn btn-ghost btn-sm border-base-300 rounded-full border"
                >
                    {t('footer_cancel')}
                </Link>
                <button
                    type="button"
                    onClick={onSaveQuiet}
                    disabled={busy}
                    className="btn btn-sm border-base-300 rounded-full border bg-transparent"
                >
                    {busy ? '…' : t('footer_save_quiet')}
                </button>
                <button
                    type="button"
                    onClick={onSaveNotify}
                    disabled={busy}
                    className="btn btn-primary btn-sm rounded-full"
                >
                    <FontAwesomeIcon icon={faCheck} className="h-3 w-3" />
                    {busy ? '…' : t('footer_save_notify')}
                </button>
            </div>
        </div>
    );
}
