import Link from 'next/link';
import type { Route } from 'next';
import { useFormatter, useTranslations } from 'next-intl';
import type { Thread } from '@/lib/api/hooks/messages';

type Props = {
    locale: string;
    thread: Thread;
};

export function ThreadListItem({ locale, thread }: Props) {
    const t = useTranslations('worker.field.messages');
    const formatter = useFormatter();
    const direction = thread.lastMessage?.direction;
    const preview = thread.lastMessage?.body ?? t('no_messages_yet');
    const previewPrefix = direction === 'outbound' ? `${t('you_prefix')} ` : '';

    return (
        <li>
            <Link
                href={`/${locale}/field/messages/${encodeURIComponent(thread.id)}` as Route}
                className="bg-base-100 border-base-300 active:bg-base-200 flex items-start gap-3 rounded-2xl border px-4 py-3.5 transition-colors"
            >
                <span className="bg-base-200 text-base-content/70 grid h-12 w-12 shrink-0 place-items-center rounded-full text-sm font-bold">
                    {(thread.employer ?? '·').slice(0, 1).toUpperCase()}
                </span>
                <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-2">
                        <p className="text-base-content truncate text-base font-semibold leading-tight">
                            {thread.employer}
                        </p>
                        {thread.lastMessageAt && (
                            <span className="text-base-content/55 shrink-0 tabular-nums slashed-zero text-xs">
                                {formatter.relativeTime(new Date(thread.lastMessageAt))}
                            </span>
                        )}
                    </div>
                    <p
                        className={[
                            'mt-1 truncate text-sm leading-snug',
                            thread.unreadCount > 0
                                ? 'text-base-content font-semibold'
                                : 'text-base-content/65',
                        ].join(' ')}
                    >
                        {previewPrefix}
                        {preview}
                    </p>
                </div>
                {thread.unreadCount > 0 && (
                    <span className="bg-accent text-accent-content tabular-nums slashed-zero ml-1 mt-1 inline-flex h-5 min-w-[20px] shrink-0 items-center justify-center rounded-full px-1.5 text-xs font-bold">
                        {thread.unreadCount}
                    </span>
                )}
            </Link>
        </li>
    );
}
