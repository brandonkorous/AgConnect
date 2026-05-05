'use client';

import { useTranslations } from 'next-intl';
import type { JobFormState } from './types';

type Props = {
    open: boolean;
    before: JobFormState;
    after: JobFormState;
    submitting: boolean;
    onCancel: () => void;
    onConfirm: () => void;
};

const TRACKED_FIELDS: Array<{ path: keyof JobFormState; labelKey: string; format?: (v: unknown) => string }> = [
    { path: 'titleEn', labelKey: 'field_title' },
    { path: 'titleEs', labelKey: 'field_title_es' },
    { path: 'startDate', labelKey: 'field_start_date' },
    { path: 'endDate', labelKey: 'field_end_date' },
    { path: 'dailyStartTime', labelKey: 'field_daily_start' },
    { path: 'dailyEndTime', labelKey: 'field_daily_end' },
    { path: 'positionsTotal', labelKey: 'field_crew_size' },
    {
        path: 'wageMin',
        labelKey: 'field_base_rate_min',
        format: (v) => (typeof v === 'number' ? `$${v}/hr` : String(v ?? '')),
    },
    {
        path: 'wageMax',
        labelKey: 'field_base_rate_max',
        format: (v) => (typeof v === 'number' ? `$${v}/hr` : String(v ?? '')),
    },
    { path: 'pieceRate', labelKey: 'field_piece_rate' },
    { path: 'siteAddress', labelKey: 'field_site_address' },
    { path: 'pickupPoint', labelKey: 'field_pickup' },
    { path: 'county', labelKey: 'field_county' },
];

export function DiffPreviewModal({ open, before, after, submitting, onCancel, onConfirm }: Props) {
    const t = useTranslations('employer.jobs.form_v2');
    if (!open) return null;

    const changes = TRACKED_FIELDS.flatMap((f) => {
        const a = before[f.path];
        const b = after[f.path];
        if (a === b) return [];
        const formatVal = (v: unknown) => (f.format ? f.format(v) : v == null || v === '' ? '—' : String(v));
        return [{ labelKey: f.labelKey, before: formatVal(a), after: formatVal(b) }];
    });

    return (
        <dialog className="modal modal-open">
            <div className="modal-box max-w-lg">
                <h3 className="font-display text-xl font-normal">{t('diff_modal_title')}</h3>
                <p className="text-base-content/70 mt-1.5 text-sm">{t('diff_modal_body')}</p>

                {changes.length === 0 ? (
                    <p className="bg-base-200 mt-4 rounded-xl p-3.5 text-sm">
                        {t('diff_modal_no_changes')}
                    </p>
                ) : (
                    <ul className="mt-4 space-y-2">
                        {changes.map((c) => (
                            <li
                                key={c.labelKey}
                                className="border-base-300 rounded-xl border p-3"
                            >
                                <div className="text-base-content/55 mb-1 font-mono text-[10px] font-bold uppercase tracking-wider">
                                    {t(c.labelKey)}
                                </div>
                                <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 text-sm">
                                    <span className="text-base-content/55 line-through">{c.before}</span>
                                    <span className="text-base-content/40 font-mono text-xs" aria-hidden>
                                        →
                                    </span>
                                    <span className="text-base-content font-semibold">{c.after}</span>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}

                <div className="modal-action">
                    <button
                        type="button"
                        onClick={onCancel}
                        disabled={submitting}
                        className="btn btn-sm border-base-300 rounded-full border bg-transparent"
                    >
                        {t('cancel')}
                    </button>
                    <button
                        type="button"
                        onClick={onConfirm}
                        disabled={submitting || changes.length === 0}
                        className="btn btn-sm btn-primary rounded-full"
                    >
                        {t('diff_modal_send')}
                    </button>
                </div>
            </div>
            <form method="dialog" className="modal-backdrop">
                <button type="button" onClick={onCancel}>
                    close
                </button>
            </form>
        </dialog>
    );
}
