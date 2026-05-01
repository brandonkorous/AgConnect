'use client';

import { useState, type FormEvent } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faPenToSquare } from '@fortawesome/free-solid-svg-icons';
import { isOk } from '@agconn/api-client';
import { getApiClient } from '@/lib/api/client';
import { Modal } from '@/components/employer/primitives/Modal';

const CATEGORIES = ['documentation', 'safety', 'wage_hour', 'pesticide', 'h2a', 'custom'] as const;
const STATUSES = ['ok', 'warn', 'fail'] as const;

export function NewComplianceItemButton() {
  const t = useTranslations('employer.compliance.new_item');
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="btn btn-sm bg-base-100 border-base-300 rounded-full border font-medium"
      >
        <FontAwesomeIcon icon={faPlus} className="h-3 w-3" />
        {t('cta')}
      </button>
      {open && <NewItemModal onClose={() => setOpen(false)} />}
    </>
  );
}

function NewItemModal({ onClose }: { onClose: () => void }) {
  const t = useTranslations('employer.compliance.new_item');
  const locale = useLocale();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const f = new FormData(e.currentTarget);
    const dueAtRaw = String(f.get('dueAt') ?? '').trim();
    const body = {
      category: String(f.get('category') ?? 'custom'),
      itemKey:
        String(f.get('label') ?? '')
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '_')
          .replace(/^_+|_+$/g, '')
          .slice(0, 60) || `item-${Date.now()}`,
      label: String(f.get('label') ?? '').trim(),
      status: String(f.get('status') ?? 'ok'),
      details: String(f.get('details') ?? '').trim() || undefined,
      dueAt: dueAtRaw ? new Date(dueAtRaw).toISOString() : undefined,
    };
    try {
      const client = getApiClient(locale === 'es' ? 'es' : 'en');
      const res = await client.post('/v1/employer/compliance/items', body, {
        handleErrorInline: true,
      });
      if (!isOk(res)) {
        setError(res.error.message || t('error'));
        return;
      }
      onClose();
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal title={t('title')} onClose={onClose} size="md">
      <form onSubmit={onSubmit} className="flex flex-col gap-3">
        {error && <div className="alert alert-error text-sm">{error}</div>}

        <fieldset className="fieldset">
          <legend className="fieldset-legend">{t('category_label')}</legend>
          <select name="category" className="select w-full">
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {t(`category.${c}`)}
              </option>
            ))}
          </select>
        </fieldset>

        <fieldset className="fieldset">
          <legend className="fieldset-legend">{t('label_label')}</legend>
          <input
            name="label"
            type="text"
            required
            minLength={2}
            maxLength={200}
            placeholder={t('label_placeholder')}
            className="input w-full"
          />
        </fieldset>

        <fieldset className="fieldset">
          <legend className="fieldset-legend">{t('status_label')}</legend>
          <select name="status" className="select w-full" defaultValue="ok">
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {t(`status.${s}`)}
              </option>
            ))}
          </select>
        </fieldset>

        <fieldset className="fieldset">
          <legend className="fieldset-legend">{t('details_label')}</legend>
          <textarea name="details" rows={2} maxLength={500} className="textarea w-full" />
        </fieldset>

        <fieldset className="fieldset">
          <legend className="fieldset-legend">{t('due_label')}</legend>
          <input name="dueAt" type="date" className="input w-full" />
        </fieldset>

        <div className="mt-2 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="btn btn-ghost btn-sm">
            {t('cancel')}
          </button>
          <button type="submit" disabled={busy} className="btn btn-primary btn-sm">
            {busy ? '…' : t('confirm')}
          </button>
        </div>
      </form>
    </Modal>
  );
}

export function EditComplianceItemButton({
  itemId,
  status,
  details,
  evidenceUrl,
  dueAt,
  label,
}: {
  itemId: string;
  status: 'ok' | 'warn' | 'fail';
  details: string;
  evidenceUrl: string | null;
  dueAt: string | null;
  label: string;
}) {
  const t = useTranslations('employer.compliance.edit_item');
  const locale = useLocale();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const f = new FormData(e.currentTarget);
    const dueAtRaw = String(f.get('dueAt') ?? '').trim();
    const body: Record<string, unknown> = {
      status: String(f.get('status') ?? 'ok'),
      details: String(f.get('details') ?? '').trim() || null,
      evidenceUrl: String(f.get('evidenceUrl') ?? '').trim() || null,
      dueAt: dueAtRaw ? new Date(dueAtRaw).toISOString() : null,
    };
    if (f.get('resolved') === 'on') body.resolved = true;
    try {
      const client = getApiClient(locale === 'es' ? 'es' : 'en');
      const res = await client.patch(`/v1/employer/compliance/items/${itemId}`, body, {
        handleErrorInline: true,
      });
      if (!isOk(res)) {
        setError(res.error.message || t('error'));
        return;
      }
      setOpen(false);
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={t('cta')}
        className="bg-base-100 border-base-300 hover:bg-base-200 grid h-6 w-6 shrink-0 place-items-center rounded border"
      >
        <FontAwesomeIcon icon={faPenToSquare} className="text-base-content/60 h-2.5 w-2.5" />
      </button>
      {open && (
        <Modal title={`${t('title')}: ${label}`} onClose={() => setOpen(false)} size="md">
          <form onSubmit={onSubmit} className="flex flex-col gap-3">
            {error && <div className="alert alert-error text-sm">{error}</div>}

            <fieldset className="fieldset">
              <legend className="fieldset-legend">{t('status_label')}</legend>
              <select name="status" className="select w-full" defaultValue={status}>
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {t(`status.${s}`)}
                  </option>
                ))}
              </select>
            </fieldset>

            <fieldset className="fieldset">
              <legend className="fieldset-legend">{t('details_label')}</legend>
              <textarea
                name="details"
                rows={2}
                maxLength={500}
                defaultValue={details}
                className="textarea w-full"
              />
            </fieldset>

            <fieldset className="fieldset">
              <legend className="fieldset-legend">{t('evidence_label')}</legend>
              <input
                name="evidenceUrl"
                type="url"
                maxLength={2048}
                defaultValue={evidenceUrl ?? ''}
                placeholder="https://…"
                className="input w-full"
              />
            </fieldset>

            <fieldset className="fieldset">
              <legend className="fieldset-legend">{t('due_label')}</legend>
              <input
                name="dueAt"
                type="date"
                defaultValue={dueAt ? dueAt.slice(0, 10) : ''}
                className="input w-full"
              />
            </fieldset>

            <label className="label cursor-pointer justify-start gap-2 py-1">
              <input type="checkbox" name="resolved" className="checkbox checkbox-sm" />
              <span className="text-sm">{t('resolved_label')}</span>
            </label>

            <div className="mt-2 flex justify-end gap-2">
              <button type="button" onClick={() => setOpen(false)} className="btn btn-ghost btn-sm">
                {t('cancel')}
              </button>
              <button type="submit" disabled={busy} className="btn btn-primary btn-sm">
                {busy ? '…' : t('confirm')}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}
