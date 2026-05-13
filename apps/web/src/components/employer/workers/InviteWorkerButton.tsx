'use client';

import { useState, type FormEvent } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { isOk } from '@agconn/api-client';
import { getApiClient } from '@/lib/api/client';
import { Modal } from '@/components/employer/primitives/Modal';

type Job = { id: string; titleEn: string; titleEs: string };

type Props = {
    workerId: string;
    workerFirstName: string;
    jobs: Job[];
    variant?: 'card' | 'detail';
    alreadyInvited?: boolean;
};

export function InviteWorkerButton({
    workerId,
    workerFirstName,
    jobs,
    variant = 'card',
    alreadyInvited,
}: Props) {
    const t = useTranslations('employer.workers');
    const tModal = useTranslations('employer.workers.invite_modal');
    const locale = useLocale();
    const router = useRouter();
    const [open, setOpen] = useState(false);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [done, setDone] = useState(alreadyInvited === true);

    async function submit(e: FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setBusy(true);
        setError(null);
        const f = new FormData(e.currentTarget);
        const jobId = String(f.get('jobId') ?? '');
        const message = String(f.get('message') ?? '').trim() || undefined;
        if (!jobId) {
            setError(tModal('error_no_job'));
            setBusy(false);
            return;
        }
        try {
            const client = getApiClient(locale === 'es' ? 'es' : 'en');
            const res = await client.post(
                `/v1/employer/workers/${workerId}/invite`,
                { jobId, message },
                { handleErrorInline: true },
            );
            if (!isOk(res)) {
                setError(res.error.message || tModal('error'));
                return;
            }
            setOpen(false);
            setDone(true);
            router.refresh();
        } finally {
            setBusy(false);
        }
    }

    const ariaLabel = done ? t('invited_label') : t('invite');
    const baseClass =
        variant === 'detail'
            ? 'btn btn-sm'
            : 'rounded-full px-3.5 py-1.5 text-xs font-semibold';
    const className = done
        ? `${baseClass} bg-success/15 text-success cursor-not-allowed`
        : variant === 'detail'
            ? `${baseClass} btn-primary`
            : `${baseClass} bg-base-content text-base-100 hover:opacity-90`;

    return (
        <>
            <button
                type="button"
                onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (!done) setOpen(true);
                }}
                disabled={done || jobs.length === 0}
                title={jobs.length === 0 ? tModal('no_active_jobs') : ariaLabel}
                className={className}
            >
                {done ? t('invited_label') : t('invite')}
                {variant !== 'detail' && !done && ' →'}
            </button>

            {open && (
                <Modal title={tModal('title')} onClose={() => setOpen(false)} size="md">
                    <form onSubmit={submit}>
                        {error && <div className="alert alert-error mb-3 text-xs">{error}</div>}
                        <fieldset className="fieldset">
                            <legend className="fieldset-legend">{tModal('job_label')}</legend>
                            <select name="jobId" required className="select w-full" defaultValue="">
                                <option value="" disabled>
                                    {tModal('select_job')}
                                </option>
                                {jobs.map((j) => (
                                    <option key={j.id} value={j.id}>
                                        {locale === 'es' ? j.titleEs : j.titleEn}
                                    </option>
                                ))}
                            </select>
                        </fieldset>
                        <fieldset className="fieldset">
                            <legend className="fieldset-legend">{tModal('message_label')}</legend>
                            <textarea
                                name="message"
                                rows={3}
                                maxLength={500}
                                placeholder={tModal('message_placeholder', { firstName: workerFirstName })}
                                className="textarea w-full"
                            />
                        </fieldset>
                        <div className="mt-4 flex justify-end gap-2">
                            <button
                                type="button"
                                onClick={() => setOpen(false)}
                                className="btn btn-ghost btn-sm"
                            >
                                {tModal('cancel')}
                            </button>
                            <button type="submit" disabled={busy} className="btn btn-primary btn-sm">
                                {busy ? '…' : tModal('confirm')}
                            </button>
                        </div>
                    </form>
                </Modal>
            )}
        </>
    );
}
