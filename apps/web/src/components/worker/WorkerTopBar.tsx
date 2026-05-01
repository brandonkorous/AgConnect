'use client';

import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import type { Route } from 'next';
import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faMagnifyingGlass,
    faMobileScreen,
    faComments,
    faPlus,
} from '@fortawesome/free-solid-svg-icons';

export function WorkerTopBar() {
    const t = useTranslations('worker.dashboard.topbar');
    const router = useRouter();
    const params = useParams<{ locale: string }>();
    const locale = params.locale ?? 'en';
    const [q, setQ] = useState('');

    function handleSearch(e: React.FormEvent) {
        e.preventDefault();
        const term = q.trim();
        const url = term
            ? `/${locale}/worker/jobs?q=${encodeURIComponent(term)}`
            : `/${locale}/worker/jobs`;
        router.push(url as Route);
    }

    return (
        <div className="bg-base-100/85 border-base-300 sticky top-0 z-20 flex h-16 items-center gap-4 border-b px-8 backdrop-blur-md backdrop-saturate-150">
            <form
                onSubmit={handleSearch}
                role="search"
                className="flex flex-1 items-center"
            >
                <label className="bg-base-100 border-base-300 text-base-content/60 flex w-[360px] items-center gap-2.5 rounded-full border px-3.5 py-2">
                    <FontAwesomeIcon icon={faMagnifyingGlass} className="h-3.5 w-3.5" />
                    <input
                        type="search"
                        value={q}
                        onChange={(e) => setQ(e.target.value)}
                        placeholder={t('search_placeholder')}
                        aria-label={t('search_placeholder')}
                        className="placeholder:text-base-content/60 flex-1 border-0 bg-transparent text-sm outline-none"
                    />
                    <span className="bg-base-200 text-base-content/60 ml-auto rounded px-1.5 py-0.5 font-mono text-[10px]">
                        {t('search_kbd')}
                    </span>
                </label>
            </form>

            <Link
                href={`/${locale}/worker/messages?channel=sms`}
                className="text-base-content/70 inline-flex items-center gap-1.5 text-sm no-underline hover:text-base-content"
            >
                <FontAwesomeIcon icon={faMobileScreen} className="h-3.5 w-3.5" />
                {t('sms_apply')}
            </Link>

            <Link
                href={`/${locale}/worker/messages`}
                className="btn btn-ghost btn-sm border-base-300 border"
            >
                <FontAwesomeIcon icon={faComments} className="h-3.5 w-3.5" />
                {t('help')}
            </Link>

            <Link
                href={`/${locale}/worker/profile#availability`}
                className="btn btn-primary btn-sm"
            >
                <FontAwesomeIcon icon={faPlus} className="h-3.5 w-3.5" />
                {t('set_availability')}
            </Link>
        </div>
    );
}
