'use client';

import { useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPaperPlane, faSpinner } from '@fortawesome/free-solid-svg-icons';
import { useSendMessageMutation } from '@/lib/api/hooks/mutations/me';

type Props = {
    conversationId: string;
};

export function Composer({ conversationId }: Props) {
    const t = useTranslations('worker.field.messages.composer');
    const [body, setBody] = useState('');
    const [error, setError] = useState<string | null>(null);
    const sendMut = useSendMessageMutation();
    const pending = sendMut.isPending;
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const trimmed = body.trim();
    const canSend = trimmed.length > 0 && !pending;

    async function send() {
        if (!canSend) return;
        const toSend = trimmed;
        setError(null);
        const res = await sendMut.mutateAsync({ conversationId, body: toSend });
        if (res.ok) {
            setBody('');
            textareaRef.current?.focus();
        } else {
            setError(t('error'));
        }
    }

    return (
        <div className="bg-base-100 border-base-300 fixed inset-x-0 bottom-[68px] z-30 border-t pb-[env(safe-area-inset-bottom)]">
            <div className="mx-auto max-w-md px-3 py-3">
                <div className="flex items-end gap-2">
                    <textarea
                        ref={textareaRef}
                        value={body}
                        onChange={(e) => setBody(e.target.value)}
                        rows={1}
                        placeholder={t('placeholder')}
                        aria-label={t('aria_label')}
                        className="border-base-300 bg-base-200 placeholder:text-base-content/45 focus:border-primary focus:bg-base-100 min-h-[48px] flex-1 resize-none rounded-2xl border px-4 py-3 text-base outline-none transition-colors"
                    />
                    <button
                        type="button"
                        onClick={send}
                        disabled={!canSend}
                        aria-label={pending ? t('sending') : t('send_aria')}
                        className="bg-primary text-primary-content active:bg-primary/90 disabled:bg-base-300 disabled:text-base-content/40 grid h-12 w-12 shrink-0 place-items-center rounded-full transition-colors"
                    >
                        <FontAwesomeIcon
                            icon={pending ? faSpinner : faPaperPlane}
                            className={['h-4 w-4', pending ? 'animate-spin' : ''].join(' ')}
                            aria-hidden
                        />
                    </button>
                </div>
                {error && (
                    <p className="text-error mt-2 px-1 text-sm font-medium">{error}</p>
                )}
            </div>
        </div>
    );
}
