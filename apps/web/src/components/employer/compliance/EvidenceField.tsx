'use client';

import { useRef, useState, type ChangeEvent, type DragEvent } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faPaperclip,
    faFilePdf,
    faImage,
    faTrashCan,
    faArrowUpRightFromSquare,
    faCloudArrowUp,
} from '@fortawesome/free-solid-svg-icons';
import { isOk } from '@agconn/api-client';
import { getApiClient } from '@/lib/api/client';
import type { ComplianceEvidenceView } from '@/lib/api/employer-ops';

type Props = {
    itemId: string;
    initialEvidence: ComplianceEvidenceView | null;
    initialUrl: string | null;
};

const MAX_BYTES = 25 * 1024 * 1024;
const ALLOWED = '.pdf,.jpg,.jpeg,.png,.webp,.heic,.heif';

function formatBytes(n: number | null): string {
    if (n == null) return '';
    if (n < 1024) return `${n} B`;
    if (n < 1024 * 1024) return `${Math.round(n / 1024)} KB`;
    return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

function fileIcon(contentType: string | null) {
    if (contentType === 'application/pdf') return faFilePdf;
    if (contentType?.startsWith('image/')) return faImage;
    return faPaperclip;
}

export function EvidenceField({ itemId, initialEvidence, initialUrl }: Props) {
    const t = useTranslations('employer.compliance.evidence');
    const locale = useLocale();
    const router = useRouter();
    const [evidence, setEvidence] = useState<ComplianceEvidenceView | null>(initialEvidence);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [dragActive, setDragActive] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);
    const dragCounter = useRef(0);

    async function uploadFile(file: File) {
        // Client-side max-size pre-check before flipping busy state.
        if (file.size > MAX_BYTES) {
            setError(t('too_large'));
            return;
        }
        setBusy(true);
        setError(null);
        try {
            const fd = new FormData();
            fd.append('file', file);
            const client = getApiClient(locale === 'es' ? 'es' : 'en');
            const res = await client.post<{ item: { evidence: ComplianceEvidenceView | null } }>(
                `/v1/employer/compliance/items/${itemId}/evidence`,
                fd,
                { handleErrorInline: true, timeoutMs: 60_000 },
            );
            if (!isOk(res)) {
                setError(res.error.message || t('upload_error'));
                return;
            }
            setEvidence(res.data.item.evidence);
            router.refresh();
        } catch (err) {
            setError(err instanceof Error ? err.message : t('upload_error'));
        } finally {
            setBusy(false);
            if (inputRef.current) inputRef.current.value = '';
        }
    }

    async function removeFile() {
        setBusy(true);
        setError(null);
        try {
            const client = getApiClient(locale === 'es' ? 'es' : 'en');
            const res = await client.del(`/v1/employer/compliance/items/${itemId}/evidence`, {
                handleErrorInline: true,
            });
            if (!isOk(res)) {
                setError(res.error.message || t('remove_error'));
                return;
            }
            setEvidence(null);
            router.refresh();
        } catch (err) {
            setError(err instanceof Error ? err.message : t('remove_error'));
        } finally {
            setBusy(false);
        }
    }

    function onPick(e: ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (file) void uploadFile(file);
    }

    function onDragEnter(e: DragEvent<HTMLFieldSetElement>) {
        e.preventDefault();
        e.stopPropagation();
        dragCounter.current += 1;
        if (e.dataTransfer.types.includes('Files')) setDragActive(true);
    }

    function onDragLeave(e: DragEvent<HTMLFieldSetElement>) {
        e.preventDefault();
        e.stopPropagation();
        dragCounter.current -= 1;
        if (dragCounter.current <= 0) {
            dragCounter.current = 0;
            setDragActive(false);
        }
    }

    function onDragOver(e: DragEvent<HTMLFieldSetElement>) {
        e.preventDefault();
        e.stopPropagation();
    }

    function onDrop(e: DragEvent<HTMLFieldSetElement>) {
        e.preventDefault();
        e.stopPropagation();
        dragCounter.current = 0;
        setDragActive(false);
        const file = e.dataTransfer.files?.[0];
        if (file) void uploadFile(file);
    }

    return (
        <fieldset
            className="fieldset w-full min-w-0"
            onDragEnter={onDragEnter}
            onDragLeave={onDragLeave}
            onDragOver={onDragOver}
            onDrop={onDrop}
        >
            <legend className="fieldset-legend">{t('label')}</legend>

            {evidence ? (
                <div
                    className={[
                        'flex items-center gap-3 rounded-lg border p-3 transition-colors',
                        dragActive
                            ? 'border-primary bg-primary/5'
                            : 'bg-base-200 border-base-300',
                    ].join(' ')}
                >
                    <FontAwesomeIcon
                        icon={fileIcon(evidence.contentType)}
                        className="text-base-content/60 h-4 w-4 shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-medium">
                            {evidence.fileName ?? t('unnamed_file')}
                        </div>
                        <div className="text-base-content/60 text-xs">
                            {formatBytes(evidence.size)}
                        </div>
                    </div>
                    <a
                        href={evidence.downloadPath}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-ghost btn-sm gap-1.5"
                        aria-label={t('view')}
                    >
                        <FontAwesomeIcon icon={faArrowUpRightFromSquare} className="h-3 w-3" />
                        {t('view')}
                    </a>
                    <button
                        type="button"
                        onClick={() => inputRef.current?.click()}
                        disabled={busy}
                        className="btn btn-ghost btn-sm"
                    >
                        {busy ? t('uploading') : t('replace')}
                    </button>
                    <button
                        type="button"
                        onClick={removeFile}
                        disabled={busy}
                        className="btn btn-ghost btn-sm text-error gap-1.5"
                        aria-label={t('remove')}
                    >
                        <FontAwesomeIcon icon={faTrashCan} className="h-3 w-3" />
                    </button>
                </div>
            ) : (
                <div className="flex flex-col gap-2">
                    <input
                        name="evidenceUrl"
                        type="url"
                        maxLength={2048}
                        defaultValue={initialUrl ?? ''}
                        placeholder="https://…"
                        className="input w-full"
                    />
                    <button
                        type="button"
                        onClick={() => inputRef.current?.click()}
                        disabled={busy}
                        className={[
                            'flex w-full flex-col items-center justify-center gap-1.5 rounded-lg border-2 border-dashed px-4 py-6 text-center transition-colors',
                            dragActive
                                ? 'border-primary bg-primary/5 text-primary'
                                : 'border-base-300 hover:border-base-content/30 hover:bg-base-200/40 text-base-content/70',
                        ].join(' ')}
                    >
                        <FontAwesomeIcon icon={faCloudArrowUp} className="h-5 w-5" />
                        <span className="text-sm font-medium">
                            {dragActive ? t('drop_active') : t('drop_hint')}
                        </span>
                        <span className="text-base-content/55 text-xs">
                            {t('upload_help')}
                        </span>
                    </button>
                </div>
            )}

            {busy && (
                <div className="mt-2 flex flex-col gap-1">
                    <progress className="progress progress-primary w-full" />
                    <span className="text-base-content/60 text-xs">
                        {t('upload_progress')}
                    </span>
                </div>
            )}

            <input
                ref={inputRef}
                type="file"
                accept={ALLOWED}
                onChange={onPick}
                className="hidden"
                aria-hidden="true"
            />

            {error && (
                <div role="alert" aria-live="polite" className="text-error mt-1 text-xs">
                    {error}
                </div>
            )}
        </fieldset>
    );
}
