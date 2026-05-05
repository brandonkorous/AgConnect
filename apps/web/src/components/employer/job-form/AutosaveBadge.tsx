'use client';

import { useTranslations } from 'next-intl';

export type AutosaveStatus = 'idle' | 'pending' | 'saving' | 'saved' | 'error';

type Props = {
    status: AutosaveStatus;
    savedAt: string | null;
    locale: string;
};

export function AutosaveBadge({ status, savedAt, locale }: Props) {
    const t = useTranslations('employer.jobs.form_v2');
    if (status === 'saving') return <span className="text-base-content/55 text-xs">{t('autosaving')}</span>;
    if (status === 'pending') return <span className="text-base-content/55 text-xs">{t('autosave_pending')}</span>;
    if (status === 'error') return <span className="text-error text-xs">{t('autosave_error')}</span>;
    if (savedAt) {
        return (
            <span className="text-base-content/55 text-xs">
                {t('autosave_saved', { time: relativeTime(savedAt, locale) })}
            </span>
        );
    }
    return null;
}

export function relativeTime(iso: string, locale: string): string {
    const ms = Date.now() - new Date(iso).getTime();
    const sec = Math.round(ms / 1000);
    const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });
    if (sec < 60) return rtf.format(-sec, 'second');
    const min = Math.round(sec / 60);
    if (min < 60) return rtf.format(-min, 'minute');
    const hr = Math.round(min / 60);
    return rtf.format(-hr, 'hour');
}
