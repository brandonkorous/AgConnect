'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import type { Route } from 'next';
import { useTranslations } from 'next-intl';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSun, faXmark } from '@fortawesome/free-solid-svg-icons';

const STORAGE_KEY = 'agconn:fieldModeNudgeDismissed';
const MAX_VIEWPORT_WIDTH = 480;

type Props = {
    locale: string;
};

export function FieldModeSoftPrompt({ locale }: Props) {
    const t = useTranslations('worker.field.soft_prompt');
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        if (typeof window === 'undefined') return;
        if (window.localStorage.getItem(STORAGE_KEY) === '1') return;
        if (window.innerWidth > MAX_VIEWPORT_WIDTH) return;
        setVisible(true);
    }, []);

    function dismiss() {
        try {
            window.localStorage.setItem(STORAGE_KEY, '1');
        } catch {
            // ignore — private mode etc.
        }
        setVisible(false);
    }

    if (!visible) return null;

    // Fixed (not sticky) so the prompt sits above the dense worker layout
    // regardless of its current responsive state — Field Mode exists precisely
    // because that layout doesn't fit a phone, and the prompt has to be
    // readable on the broken screen it's rescuing the user from.
    return (
        <div
            role="region"
            aria-label={t('aria')}
            className="bg-primary text-primary-content fixed inset-x-0 top-0 z-50 pt-[env(safe-area-inset-top)] shadow-lg"
        >
            <div className="mx-auto flex max-w-md items-center gap-2 px-3 py-2.5">
                <span className="bg-primary-content/15 grid h-9 w-9 shrink-0 place-items-center rounded-full">
                    <FontAwesomeIcon icon={faSun} className="h-4 w-4" aria-hidden />
                </span>
                <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold leading-tight">{t('title')}</p>
                    <p className="text-primary-content/85 truncate text-xs leading-snug">
                        {t('body')}
                    </p>
                </div>
                <Link
                    href={`/${locale}/field` as Route}
                    onClick={dismiss}
                    className="bg-primary-content text-primary active:bg-primary-content/90 inline-flex h-9 shrink-0 items-center rounded-full px-3 text-xs font-bold"
                >
                    {t('try_it')}
                </Link>
                <button
                    type="button"
                    onClick={dismiss}
                    aria-label={t('dismiss_aria')}
                    className="text-primary-content/80 hover:text-primary-content active:bg-primary-content/15 grid h-9 w-9 shrink-0 place-items-center rounded-full"
                >
                    <FontAwesomeIcon icon={faXmark} className="h-3.5 w-3.5" aria-hidden />
                </button>
            </div>
        </div>
    );
}
