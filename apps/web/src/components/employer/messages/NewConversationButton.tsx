'use client';

import { useState, type FormEvent } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBolt, faPlus } from '@fortawesome/free-solid-svg-icons';
import { isOk } from '@agconn/api-client';
import { getApiClient } from '@/lib/api/client';
import { Modal } from '@/components/employer/primitives/Modal';

type Variant = 'broadcast' | 'thread';

type Props = {
  variant?: Variant;
};

export function NewConversationButton({ variant = 'thread' }: Props) {
  const t = useTranslations('employer.messages.new_conversation');
  const [open, setOpen] = useState(false);

  const cta = variant === 'broadcast' ? t('cta_broadcast') : t('cta_thread');
  const icon = variant === 'broadcast' ? faBolt : faPlus;
  const className =
    variant === 'broadcast'
      ? 'btn btn-sm btn-primary rounded-full'
      : 'btn btn-sm bg-base-100 border-base-300 rounded-full border font-medium';

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={className}>
        <FontAwesomeIcon icon={icon} className="h-3 w-3" />
        {cta}
      </button>
      {open && <NewConversationModal variant={variant} onClose={() => setOpen(false)} />}
    </>
  );
}

function NewConversationModal({ variant, onClose }: { variant: Variant; onClose: () => void }) {
  const t = useTranslations('employer.messages.new_conversation');
  const locale = useLocale();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const f = new FormData(e.currentTarget);
    const participantList = String(f.get('participants') ?? '')
      .split(/[\n,]+/)
      .map((s) => s.trim())
      .filter(Boolean);

    const body = {
      title: String(f.get('title') ?? '').trim(),
      isGroup: variant === 'broadcast' ? true : participantList.length > 1,
      channel: variant === 'broadcast' ? 'broadcast' : (String(f.get('channel') ?? 'app') as 'app' | 'sms' | 'whatsapp'),
      participantUserIds: participantList,
    };

    if (body.participantUserIds.length === 0) {
      setError(t('error_no_participants'));
      setBusy(false);
      return;
    }

    try {
      const client = getApiClient(locale === 'es' ? 'es' : 'en');
      const res = await client.post('/v1/employer/messages', body, { handleErrorInline: true });
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
    <Modal
      title={variant === 'broadcast' ? t('title_broadcast') : t('title_thread')}
      onClose={onClose}
      size="md"
    >
      <form onSubmit={onSubmit} className="flex flex-col gap-3">
        {error && <div className="alert alert-error text-sm">{error}</div>}

        <fieldset className="fieldset">
          <legend className="fieldset-legend">{t('subject_label')}</legend>
          <input
            name="title"
            type="text"
            required
            minLength={1}
            maxLength={120}
            placeholder={t('subject_placeholder')}
            className="input w-full"
          />
        </fieldset>

        {variant === 'thread' && (
          <fieldset className="fieldset">
            <legend className="fieldset-legend">{t('channel_label')}</legend>
            <select name="channel" className="select w-full" defaultValue="app">
              <option value="app">{t('channel.app')}</option>
              <option value="sms">{t('channel.sms')}</option>
              <option value="whatsapp">{t('channel.whatsapp')}</option>
            </select>
          </fieldset>
        )}

        <fieldset className="fieldset">
          <legend className="fieldset-legend">{t('participants_label')}</legend>
          <textarea
            name="participants"
            rows={3}
            required
            placeholder={t('participants_placeholder')}
            className="textarea w-full"
          />
          <p className="label">{t('participants_help')}</p>
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
