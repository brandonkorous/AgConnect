'use client';

import { useEffect, useMemo, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { isOk } from '@agconn/api-client';
import { getApiClient } from '@/lib/api/client';

export type HireOption = {
    workerUserId: string;
    firstName: string;
    lastInitial: string;
    jobTitle: string;
    hiredAt: string;
};

type Props = {
    excludeUserIds?: string[];
    suggestUserIds?: string[];
    busy?: boolean;
    onSelect: (workerUserId: string) => void;
};

export function ActiveHiresPicker({
    excludeUserIds = [],
    suggestUserIds = [],
    busy = false,
    onSelect,
}: Props) {
    const t = useTranslations('employer.crews.hires_picker');
    const locale = useLocale();
    const [hires, setHires] = useState<HireOption[]>([]);
    const [loading, setLoading] = useState(true);
    const [query, setQuery] = useState('');

    useEffect(() => {
        let cancelled = false;
        (async () => {
            const client = getApiClient(locale === 'es' ? 'es' : 'en');
            const res = await client.get<{ workers: HireOption[] }>('/v1/employer/hires', {
                handleErrorInline: true,
            });
            if (cancelled) return;
            if (isOk(res)) setHires(res.data.workers);
            setLoading(false);
        })();
        return () => {
            cancelled = true;
        };
    }, [locale]);

    const exclude = useMemo(() => new Set(excludeUserIds), [excludeUserIds]);
    const suggest = useMemo(() => new Set(suggestUserIds), [suggestUserIds]);

    const { suggested, others } = useMemo(() => {
        const needle = query.trim().toLowerCase();
        const visible = hires.filter((h) => {
            if (exclude.has(h.workerUserId)) return false;
            if (!needle) return true;
            return (
                `${h.firstName} ${h.lastInitial}`.toLowerCase().includes(needle) ||
                h.jobTitle.toLowerCase().includes(needle)
            );
        });
        const sg: HireOption[] = [];
        const ot: HireOption[] = [];
        for (const h of visible) {
            if (suggest.has(h.workerUserId)) sg.push(h);
            else ot.push(h);
        }
        return { suggested: sg, others: ot };
    }, [hires, exclude, suggest, query]);

    return (
        <div className="border-base-300 bg-base-200/40 rounded-xl border p-3">
            <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t('placeholder')}
                className="input input-sm w-full"
            />
            <div className="mt-2 max-h-56 overflow-y-auto">
                {loading ? (
                    <div className="text-base-content/60 px-2 py-3 text-xs">…</div>
                ) : suggested.length + others.length === 0 ? (
                    <div className="text-base-content/60 px-2 py-3 text-xs">{t('no_results')}</div>
                ) : (
                    <>
                        {suggested.length > 0 && (
                            <>
                                <div className="text-base-content/60 mt-1 px-1 font-mono text-[10px] font-bold uppercase tracking-wider">
                                    {t('suggested_label')}
                                </div>
                                {suggested.map((h) => (
                                    <HireRow key={h.workerUserId} hire={h} busy={busy} onSelect={onSelect} />
                                ))}
                                <div className="text-base-content/60 mt-2 px-1 font-mono text-[10px] font-bold uppercase tracking-wider">
                                    {t('all_label')}
                                </div>
                            </>
                        )}
                        {others.map((h) => (
                            <HireRow key={h.workerUserId} hire={h} busy={busy} onSelect={onSelect} />
                        ))}
                    </>
                )}
            </div>
        </div>
    );
}

function HireRow({
    hire,
    busy,
    onSelect,
}: {
    hire: HireOption;
    busy: boolean;
    onSelect: (id: string) => void;
}) {
    const initials = `${hire.firstName[0] ?? '?'}${hire.lastInitial || ''}`.toUpperCase();
    return (
        <button
            type="button"
            disabled={busy}
            onClick={() => onSelect(hire.workerUserId)}
            className="hover:bg-base-100 flex w-full items-center gap-2.5 rounded-lg p-2 text-left disabled:opacity-50"
        >
            <span className="bg-primary text-primary-content grid h-7 w-7 shrink-0 place-items-center rounded-full font-mono text-[10px] font-bold">
                {initials}
            </span>
            <span className="min-w-0 flex-1">
                <span className="block truncate text-xs font-semibold">
                    {hire.firstName} {hire.lastInitial ? `${hire.lastInitial}.` : ''}
                </span>
                <span className="text-base-content/60 block truncate text-xs">{hire.jobTitle}</span>
            </span>
        </button>
    );
}
