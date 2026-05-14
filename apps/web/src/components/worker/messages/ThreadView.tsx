'use client';

import { useRef, useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faLeaf, faArrowRight } from '@fortawesome/free-solid-svg-icons';
import { sendMessageAction } from '@/lib/api/me-actions';
import type { ThreadDetail } from '@/lib/api/me';

type Props = { detail: ThreadDetail; locale: string };

function ThreadHeaderActions({
    detail,
    locale,
    t,
}: {
    detail: ThreadDetail;
    locale: string;
    t: ReturnType<typeof useTranslations>;
}) {
    const hasPinnedShift = Boolean(detail.conversation.pinnedShiftId);
    return (
        <div className="flex gap-2">
            {hasPinnedShift && (
                <Link
                    href={`/${locale}/worker/shifts`}
                    className="border-base-300 inline-flex items-center gap-1.5 rounded-full border bg-white px-3 py-1.5 text-[12px] font-semibold no-underline"
                >
                    <FontAwesomeIcon icon={faLeaf} className="h-3 w-3" /> {t('view_job')}
                </Link>
            )}
        </div>
    );
}

export function ThreadView({ detail, locale }: Props) {
    const t = useTranslations('worker.messages.thread');
    const tQuick = useTranslations('worker.messages.quick');
    const router = useRouter();
    const [body, setBody] = useState('');
    const [pending, startTransition] = useTransition();
    const inputRef = useRef<HTMLInputElement>(null);

    function send() {
        const value = body.trim();
        if (!value) return;
        setBody('');
        startTransition(async () => {
            await sendMessageAction(detail.conversation.id, value);
            router.refresh();
            inputRef.current?.focus();
        });
    }

    function quick(text: string) {
        startTransition(async () => {
            await sendMessageAction(detail.conversation.id, text);
            router.refresh();
        });
    }

    const initials = detail.conversation.employer
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((w) => w[0])
        .join('')
        .toUpperCase();

    const channelLabel =
        detail.conversation.channel === 'whatsapp'
            ? 'WhatsApp'
            : detail.conversation.channel === 'sms'
                ? 'SMS'
                : 'In-app';

    return (
        <div className="flex flex-col grow-8 min-w-0">
            <div className="border-base-300 flex items-center justify-between border-b px-5 py-4">
                <div className="flex items-center gap-3">
                    <div className="bg-primary grid h-10 w-10 place-items-center rounded-full font-mono text-[13px] font-bold text-white">
                        {initials || 'AC'}
                    </div>
                    <div>
                        <div className="text-[14.5px] font-semibold">
                            {detail.conversation.employer}
                        </div>
                        <div className="text-base-content/60 text-[11.5px]">
                            {detail.conversation.title} · {channelLabel}
                        </div>
                    </div>
                </div>
                <ThreadHeaderActions detail={detail} locale={locale} t={t} />
            </div>

            <div
                className="flex flex-1 flex-col gap-3 overflow-y-auto p-5"
                style={{ background: 'oklch(95% 0.01 70 / 0.5)' }}
            >
                {detail.messages.length === 0 ? (
                    <p className="text-base-content/60 text-center text-[13px]">
                        {locale === 'es'
                            ? 'Empieza la conversación abajo.'
                            : 'Start the conversation below.'}
                    </p>
                ) : (
                    detail.messages.map((m) => (
                        <div
                            key={m.id}
                            className={['flex', m.isMe ? 'justify-end' : 'justify-start'].join(' ')}
                        >
                            <div className="max-w-[78%]">
                                <div
                                    className={[
                                        'px-3.5 py-2.5 text-[13.5px] leading-relaxed',
                                        m.isMe
                                            ? 'bg-primary text-primary-content rounded-[14px_14px_4px_14px] shadow-md'
                                            : 'border-base-300 bg-base-100 text-base-content rounded-[14px_14px_14px_4px] border shadow-sm',
                                    ].join(' ')}
                                >
                                    {m.body}
                                </div>
                                <div
                                    className={[
                                        'text-base-content/60 mt-1 font-mono text-xs',
                                        m.isMe ? 'text-right' : 'text-left',
                                    ].join(' ')}
                                >
                                    {new Date(m.createdAt).toLocaleString(locale, {
                                        hour: 'numeric',
                                        minute: '2-digit',
                                        month: 'short',
                                        day: 'numeric',
                                    })}
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            <div className="border-base-300 border-t p-4">
                <form
                    onSubmit={(e) => {
                        e.preventDefault();
                        send();
                    }}
                    className="border-base-300 flex items-center gap-2.5 rounded-full border bg-white py-1 pl-3.5 pr-1"
                >
                    <input
                        ref={inputRef}
                        value={body}
                        onChange={(e) => setBody(e.target.value)}
                        placeholder={t('reply_placeholder')}
                        className="text-base-content flex-1 bg-transparent text-[13.5px] outline-none"
                        disabled={pending}
                    />
                    <button
                        type="submit"
                        disabled={pending || body.trim().length === 0}
                        className="bg-primary text-primary-content inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-[13px] font-semibold disabled:opacity-50"
                    >
                        {t('send')}
                        <FontAwesomeIcon icon={faArrowRight} className="h-3 w-3" />
                    </button>
                </form>
                <div className="mt-2.5 flex flex-wrap gap-1.5">
                    {(['got_it', 'on_my_way', 'address', 'question'] as const).map((q) => (
                        <button
                            key={q}
                            type="button"
                            disabled={pending}
                            onClick={() => quick(tQuick(q))}
                            className="border-base-300 text-base-content/80 rounded-full border bg-white px-3 py-1.5 text-[11.5px] font-medium"
                        >
                            {tQuick(q)}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}
