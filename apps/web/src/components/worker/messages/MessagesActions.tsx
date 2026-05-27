'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheck, faPlus } from '@fortawesome/free-solid-svg-icons';
import { useMarkAllMessagesReadMutation } from '@/lib/api/hooks/mutations/me';

type Props = { locale: string; totalUnread: number };

export function MessagesActions({ locale, totalUnread }: Props) {
  const t = useTranslations('worker.messages');
  const markAllRead = useMarkAllMessagesReadMutation();
  const pending = markAllRead.isPending;

  function markAll() {
    markAllRead.mutate();
  }

  return (
    <>
      <button
        type="button"
        disabled={pending || totalUnread === 0}
        onClick={markAll}
        className="border-base-300 inline-flex items-center gap-1.5 rounded-full border bg-white px-3.5 py-2 text-[13px] font-semibold disabled:opacity-50"
      >
        <FontAwesomeIcon icon={faCheck} className="h-3 w-3" />
        {t('cta_mark_read')}
      </button>
      <Link
        href={`/${locale}/worker/jobs`}
        className="btn btn-primary btn-sm rounded-full"
      >
        <FontAwesomeIcon icon={faPlus} className="h-3 w-3" />
        {t('cta_new')}
      </Link>
    </>
  );
}
