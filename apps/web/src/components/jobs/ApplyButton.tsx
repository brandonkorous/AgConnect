'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Route } from 'next';
import { useTranslations } from 'next-intl';
import { useApplyToJobMutation } from '@/lib/api/hooks/mutations/applications';

type Props = {
    locale: string;
    jobId: string;
    alreadyAppliedStatus?: string | null;
    applyWith?: {
        name?: string | null;
        county?: string | null;
        skills?: string[];
        phone?: string | null;
    };
};

export function ApplyButton({ locale, jobId, alreadyAppliedStatus, applyWith }: Props) {
    const t = useTranslations('worker.application.apply');
    const router = useRouter();
    const [error, setError] = useState<string | null>(null);
    const applyMut = useApplyToJobMutation();
    const pending = applyMut.isPending;
    const dialogRef = useRef<HTMLDialogElement | null>(null);

    if (alreadyAppliedStatus && alreadyAppliedStatus !== 'withdrawn') {
        return (
            <div className="grid gap-2">
                <button type="button" disabled className="btn btn-success btn-lg w-full">
                    {t(`already_${alreadyAppliedStatus}`, { defaultValue: t('already_applied') })}
                </button>
                <button
                    type="button"
                    onClick={() => router.push(`/${locale}/worker/applications`)}
                    className="text-primary text-[12px] font-semibold"
                >
                    {t('view_application')}
                </button>
            </div>
        );
    }

    function openConfirm() {
        setError(null);
        dialogRef.current?.showModal();
    }

    async function submit() {
        const res = await applyMut.mutateAsync(jobId);
        if (res.ok) {
            dialogRef.current?.close();
            router.push(`/${locale}/worker/applications`);
            return;
        }
        if (res.code === 'conflict') {
            setError(t('error_already_applied'));
        } else if (res.code === 'unauthenticated') {
            router.push(`/${locale}/sign-in` as Route);
        } else if (res.code === 'forbidden' && /not.?onboarded/i.test(res.message)) {
            setError(t('error_not_onboarded'));
        } else if (res.code === 'forbidden') {
            setError(t('error_forbidden'));
        } else if (res.code === 'validation_failed' && /not.?active/i.test(res.message)) {
            setError(t('error_job_closed'));
        } else {
            setError(t('error'));
        }
    }

    const summary = applyWith ?? {};
    const hasSummary = Boolean(
        summary.name || summary.county || (summary.skills && summary.skills.length > 0) || summary.phone,
    );

    return (
        <>
            {error && (
                <div role="alert" className="alert alert-warning">
                    <span>{error}</span>
                </div>
            )}
            <button
                type="button"
                onClick={openConfirm}
                disabled={pending}
                className="btn btn-primary btn-lg w-full"
            >
                {pending ? t('submitting') : t('cta')}
            </button>

            <dialog ref={dialogRef} className="modal">
                <div className="modal-box">
                    <h3 className="font-serif text-[20px] font-medium">{t('confirm_title')}</h3>
                    <p className="text-base-content/70 mt-1 text-[13.5px]">{t('confirm_body')}</p>

                    {hasSummary && (
                        <div className="border-base-300 mt-4 grid gap-2 rounded-xl border p-4">
                            <div className="text-base-content/60 font-mono text-xs font-semibold uppercase tracking-[0.18em]">
                                {t('confirm_summary_label')}
                            </div>
                            <ul className="text-[13.5px] grid gap-1">
                                {summary.name && <li>{summary.name}</li>}
                                {summary.phone && (
                                    <li className="font-mono text-sm">{summary.phone}</li>
                                )}
                                {summary.county && <li>{summary.county}</li>}
                                {summary.skills && summary.skills.length > 0 && (
                                    <li className="text-base-content/70">
                                        {summary.skills.slice(0, 6).join(' · ')}
                                    </li>
                                )}
                            </ul>
                        </div>
                    )}

                    <div className="modal-action">
                        <button
                            type="button"
                            className="btn btn-ghost"
                            onClick={() => dialogRef.current?.close()}
                            disabled={pending}
                        >
                            {t('confirm_cancel')}
                        </button>
                        <button
                            type="button"
                            className="btn btn-primary"
                            onClick={submit}
                            disabled={pending}
                        >
                            {pending ? t('submitting') : t('confirm_submit')}
                        </button>
                    </div>
                </div>
                <form method="dialog" className="modal-backdrop">
                    <button type="submit">close</button>
                </form>
            </dialog>
        </>
    );
}
