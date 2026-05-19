'use client';

import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import type { Route } from 'next';
import { useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faMagnifyingGlass,
    faMobileScreen,
    faComments,
} from '@fortawesome/free-solid-svg-icons';
import { ThemeToggle } from '@/components/primitives/ThemeToggle';

export function WorkerTopBar() {
    const t = useTranslations('worker.dashboard.topbar');
    const router = useRouter();
    const params = useParams<{ locale: string }>();
    const locale = params.locale ?? 'en';
    const [q, setQ] = useState('');
    const inputRef = useRef<HTMLInputElement | null>(null);

    useEffect(() => {
        function onKey(e: KeyboardEvent) {
            const isMac = typeof navigator !== 'undefined' && /Mac/i.test(navigator.platform);
            const modifier = isMac ? e.metaKey : e.ctrlKey;
            if (modifier && e.key.toLowerCase() === 'k') {
                e.preventDefault();
                inputRef.current?.focus();
                inputRef.current?.select();
            }
        }
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, []);

    function handleSearch(e: React.FormEvent) {
        e.preventDefault();
        const term = q.trim();
        const url = term
            ? `/${locale}/worker/jobs?q=${encodeURIComponent(term)}`
            : `/${locale}/worker/jobs`;
        router.push(url as Route);
    }

    return (
        <div className="border-base-300 sticky top-0 z-20 hidden h-16 items-center gap-4 border-b px-8 backdrop-blur-md backdrop-saturate-150 md:flex">
            <form
                onSubmit={handleSearch}
                role="search"
                className="flex flex-1 items-center"
            >
                <label className="input input-bordered input-sm w-[360px] rounded-full">
                    <FontAwesomeIcon
                        icon={faMagnifyingGlass}
                        className="text-base-content/60 h-3.5 w-3.5"
                    />
                    <input
                        ref={inputRef}
                        type="search"
                        value={q}
                        onChange={(e) => setQ(e.target.value)}
                        placeholder={t('search_placeholder')}
                        aria-label={t('search_placeholder')}
                        className="grow"
                    />
                    <kbd className="kbd kbd-xs font-mono">{t('search_kbd')}</kbd>
                </label>
            </form>

            <span
                className="badge badge-success badge-sm gap-1.5"
                aria-label={t('sms_apply')}
            >
                <FontAwesomeIcon icon={faMobileScreen} className="h-3 w-3" />
                {t('sms_apply')}
            </span>

            <Link
                href={`/${locale}/faq`}
                className="btn btn-ghost btn-sm border-base-300 border"
            >
                <FontAwesomeIcon icon={faComments} className="h-3.5 w-3.5" />
                {t('help')}
            </Link>

            <ThemeToggle ariaLabel={t('theme_toggle_aria')} />
        </div>
    );
}
