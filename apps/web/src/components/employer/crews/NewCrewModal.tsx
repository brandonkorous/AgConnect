'use client';

import { useState, type FormEvent } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { isOk } from '@agconn/api-client';
import { getApiClient } from '@/lib/api/client';
import { Modal } from '@/components/employer/primitives/Modal';

type Props = {
  open: boolean;
  onClose: () => void;
};

const COLOR_OPTIONS = ['primary', 'accent', 'info', 'success', 'warning'] as const;

export function NewCrewModal({ open, onClose }: Props) {
  const t = useTranslations('employer.crews.new_crew');
  const locale = useLocale();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    const f = new FormData(e.currentTarget);
    const body = {
      name: String(f.get('name') ?? '').trim(),
      color: String(f.get('color') ?? 'primary'),
      notes: String(f.get('notes') ?? '').trim() || undefined,
    };
    try {
      const client = getApiClient(locale === 'es' ? 'es' : 'en');
      const res = await client.post('/v1/employer/crews', body, { handleErrorInline: true });
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
          <legend className="fieldset-legend">{t('name_label')}</legend>
          <input
            name="name"
            type="text"
            required
            minLength={2}
            maxLength={80}
            placeholder={t('name_placeholder')}
            className="input w-full"
          />
          <p className="label">{t('name_help')}</p>
        </fieldset>

        <fieldset className="fieldset">
          <legend className="fieldset-legend">{t('color_label')}</legend>
          <div className="flex flex-wrap gap-2">
            {COLOR_OPTIONS.map((c, i) => (
              <label key={c} className="cursor-pointer">
                <input
                  type="radio"
                  name="color"
                  value={c}
                  defaultChecked={i === 0}
                  className="peer sr-only"
                />
                <span
                  className={[
                    'border-base-300 peer-checked:border-base-content inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold',
                  ].join(' ')}
                >
                  <span
                    className={[
                      'h-2.5 w-2.5 rounded-full',
                      c === 'primary'
                        ? 'bg-primary'
                        : c === 'accent'
                          ? 'bg-accent'
                          : c === 'info'
                            ? 'bg-info'
                            : c === 'success'
                              ? 'bg-success'
                              : 'bg-warning',
                    ].join(' ')}
                  />
                  {t(`color.${c}`)}
                </span>
              </label>
            ))}
          </div>
        </fieldset>

        <fieldset className="fieldset">
          <legend className="fieldset-legend">{t('notes_label')}</legend>
          <textarea name="notes" rows={2} maxLength={500} className="textarea w-full" />
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
