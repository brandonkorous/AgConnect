'use client';

import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { useMyMessageThreadsSuspense } from '@/lib/api/hooks/messages';

const CHANNEL_LABEL: Record<string, string> = {
  sms: 'SMS',
  app: 'In-app',
};

export function MessagesCard() {
  const locale = useLocale();
  const t = useTranslations('worker.dashboard.messages');
  const { data } = useMyMessageThreadsSuspense();
  const { threads, totalUnread } = data;
  const top = threads.slice(0, 3);

  return (
    <section className="bg-base-100 border-base-300 rounded-2xl border">
      <header className="border-base-300 flex items-center justify-between border-b px-4 py-3.5">
        <h3 className="font-serif text-lg font-medium tracking-tight">{t('title')}</h3>
        {totalUnread > 0 && (
          <span className="badge badge-accent px-2 py-1 font-mono text-[10px] font-bold tracking-wider">
            {t('new_count', { count: totalUnread })}
          </span>
        )}
      </header>
      {top.length === 0 ? (
        <div className="px-4 py-6 text-center">
          <p className="text-base-content/60 text-sm">
            {locale === 'es' ? 'Sin mensajes nuevos.' : 'No messages yet.'}
          </p>
        </div>
      ) : (
        <ul>
          {top.map((th, i) => (
            <li
              key={th.id}
              className={[
                'flex gap-2.5 px-4 py-3',
                i < top.length - 1 ? 'border-base-300 border-b' : '',
              ].join(' ')}
            >
              <div className="bg-base-200 text-base-content/70 grid h-7 w-7 shrink-0 place-items-center rounded-full text-xs font-bold">
                {th.employer[0]}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-2">
                  <Link
                    href={`/${locale}/worker/messages?thread=${th.id}`}
                    className="text-base-content text-sm font-semibold no-underline"
                  >
                    {th.employer}
                  </Link>
                  <div className="text-base-content/60 font-mono text-[10px]">
                    {CHANNEL_LABEL[th.channel] ?? th.channel}
                  </div>
                </div>
                <p className="text-base-content/70 mt-0.5 truncate text-sm leading-snug">
                  {th.lastMessage?.body ?? th.title}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
