'use client';

import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faBullhorn,
  faPlus,
  faXmark,
  faMagnifyingGlass,
} from '@fortawesome/free-solid-svg-icons';
import { isOk } from '@agconn/api-client';
import { getApiClient } from '@/lib/api/client';
import { Modal } from '@/components/employer/primitives/Modal';

type Contact = {
  id: string;
  firstName: string;
  lastInitial: string;
  county: string | null;
  phone: string | null;
  relationship: 'hired' | 'crew' | 'applied' | 'reviewed';
};

type Variant = 'broadcast' | 'thread';

type Props = {
  variant?: Variant;
};

export function NewConversationButton({ variant = 'thread' }: Props) {
  const t = useTranslations('employer.messages.new_conversation');
  const [open, setOpen] = useState(false);

  const cta = variant === 'broadcast' ? t('cta_broadcast') : t('cta_thread');
  const icon = variant === 'broadcast' ? faBullhorn : faPlus;
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
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [contactsLoading, setContactsLoading] = useState(true);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const client = getApiClient(locale === 'es' ? 'es' : 'en');
        const res = await client.get<{ contacts: Contact[] }>(
          '/v1/employer/messages/contacts',
          { handleErrorInline: true },
        );
        if (cancelled) return;
        if (isOk(res)) setContacts(res.data.contacts);
      } finally {
        if (!cancelled) setContactsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [locale]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return contacts;
    return contacts.filter(
      (c) =>
        c.firstName.toLowerCase().includes(q) ||
        c.lastInitial.toLowerCase().includes(q) ||
        (c.county?.toLowerCase().includes(q) ?? false),
    );
  }, [contacts, search]);

  const selectedContacts = useMemo(
    () => contacts.filter((c) => selected.has(c.id)),
    [contacts, selected],
  );

  function toggle(id: string): void {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const f = new FormData(e.currentTarget);

    if (selected.size === 0) {
      setError(t('error_no_participants'));
      setBusy(false);
      return;
    }

    const body = {
      title: String(f.get('title') ?? '').trim(),
      isGroup: variant === 'broadcast' ? true : selected.size > 1,
      channel:
        variant === 'broadcast'
          ? 'broadcast'
          : (String(f.get('channel') ?? 'app') as 'app' | 'sms' | 'whatsapp'),
      participantUserIds: Array.from(selected),
    };

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
          <legend className="fieldset-legend">
            {t('participants_label')}
            {selected.size > 0 && (
              <span className="text-base-content/55 ml-2 text-[11px] font-normal">
                {t('selected_count', { n: selected.size })}
              </span>
            )}
          </legend>

          {selectedContacts.length > 0 && (
            <div className="mb-2 flex flex-wrap gap-1.5">
              {selectedContacts.map((c) => (
                <span
                  key={c.id}
                  className="bg-primary/10 text-primary inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium"
                >
                  {c.firstName} {c.lastInitial && `${c.lastInitial}.`}
                  <button
                    type="button"
                    onClick={() => toggle(c.id)}
                    className="hover:text-primary/70"
                    aria-label={t('deselect')}
                  >
                    <FontAwesomeIcon icon={faXmark} className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
          )}

          <div className="bg-base-200/40 border-base-300 mb-2 flex items-center gap-2 rounded-md border px-2.5 py-1.5">
            <FontAwesomeIcon
              icon={faMagnifyingGlass}
              className="text-base-content/40 h-3 w-3"
            />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('search_placeholder')}
              className="bg-transparent text-sm outline-none flex-1"
            />
          </div>

          <div className="border-base-300 max-h-[260px] overflow-y-auto rounded-md border">
            {contactsLoading ? (
              <div className="text-base-content/55 px-3 py-4 text-center text-xs">
                {t('loading_contacts')}
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-base-content/55 px-3 py-4 text-center text-xs">
                {contacts.length === 0 ? t('no_contacts') : t('no_matches')}
              </div>
            ) : (
              <ul className="divide-base-300/70 divide-y">
                {filtered.map((c) => {
                  const isSelected = selected.has(c.id);
                  return (
                    <li key={c.id}>
                      <button
                        type="button"
                        onClick={() => toggle(c.id)}
                        className={[
                          'flex w-full items-center gap-3 px-3 py-2 text-left text-sm transition',
                          isSelected
                            ? 'bg-primary/5'
                            : 'hover:bg-base-200/50',
                        ].join(' ')}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          readOnly
                          className="checkbox checkbox-primary checkbox-sm pointer-events-none"
                        />
                        <span className="flex-1">
                          <span className="block font-medium">
                            {c.firstName} {c.lastInitial && `${c.lastInitial}.`}
                          </span>
                          <span className="text-base-content/55 block text-[11px]">
                            {t(`relationship.${c.relationship}`)}
                            {c.county ? ` · ${c.county}` : ''}
                          </span>
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </fieldset>

        <div className="mt-2 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="btn btn-ghost btn-sm">
            {t('cancel')}
          </button>
          <button
            type="submit"
            disabled={busy || selected.size === 0}
            className="btn btn-primary btn-sm"
          >
            {busy ? '…' : t('confirm')}
          </button>
        </div>
      </form>
    </Modal>
  );
}
