'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMagnifyingGlass } from '@fortawesome/free-solid-svg-icons';
import type { Thread } from '@/lib/api/me';

type Props = { threads: Thread[]; activeId: string | undefined; locale: string };

export function ThreadList({ threads, activeId, locale }: Props) {
    const t = useTranslations('worker.messages.list');
    const [query, setQuery] = useState('');
    const q = query.trim().toLowerCase();
    const filtered = q
        ? threads.filter((th) => {
            const hay = `${th.employer} ${th.title} ${th.lastMessage?.body ?? ''}`.toLowerCase();
            return hay.includes(q);
        })
        : threads;
    return (
        <div className="border-base-300 overflow-y-auto border-r grow-1">
            <div className="border-base-300 border-b p-3">
                <label className="bg-base-200 text-base-content/60 flex items-center gap-2 rounded-full px-3 py-2">
                    <FontAwesomeIcon icon={faMagnifyingGlass} className="h-3 w-3" />
                    <input
                        type="search"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder={t('search')}
                        aria-label={t('search')}
                        className="placeholder:text-base-content/60 text-base-content w-full bg-transparent text-[12px] outline-none"
                    />
                </label>
            </div>
            {filtered.length === 0 && (
                <div className="text-base-content/60 px-4 py-6 text-center text-sm">
                    {locale === 'es' ? 'Sin resultados' : 'No matches'}
                </div>
            )}
            {filtered.map((th, i) => {
                const isActive = th.id === activeId;
                const isAgconn = th.employer.toLowerCase().includes('agconn');
                const initials = th.employer
                    .split(' ')
                    .filter(Boolean)
                    .slice(0, 2)
                    .map((w) => w[0])
                    .join('')
                    .toUpperCase();
                const channelLabel =
                    th.channel === 'whatsapp'
                        ? 'WhatsApp'
                        : th.channel === 'sms'
                            ? 'SMS'
                            : 'In-app';
                const when = th.lastMessageAt
                    ? formatRelative(new Date(th.lastMessageAt), locale)
                    : '';
                return (
                    <Link
                        key={th.id}
                        href={`/${locale}/worker/messages?thread=${th.id}`}
                        className={[
                            'block cursor-pointer px-4 py-3.5 no-underline',
                            i < filtered.length - 1 ? 'border-base-300 border-b' : '',
                            isActive
                                ? 'bg-base-200 border-l-primary border-l-[3px]'
                                : 'border-l-[3px] border-l-transparent',
                        ].join(' ')}
                    >
                        <div className="flex gap-2.5">
                            <div
                                className={[
                                    'grid h-9 w-9 shrink-0 place-items-center rounded-full font-mono text-[11.5px] font-bold text-white',
                                    isAgconn ? 'bg-base-content' : 'bg-primary',
                                ].join(' ')}
                            >
                                {initials || 'AC'}
                            </div>
                            <div className="min-w-0 flex-1">
                                <div className="flex items-baseline justify-between gap-2">
                                    <div
                                        className={[
                                            'text-[13px] truncate',
                                            th.unreadCount > 0
                                                ? 'text-base-content font-bold'
                                                : 'text-base-content/80 font-medium',
                                        ].join(' ')}
                                    >
                                        {th.employer}
                                    </div>
                                    <div
                                        className={[
                                            'shrink-0 font-mono text-xs font-bold',
                                            th.unreadCount > 0 ? 'text-primary' : 'text-base-content/60',
                                        ].join(' ')}
                                    >
                                        {when}
                                    </div>
                                </div>
                                <div className="text-base-content/60 mt-0.5 truncate text-xs italic">
                                    {th.title}
                                </div>
                                <div
                                    className={[
                                        'mt-1 line-clamp-2 text-[12px] leading-snug',
                                        th.unreadCount > 0
                                            ? 'text-base-content/80'
                                            : 'text-base-content/60',
                                    ].join(' ')}
                                >
                                    {th.lastMessage?.body ?? ''}
                                </div>
                                <div className="mt-1.5 flex items-center gap-1.5">
                                    <span className="border-base-300 text-base-content/60 rounded border bg-white px-1.5 py-0.5 font-mono text-xs font-bold uppercase tracking-[0.05em]">
                                        {channelLabel}
                                    </span>
                                    {th.unreadCount > 0 && (
                                        <span className="bg-warning inline-block h-1.5 w-1.5 rounded-full" />
                                    )}
                                </div>
                            </div>
                        </div>
                    </Link>
                );
            })}
        </div>
    );
}

function formatRelative(d: Date, locale: string): string {
    const diff = Date.now() - d.getTime();
    const h = Math.floor(diff / (1000 * 60 * 60));
    if (h < 1) return locale === 'es' ? 'ahora' : 'now';
    if (h < 24) return `${h}h`;
    const days = Math.floor(h / 24);
    if (days < 7) return `${days}d`;
    return d.toLocaleDateString(locale, { month: 'short', day: 'numeric' });
}
