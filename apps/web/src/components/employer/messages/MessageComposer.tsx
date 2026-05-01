'use client';

import { useState, type FormEvent } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPaperPlane } from '@fortawesome/free-solid-svg-icons';
import { isOk } from '@agconn/api-client';
import { getApiClient } from '@/lib/api/client';

type Channel = 'app' | 'sms' | 'whatsapp';

type Props = {
  conversationId: string;
  initialChannel?: Channel;
  smsCount?: number;
};

export function MessageComposer({ conversationId, initialChannel = 'app', smsCount = 0 }: Props) {
  const t = useTranslations('employer.messages.composer');
  const locale = useLocale();
  const router = useRouter();
  const [channel, setChannel] = useState<Channel>(initialChannel);
  const [body, setBody] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!body.trim()) return;
    setBusy(true);
    setError(null);
    try {
      const client = getApiClient(locale === 'es' ? 'es' : 'en');
      const res = await client.post(
        `/v1/employer/messages/${conversationId}/messages`,
        { body: body.trim(), channel },
        { handleErrorInline: true },
      );
      if (!isOk(res)) {
        setError(res.error.message || 'Could not send.');
        return;
      }
      setBody('');
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="bg-base-100 border-base-300 border-t p-3.5">
      <div className="mb-2 flex gap-1.5">
        <ChannelChip
          label={t('channel_app')}
          active={channel === 'app'}
          onClick={() => setChannel('app')}
        />
        <ChannelChip
          label={t('channel_sms', { n: smsCount })}
          active={channel === 'sms'}
          onClick={() => setChannel('sms')}
        />
        <ChannelChip
          label={t('channel_whatsapp')}
          active={channel === 'whatsapp'}
          onClick={() => setChannel('whatsapp')}
        />
      </div>
      <form
        onSubmit={onSubmit}
        className="border-base-300 flex items-center gap-2.5 rounded-xl border p-2.5"
      >
        <input
          type="text"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder={t('placeholder')}
          maxLength={2000}
          className="flex-1 border-0 bg-transparent text-sm outline-none"
        />
        <button
          type="submit"
          disabled={busy || body.trim().length === 0}
          className="bg-base-content text-base-100 inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-xs font-semibold disabled:opacity-50"
        >
          {busy ? '…' : t('send')}
          <FontAwesomeIcon icon={faPaperPlane} className="h-3 w-3" />
        </button>
      </form>
      {error && <p className="text-error mt-1.5 text-xs">{error}</p>}
    </div>
  );
}

function ChannelChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        'rounded-full border px-3 py-1 text-[11px]',
        active
          ? 'bg-primary/15 text-primary border-primary font-bold'
          : 'bg-base-100 border-base-300 font-semibold',
      ].join(' ')}
    >
      {label}
    </button>
  );
}
