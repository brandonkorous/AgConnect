'use client';

import { forwardRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { patchJob } from './api';

type Props = {
    locale: string;
    jobId: string | null;
};

export const CloseJobDialog = forwardRef<HTMLDialogElement, Props>(function CloseJobDialog(
    { locale, jobId },
    ref,
) {
    const t = useTranslations('employer.jobs.form_v2');
    const router = useRouter();
    const [closing, setClosing] = useState(false);

    async function handleClose() {
        if (!jobId) return;
        setClosing(true);
        try {
            const r = await patchJob(locale, jobId, { status: 'closed' });
            if (r.kind === 'ok') {
                router.push(`/${locale}/employer/jobs`);
            }
        } finally {
            setClosing(false);
            const dlg = (ref as React.RefObject<HTMLDialogElement | null>)?.current;
            dlg?.close();
        }
    }

    return (
        <dialog ref={ref} className="modal">
            <div className="modal-box">
                <h3 className="font-display text-xl font-normal">{t('close_modal_title')}</h3>
                <p className="text-base-content/70 mt-2 text-sm">{t('close_modal_body')}</p>
                <div className="modal-action">
                    <form method="dialog">
                        <button className="btn btn-sm border-base-300 rounded-full border bg-transparent">
                            {t('close_modal_keep')}
                        </button>
                    </form>
                    <button
                        type="button"
                        disabled={closing}
                        onClick={handleClose}
                        className="btn btn-sm btn-error rounded-full"
                    >
                        {t('close_modal_confirm')}
                    </button>
                </div>
            </div>
            <form method="dialog" className="modal-backdrop">
                <button>close</button>
            </form>
        </dialog>
    );
});
