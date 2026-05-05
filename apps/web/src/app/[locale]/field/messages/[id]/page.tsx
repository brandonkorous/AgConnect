import Link from 'next/link';
import type { Route } from 'next';
import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronLeft } from '@fortawesome/free-solid-svg-icons';
import { fetchMyMessageThread } from '@/lib/api/me';
import { MessageBubble } from '@/components/field/messages/MessageBubble';
import { Composer } from '@/components/field/messages/Composer';

type Props = {
    params: Promise<{ locale: string; id: string }>;
};

export default async function FieldThreadPage({ params }: Props) {
    const { locale, id } = await params;
    const t = await getTranslations({ locale, namespace: 'worker.field.messages.thread' });
    const detail = await fetchMyMessageThread(id);
    if (!detail) notFound();

    return (
        <div className="space-y-3 pb-24">
            <Link
                href={`/${locale}/field/messages` as Route}
                className="text-base-content/65 hover:text-base-content active:text-primary -ml-1 inline-flex h-11 items-center gap-1.5 px-1 text-sm font-medium"
            >
                <FontAwesomeIcon icon={faChevronLeft} className="h-3.5 w-3.5" aria-hidden />
                {t('back')}
            </Link>
            <header className="px-1">
                <p className="text-base-content/55 mb-0.5 font-mono text-[11px] uppercase tracking-wide">
                    {t('eyebrow')}
                </p>
                <h1 className="text-base-content text-xl font-semibold leading-tight">
                    {detail.conversation.employer}
                </h1>
            </header>

            {detail.messages.length === 0 ? (
                <p className="text-base-content/55 px-1 text-center text-sm">
                    {t('empty')}
                </p>
            ) : (
                <div className="space-y-2">
                    {detail.messages.map((m) => (
                        <MessageBubble
                            key={m.id}
                            body={m.body}
                            isMe={m.isMe}
                            createdAt={m.createdAt}
                        />
                    ))}
                </div>
            )}

            <Composer conversationId={detail.conversation.id} />
        </div>
    );
}
