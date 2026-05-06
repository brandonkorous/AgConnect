'use client';

import { useState, useTransition } from 'react';
import { useFormatter, useTranslations } from 'next-intl';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faChevronRight,
    faLocationDot,
    faXmark,
    faPaperPlane,
    faSpinner,
    faCircleCheck,
} from '@fortawesome/free-solid-svg-icons';
import { applyToJobAction } from '@/lib/api/applications-actions';
import type { RecommendedJob } from '@/lib/api/jobs';

type Props = {
    locale: string;
    jobs: RecommendedJob[];
    smsApply: { number: string; keyword: string } | null;
};

type ApplyState =
    | { kind: 'idle' }
    | { kind: 'pending'; jobId: string }
    | { kind: 'done'; jobId: string }
    | { kind: 'error'; jobId: string; message: string };

export function ApplyList({ locale, jobs, smsApply }: Props) {
    const t = useTranslations('worker.field.apply');
    const formatter = useFormatter();
    const [selected, setSelected] = useState<RecommendedJob | null>(null);
    const [appliedIds, setAppliedIds] = useState<Set<string>>(new Set());
    const [state, setState] = useState<ApplyState>({ kind: 'idle' });
    const [, startTransition] = useTransition();

    const localized = (j: RecommendedJob) => (locale === 'es' ? j.titleEs : j.titleEn) || j.titleEn;

    function fmtWage(j: RecommendedJob): string {
        const min = j.wageMin / 100;
        const max = j.wageMax / 100;
        const unit = t(`wage_unit.${j.wageUnit}`, { defaultValue: j.wageUnit });
        const money = (n: number) =>
            formatter.number(n, { style: 'currency', currency: 'USD', maximumFractionDigits: 2 });
        return min === max ? `${money(min)}/${unit}` : `${money(min)}–${money(max)}/${unit}`;
    }

    function applyTo(job: RecommendedJob) {
        setState({ kind: 'pending', jobId: job.id });
        startTransition(async () => {
            const res = await applyToJobAction(job.id);
            if (res.ok) {
                setAppliedIds((s) => new Set(s).add(job.id));
                setState({ kind: 'done', jobId: job.id });
                window.setTimeout(() => {
                    setSelected(null);
                    setState({ kind: 'idle' });
                }, 1400);
            } else if (res.code === 'conflict') {
                setAppliedIds((s) => new Set(s).add(job.id));
                setState({ kind: 'done', jobId: job.id });
            } else {
                setState({ kind: 'error', jobId: job.id, message: t('error') });
            }
        });
    }

    if (jobs.length === 0) {
        return (
            <div className="bg-base-100 border-base-300 rounded-2xl border px-5 py-6 text-center">
                <h1 className="text-base-content text-xl font-semibold">{t('empty.title')}</h1>
                <p className="text-base-content/65 mx-auto mt-1.5 max-w-xs text-sm">
                    {t('empty.body')}
                </p>
            </div>
        );
    }

    const isPending = state.kind === 'pending';
    const isDone = state.kind === 'done';
    const errorForSelected =
        selected && state.kind === 'error' && state.jobId === selected.id ? state.message : null;

    return (
        <>
            <ul className="space-y-2">
                {jobs.map((job) => {
                    const applied = appliedIds.has(job.id);
                    return (
                        <li key={job.id}>
                            <button
                                type="button"
                                onClick={() => !applied && setSelected(job)}
                                disabled={applied}
                                className="bg-base-100 border-base-300 active:bg-base-200 disabled:opacity-70 flex w-full items-start gap-3 rounded-2xl border px-4 py-3.5 text-left transition-colors"
                            >
                                <div className="min-w-0 flex-1">
                                    <p className="text-base-content text-base font-semibold leading-tight">
                                        {localized(job)}
                                    </p>
                                    <p className="text-primary mt-0.5 text-sm font-bold tabular-nums slashed-zero">
                                        {fmtWage(job)}
                                    </p>
                                    <p className="text-base-content/65 mt-1 flex items-center gap-1 text-xs">
                                        <FontAwesomeIcon
                                            icon={faLocationDot}
                                            className="h-3 w-3"
                                            aria-hidden
                                        />
                                        {[job.city, job.county].filter(Boolean).join(', ')}
                                    </p>
                                </div>
                                {applied ? (
                                    <span className="text-success mt-1 inline-flex items-center gap-1 text-xs font-semibold">
                                        <FontAwesomeIcon icon={faCircleCheck} className="h-3.5 w-3.5" />
                                        {t('applied_chip')}
                                    </span>
                                ) : (
                                    <FontAwesomeIcon
                                        icon={faChevronRight}
                                        className="text-base-content/40 mt-2 h-3.5 w-3.5"
                                        aria-hidden
                                    />
                                )}
                            </button>
                        </li>
                    );
                })}
            </ul>

            {selected && (
                <div
                    className="bg-base-content/40 fixed inset-0 z-40 flex items-end sm:items-center sm:justify-center"
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="apply-sheet-title"
                    onClick={(e) => {
                        if (e.target === e.currentTarget && !isPending) setSelected(null);
                    }}
                >
                    <div className="bg-base-100 mx-auto w-full max-w-md rounded-t-3xl pb-[env(safe-area-inset-bottom)] shadow-2xl sm:rounded-3xl">
                        <div className="border-base-300 flex items-start justify-between gap-3 border-b px-5 py-4">
                            <div className="min-w-0 flex-1">
                                <p className="text-base-content/55 mb-0.5 font-mono text-[11px] uppercase tracking-wide">
                                    {t('confirm_eyebrow')}
                                </p>
                                <h2
                                    id="apply-sheet-title"
                                    className="text-base-content text-lg font-semibold leading-tight"
                                >
                                    {localized(selected)}
                                </h2>
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

                        <dl className="border-base-300 grid grid-cols-2 gap-x-3 gap-y-3 border-b px-5 py-4 text-sm">
                            <div>
                                <dt className="text-base-content/55 font-mono text-[10px] uppercase tracking-wide">
                                    {t('detail.wage')}
                                </dt>
                                <dd className="text-base-content mt-0.5 font-bold tabular-nums slashed-zero">
                                    {fmtWage(selected)}
                                </dd>
                            </div>
                            <div>
                                <dt className="text-base-content/55 font-mono text-[10px] uppercase tracking-wide">
                                    {t('detail.location')}
                                </dt>
                                <dd className="text-base-content/85 mt-0.5">
                                    {[selected.city, selected.county].filter(Boolean).join(', ')}
                                </dd>
                            </div>
                            <div>
                                <dt className="text-base-content/55 font-mono text-[10px] uppercase tracking-wide">
                                    {t('detail.starts')}
                                </dt>
                                <dd className="text-base-content/85 mt-0.5 tabular-nums slashed-zero">
                                    {formatter.dateTime(new Date(selected.startDate), {
                                        month: 'short',
                                        day: 'numeric',
                                    })}
                                </dd>
                            </div>
                            <div>
                                <dt className="text-base-content/55 font-mono text-[10px] uppercase tracking-wide">
                                    {t('detail.employer')}
                                </dt>
                                <dd className="text-base-content/85 mt-0.5 truncate">
                                    {selected.employerName}
                                </dd>
                            </div>
                        </dl>

                        <div className="px-5 py-4">
                            <p className="text-base-content/65 mb-3 text-sm leading-relaxed">
                                {t('confirm_body')}
                            </p>
                            <button
                                type="button"
                                onClick={() => applyTo(selected)}
                                disabled={isPending || isDone || appliedIds.has(selected.id)}
                                className="bg-primary text-primary-content active:bg-primary/90 disabled:bg-primary/70 flex h-[64px] w-full items-center justify-center gap-2 rounded-full text-base font-bold transition-colors"
                            >
                                {isDone || appliedIds.has(selected.id) ? (
                                    <>
                                        <FontAwesomeIcon icon={faCircleCheck} className="h-5 w-5" />
                                        {t('applied_state')}
                                    </>
                                ) : (
                                    <>
                                        <FontAwesomeIcon
                                            icon={isPending ? faSpinner : faPaperPlane}
                                            className={['h-4 w-4', isPending ? 'animate-spin' : ''].join(' ')}
                                            aria-hidden
                                        />
                                        {isPending ? t('submitting') : t('confirm_cta')}
                                    </>
                                )}
                            </button>
                            {errorForSelected && (
                                <p className="text-error mt-2 text-center text-sm font-medium">
                                    {errorForSelected}
                                </p>
                            )}
                            {smsApply && (
                                <p className="text-base-content/45 mt-3 text-center text-xs">
                                    {t('sms_hint', {
                                        keyword: smsApply.keyword,
                                        number: smsApply.number,
                                    })}
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
