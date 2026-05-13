'use client';

import { useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCrown, faXmark, faComments } from '@fortawesome/free-solid-svg-icons';
import { isOk } from '@agconn/api-client';
import { getApiClient } from '@/lib/api/client';
import type { CrewMemberView } from '@/lib/api/employer-ops';
import { ActiveHiresPicker } from '../ActiveHiresPicker';
import { SectionCard } from './SectionCard';

type Props = {
    crewId: string | null;
    initial: CrewMemberView[];
    onCountChanged: (n: number) => void;
};

// Roster CRUD is server-driven. New crews don't have an id yet; in that case
// the section explains members are added after the first save.
export function RosterSection({ crewId, initial, onCountChanged }: Props) {
    const t = useTranslations('employer.crews.edit_crew.roster');
    const locale = useLocale();
    const [members, setMembers] = useState<CrewMemberView[]>(initial);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);

    if (!crewId) {
        return (
            <SectionCard id="roster" title={t('title')} sub={t('sub')}>
                <div className="border-base-300 text-base-content/60 rounded-xl border border-dashed p-5 text-center text-sm">
                    {t('after_save_hint')}
                </div>
            </SectionCard>
        );
    }

    async function refresh() {
        if (!crewId) return;
        const client = getApiClient(locale === 'es' ? 'es' : 'en');
        const res = await client.get<{ members: CrewMemberView[] }>(`/v1/employer/crews/${crewId}`, {
            handleErrorInline: true,
        });
        if (isOk(res)) {
            setMembers(res.data.members);
            onCountChanged(res.data.members.length);
        }
    }

    async function add(workerUserId: string) {
        if (!crewId) return;
        setBusy(true);
        setError(null);
        try {
            const client = getApiClient(locale === 'es' ? 'es' : 'en');
            const res = await client.post(
                `/v1/employer/crews/${crewId}/members`,
                { workerUserId, role: 'member' },
                { handleErrorInline: true },
            );
            if (!isOk(res)) {
                setError(res.error.message || t('error_add'));
                return;
            }
            await refresh();
        } finally {
            setBusy(false);
        }
    }

    async function remove(workerUserId: string) {
        if (!crewId) return;
        setBusy(true);
        setError(null);
        try {
            const client = getApiClient(locale === 'es' ? 'es' : 'en');
            const res = await client.del(`/v1/employer/crews/${crewId}/members/${workerUserId}`, {
                handleErrorInline: true,
            });
            if (!isOk(res)) {
                setError(res.error.message || t('error_remove'));
                return;
            }
            await refresh();
        } finally {
            setBusy(false);
        }
    }

    async function promote(workerUserId: string) {
        if (!crewId) return;
        setBusy(true);
        setError(null);
        try {
            const client = getApiClient(locale === 'es' ? 'es' : 'en');
            const res = await client.post(
                `/v1/employer/crews/${crewId}/foreman`,
                { workerUserId },
                { handleErrorInline: true },
            );
            if (!isOk(res)) {
                setError(res.error.message || t('error_promote'));
                return;
            }
            await refresh();
        } finally {
            setBusy(false);
        }
    }

    return (
        <SectionCard id="roster" title={t('title_count', { count: members.length })} sub={t('sub')}>
            {error && (
                <div className="bg-warning/10 border-warning/30 mb-3 rounded-xl border px-3 py-2 text-sm">
                    {error}
                </div>
            )}

            {members.length === 0 ? (
                <div className="border-base-300 text-base-content/60 mb-3 rounded-xl border border-dashed p-4 text-center text-xs">
                    {t('empty')}
                </div>
            ) : (
                <ul className="border-base-300 divide-base-300 mb-3 divide-y rounded-xl border">
                    {members.map((m) => {
                        const initials = `${m.firstName[0] ?? '?'}${m.lastInitial}`.toUpperCase();
                        const isLead = m.role === 'lead';
                        return (
                            <li key={m.id} className="flex items-center gap-3 px-3.5 py-3">
                                <span
                                    className={[
                                        'grid h-9 w-9 place-items-center rounded-full font-mono text-xs font-bold',
                                        isLead ? 'bg-accent text-accent-content' : 'bg-base-content text-base-100',
                                    ].join(' ')}
                                >
                                    {initials}
                                </span>
                                <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-1.5 text-sm font-semibold leading-tight">
                                        {m.firstName} {m.lastInitial ? `${m.lastInitial}.` : ''}
                                        {isLead && (
                                            <span className="bg-accent text-accent-content rounded px-1.5 py-px font-mono text-[9px] font-bold uppercase tracking-wider">
                                                {t('foreman_pill')}
                                            </span>
                                        )}
                                    </div>
                                    <div className="text-base-content/60 mt-0.5 text-xs">
                                        {isLead ? t('role_lead') : t('role_member')}
                                    </div>
                                </div>
                                {!isLead && (
                                    <button
                                        type="button"
                                        disabled={busy}
                                        onClick={() => promote(m.workerUserId)}
                                        className="text-base-content/60 hover:text-base-content inline-flex items-center gap-1 text-xs"
                                    >
                                        <FontAwesomeIcon icon={faCrown} className="h-2.5 w-2.5" />
                                        <span>{t('make_foreman')}</span>
                                    </button>
                                )}
                                <button
                                    type="button"
                                    aria-label={t('open_chat')}
                                    className="border-base-300 hover:bg-base-200 grid h-7 w-7 place-items-center rounded-md border"
                                >
                                    <FontAwesomeIcon icon={faComments} className="h-3 w-3" />
                                </button>
                                {!isLead && (
                                    <button
                                        type="button"
                                        disabled={busy}
                                        aria-label={t('remove')}
                                        onClick={() => remove(m.workerUserId)}
                                        className="border-error/40 text-error hover:bg-error/10 grid h-7 w-7 place-items-center rounded-md border"
                                    >
                                        <FontAwesomeIcon icon={faXmark} className="h-3 w-3" />
                                    </button>
                                )}
                            </li>
                        );
                    })}
                </ul>
            )}

            <div>
                <div className="text-base-content/60 mb-1.5 font-mono text-[10px] font-bold uppercase tracking-wider">
                    {t('add_label')}
                </div>
                <ActiveHiresPicker
                    excludeUserIds={members.map((m) => m.workerUserId)}
                    busy={busy}
                    onSelect={add}
                />
            </div>
        </SectionCard>
    );
}
