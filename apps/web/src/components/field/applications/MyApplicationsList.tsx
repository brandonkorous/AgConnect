'use client';

import { useState, useTransition } from 'react';
import { useFormatter, useTranslations } from 'next-intl';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faChevronRight,
    faXmark,
    faSpinner,
    faTriangleExclamation,
    faCircleCheck,
} from '@fortawesome/free-solid-svg-icons';
import { withdrawApplicationAction } from '@/lib/api/applications-actions';
import type { ApplicationListItem } from '@/lib/api/applications';

type Props = {
    locale: string;
    applications: ApplicationListItem[];
};

type WithdrawState =
    | { kind: 'idle' }
    | { kind: 'pending'; id: string }
    | { kind: 'done'; id: string }
    | { kind: 'error'; id: string; message: string };

type FilterKey = 'active' | 'hired' | 'past' | 'all';

const WITHDRAWABLE: ReadonlySet<ApplicationListItem['status']> = new Set(['applied', 'reviewed']);

function bucketFor(status: ApplicationListItem['status']): FilterKey {
    if (status === 'applied' || status === 'reviewed') return 'active';
    if (status === 'hired') return 'hired';
    return 'past'; // rejected, withdrawn
}

export function MyApplicationsList({ locale, applications }: Props) {
    const t = useTranslations('worker.field.applications');
    const formatter = useFormatter();
    const [selected, setSelected] = useState<ApplicationListItem | null>(null);
    const [withdrawnIds, setWithdrawnIds] = useState<Set<string>>(new Set());
    const [state, setState] = useState<WithdrawState>({ kind: 'idle' });
    const [, startTransition] = useTransition();
    // Default the filter to whichever bucket is non-empty in priority order:
    // active first (most common landing case), then hired, then past, then all.
    const defaultFilter: FilterKey = (() => {
        if (applications.some((a) => bucketFor(a.status) === 'active')) return 'active';
        if (applications.some((a) => bucketFor(a.status) === 'hired')) return 'hired';
        if (applications.some((a) => bucketFor(a.status) === 'past')) return 'past';
        return 'active';
    })();
    const [filter, setFilter] = useState<FilterKey>(defaultFilter);

    const localized = (a: ApplicationListItem) =>
        (locale === 'es' ? a.job.titleEs : a.job.titleEn) || a.job.titleEn;

    // Apply withdraw side-effect first, then partition for the filter chips so
    // counts reflect a freshly-withdrawn row vanishing from "active" the
    // instant the server action succeeds.
    const live = applications.filter((a) => !withdrawnIds.has(a.id));
    const counts: Record<FilterKey, number> = {
        active: live.filter((a) => bucketFor(a.status) === 'active').length,
        hired: live.filter((a) => bucketFor(a.status) === 'hired').length,
        past: live.filter((a) => bucketFor(a.status) === 'past').length,
        all: live.length,
    };
    const visible = filter === 'all' ? live : live.filter((a) => bucketFor(a.status) === filter);

    function statusLabel(s: ApplicationListItem['status']): string {
        return t(`status.${s}`);
    }

    function statusTone(s: ApplicationListItem['status']): string {
        switch (s) {
            case 'reviewed':
                return 'bg-warning/15 text-warning';
            case 'hired':
                return 'bg-success/15 text-success';
            default:
                return 'bg-base-200 text-base-content/70';
        }
    }

    function withdraw(app: ApplicationListItem) {
        setState({ kind: 'pending', id: app.id });
        startTransition(async () => {
            const res = await withdrawApplicationAction(app.id);
            if (res.ok) {
                setWithdrawnIds((s) => new Set(s).add(app.id));
                setState({ kind: 'done', id: app.id });
                window.setTimeout(() => {
                    setSelected(null);
                    setState({ kind: 'idle' });
                }, 1200);
            } else {
                setState({ kind: 'error', id: app.id, message: t('error') });
            }
        });
    }

    const isPending = state.kind === 'pending';
    const isDone = state.kind === 'done';
    const errorForSelected =
        selected && state.kind === 'error' && state.id === selected.id ? state.message : null;

    const filters: { key: FilterKey; label: string }[] = [
        { key: 'active', label: t('filter_active') },
        { key: 'hired', label: t('filter_hired') },
        { key: 'past', label: t('filter_past') },
    ];

    return (
        <>
            {live.length > 0 && (
                <div
                    role="tablist"
                    aria-label={t('title')}
                    className="bg-base-100 border-base-300 flex w-full overflow-hidden rounded-full border p-0.5"
                >
                    {filters.map((f) => {
                        const active = filter === f.key;
                        const count = counts[f.key];
                        return (
                            <button
                                key={f.key}
                                type="button"
                                role="tab"
                                aria-selected={active}
                                onClick={() => setFilter(f.key)}
                                className={[
                                    'flex h-9 flex-1 items-center justify-center gap-1.5 rounded-full px-3 text-xs font-semibold transition-colors',
                                    active
                                        ? 'bg-primary text-primary-content'
                                        : 'text-base-content/70 hover:text-base-content',
                                ].join(' ')}
                            >
                                {f.label}
                                <span
                                    className={[
                                        'rounded-full px-1.5 py-px text-[10px] font-mono tabular-nums slashed-zero',
                                        active
                                            ? 'bg-primary-content/20 text-primary-content'
                                            : 'bg-base-200 text-base-content/60',
                                    ].join(' ')}
                                >
                                    {count}
                                </span>
                            </button>
                        );
                    })}
                </div>
            )}

            {visible.length === 0 ? (
                <div className="bg-base-100 border-base-300 rounded-2xl border px-5 py-6 text-center">
                    <h1 className="text-base-content text-xl font-semibold">{t('empty.title')}</h1>
                    <p className="text-base-content/65 mx-auto mt-1.5 max-w-xs text-sm">
                        {t('empty.body')}
                    </p>
                </div>
            ) : (
                <ul className="space-y-2">
                    {visible.map((app) => {
                        const canWithdraw = WITHDRAWABLE.has(app.status);
                        const Row = canWithdraw ? 'button' : 'div';
                        return (
                            <li key={app.id}>
                                <Row
                                    {...(canWithdraw
                                        ? {
                                              type: 'button' as const,
                                              onClick: () => setSelected(app),
                                              className:
                                                  'bg-base-100 border-base-300 active:bg-base-200 flex w-full items-start gap-3 rounded-2xl border px-4 py-3.5 text-left transition-colors',
                                          }
                                        : {
                                              className:
                                                  'bg-base-100 border-base-300 flex w-full items-start gap-3 rounded-2xl border px-4 py-3.5 text-left',
                                          })}
                                >
                                    <div className="min-w-0 flex-1">
                                        <p className="text-base-content text-base font-semibold leading-tight">
                                            {localized(app)}
                                        </p>
                                        <p className="text-base-content/65 mt-0.5 truncate text-xs">
                                            {app.job.employerName}
                                        </p>
                                        <div className="mt-2 flex items-center gap-2 text-xs">
                                            <span
                                                className={[
                                                    'rounded-full px-2 py-0.5 font-mono text-[10px] uppercase font-bold',
                                                    statusTone(app.status),
                                                ].join(' ')}
                                            >
                                                {statusLabel(app.status)}
                                            </span>
                                            <span className="text-base-content/55 tabular-nums slashed-zero">
                                                {formatter.relativeTime(new Date(app.appliedAt))}
                                            </span>
                                        </div>
                                    </div>
                                    {canWithdraw && (
                                        <FontAwesomeIcon
                                            icon={faChevronRight}
                                            className="text-base-content/40 mt-2 h-3.5 w-3.5"
                                            aria-hidden
                                        />
                                    )}
                                </Row>
                            </li>
                        );
                    })}
                </ul>
            )}

            {selected && (
                <div
                    className="bg-base-content/40 fixed inset-0 z-40 flex items-end sm:items-center sm:justify-center"
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="withdraw-sheet-title"
                    onClick={(e) => {
                        if (e.target === e.currentTarget && !isPending) setSelected(null);
                    }}
                >
                    <div className="bg-base-100 mx-auto w-full max-w-md rounded-t-3xl pb-[env(safe-area-inset-bottom)] shadow-2xl sm:rounded-3xl">
                        <div className="border-base-300 flex items-start justify-between gap-3 border-b px-5 py-4">
                            <div className="min-w-0 flex-1">
                                <p className="text-base-content/55 mb-0.5 font-mono text-xs uppercase tracking-wide">
                                    {t('sheet_eyebrow')}
                                </p>
                                <h2
                                    id="withdraw-sheet-title"
                                    className="text-base-content text-lg font-semibold leading-tight"
                                >
                                    {localized(selected)}
                                </h2>
                                <p className="text-base-content/65 mt-1 text-sm">
                                    {selected.job.employerName}
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => !isPending && setSelected(null)}
                                disabled={isPending}
                                aria-label={t('close')}
                                className="text-base-content/55 hover:text-base-content active:bg-base-200 -mr-2 grid h-11 w-11 shrink-0 place-items-center rounded-full"
                            >
                                <FontAwesomeIcon icon={faXmark} className="h-4 w-4" aria-hidden />
                            </button>
                        </div>

                        <div className="px-5 py-4">
                            <div className="bg-warning/10 border-warning/30 mb-4 flex items-start gap-3 rounded-2xl border px-4 py-3">
                                <FontAwesomeIcon
                                    icon={faTriangleExclamation}
                                    className="text-warning mt-0.5 h-4 w-4 shrink-0"
                                    aria-hidden
                                />
                                <p className="text-base-content/85 text-sm leading-relaxed">
                                    {t('withdraw_warning')}
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => withdraw(selected)}
                                disabled={isPending || isDone}
                                className="bg-error text-error-content active:bg-error/90 disabled:bg-error/70 flex h-[64px] w-full items-center justify-center gap-2 rounded-full text-base font-bold transition-colors"
                            >
                                {isDone ? (
                                    <>
                                        <FontAwesomeIcon icon={faCircleCheck} className="h-5 w-5" />
                                        {t('withdrawn_state')}
                                    </>
                                ) : (
                                    <>
                                        {isPending && (
                                            <FontAwesomeIcon
                                                icon={faSpinner}
                                                className="h-4 w-4 animate-spin"
                                                aria-hidden
                                            />
                                        )}
                                        {isPending ? t('submitting') : t('withdraw_cta')}
                                    </>
                                )}
                            </button>
                            {errorForSelected && (
                                <p className="text-error mt-2 text-center text-sm font-medium">
                                    {errorForSelected}
                                </p>
                            )}
                            <button
                                type="button"
                                onClick={() => !isPending && setSelected(null)}
                                disabled={isPending}
                                className="text-base-content/65 hover:text-base-content mt-2 flex h-11 w-full items-center justify-center text-sm font-semibold"
                            >
                                {t('keep_application')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
