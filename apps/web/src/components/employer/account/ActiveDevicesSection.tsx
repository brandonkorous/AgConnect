'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useSession } from '@clerk/nextjs';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMobileScreen, faDesktop } from '@fortawesome/free-solid-svg-icons';
import { SectionCard, StatusBadge } from './SectionCard';
import type { ClerkUser } from './types';

type Props = { user: ClerkUser; locale: string };

type SessionRow = {
    id: string;
    browser: string;
    location: string;
    isMobile: boolean;
    lastActiveAt: Date;
};

function formatRelative(date: Date, locale: string): string {
    const diffMs = Date.now() - date.getTime();
    const minutes = Math.round(diffMs / 60_000);
    const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });
    if (Math.abs(minutes) < 60) return rtf.format(-minutes, 'minute');
    const hours = Math.round(minutes / 60);
    if (Math.abs(hours) < 24) return rtf.format(-hours, 'hour');
    const days = Math.round(hours / 24);
    return rtf.format(-days, 'day');
}

export function ActiveDevicesSection({ user, locale }: Props) {
    const t = useTranslations('employer.account.devices');
    const tErr = useTranslations('employer.account');
    const { session: currentSession } = useSession();
    const [rows, setRows] = useState<SessionRow[] | null>(null);
    const [busy, setBusy] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [reloadKey, setReloadKey] = useState(0);

    useEffect(() => {
        let cancelled = false;
        async function load() {
            try {
                const sessions = await user.getSessions();
                if (cancelled) return;
                setRows(
                    sessions.map((s) => {
                        const a = s.latestActivity;
                        const browser = [a?.browserName, a?.browserVersion]
                            .filter(Boolean)
                            .join(' ')
                            .trim() || t('unknown_browser');
                        const location = [a?.city, a?.country]
                            .filter(Boolean)
                            .join(', ') || t('unknown_location');
                        return {
                            id: s.id,
                            browser,
                            location,
                            isMobile: a?.isMobile ?? false,
                            lastActiveAt: s.lastActiveAt,
                        };
                    }),
                );
            } catch {
                if (!cancelled) setError(tErr('error_generic'));
            }
        }
        void load();
        return () => {
            cancelled = true;
        };
    }, [user, reloadKey, t, tErr]);

    async function onRevoke(id: string) {
        setBusy(id);
        setError(null);
        try {
            const sessions = await user.getSessions();
            const target = sessions.find((s) => s.id === id);
            if (target) await target.revoke();
            setReloadKey((k) => k + 1);
        } catch {
            setError(tErr('error_generic'));
        } finally {
            setBusy(null);
        }
    }

    return (
        <SectionCard heading={t('heading')} subtitle={t('subtitle')}>
            {rows === null ? (
                <div className="bg-base-200 h-12 w-full animate-pulse rounded" />
            ) : rows.length === 0 ? (
                <p className="text-base-content/60 text-sm">{t('empty')}</p>
            ) : (
                <ul className="divide-base-300 divide-y">
                    {rows.map((row) => {
                        const isCurrent = row.id === currentSession?.id;
                        return (
                            <li
                                key={row.id}
                                className="flex flex-wrap items-center gap-3 py-3"
                            >
                                <FontAwesomeIcon
                                    icon={row.isMobile ? faMobileScreen : faDesktop}
                                    className="text-base-content/70 h-5 w-5"
                                />
                                <div className="min-w-0 flex-1">
                                    <div className="text-base-content truncate text-sm font-medium">
                                        {row.browser}
                                    </div>
                                    <div className="text-base-content/60 mt-0.5 truncate text-xs tabular-nums">
                                        {row.location} · {t('last_active', {
                                            when: formatRelative(row.lastActiveAt, locale),
                                        })}
                                    </div>
                                    {isCurrent && (
                                        <div className="mt-1">
                                            <StatusBadge tone="primary" label={t('current_label')} />
                                        </div>
                                    )}
                                </div>
                                {!isCurrent && (
                                    <button
                                        type="button"
                                        className="btn btn-xs text-error/90 rounded-full border-transparent bg-transparent"
                                        onClick={() => onRevoke(row.id)}
                                        disabled={busy === row.id}
                                    >
                                        {t('signout_other')}
                                    </button>
                                )}
                            </li>
                        );
                    })}
                </ul>
            )}
            {error && <p className="label text-error mt-3">{error}</p>}
        </SectionCard>
    );
}
