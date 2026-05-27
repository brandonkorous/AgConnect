'use client';

import { useState, type FormEvent } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { useQueryClient } from '@tanstack/react-query';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPaperPlane, faBolt } from '@fortawesome/free-solid-svg-icons';
import { isOk } from '@agconn/api-client';
import { getApiClient } from '@/lib/api/client';

type Channel = 'app' | 'sms';
type Mode = 'thread' | 'broadcast';

type Props = {
    conversationId: string;
    initialChannel?: Channel;
    smsCount?: number;
    mode?: Mode;
    recipientCount?: number;
    optedOutCount?: number;
};

const TEMPLATES: ReadonlyArray<'interview' | 'offer' | 'shift' | 'heat'> = [
    'interview',
    'offer',
    'shift',
    'heat',
];

export function MessageComposer({
    conversationId,
    initialChannel = 'app',
    smsCount = 0,
    mode = 'thread',
    recipientCount = 0,
    optedOutCount = 0,
}: Props) {
    const t = useTranslations('employer.messages.composer');
    const tBody = useTranslations('employer.messages.template_bodies');
    const locale = useLocale();
    const queryClient = useQueryClient();
    const [channel, setChannel] = useState<Channel>(initialChannel);
    const [body, setBody] = useState('');
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showTemplates, setShowTemplates] = useState(false);

    const isBroadcast = mode === 'broadcast';
    const reachable = Math.max(0, recipientCount - optedOutCount);
    const inQuietHours = isQuietHoursPacific();

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
                setError(res.error.message || t('error'));
                return;
            }
            setBody('');
            setShowTemplates(false);
            void queryClient.invalidateQueries({ queryKey: ['employer'] });
        } finally {
            setBusy(false);
        }
    }

    function applyTemplate(key: 'interview' | 'offer' | 'shift' | 'heat') {
        setBody(tBody(key));
        setShowTemplates(false);
    }

    return (
        <div className="bg-base-100 border-base-300 border-t p-3.5">
            {isBroadcast ? (
                <div className="alert alert-warning alert-soft text-xs mb-2 px-3 py-2 leading-relaxed">
                    <div className="font-semibold">
                        {t('broadcast_summary', {
                            reachable,
                            total: recipientCount,
                            optedOut: optedOutCount,
                        })}
                    </div>
                    {inQuietHours ? (
                        <div className="mt-0.5 opacity-90">{t('quiet_hours_notice')}</div>
                    ) : null}
                </div>
            ) : null}
            <div className="mb-2 flex flex-wrap items-center gap-1.5">
                {!isBroadcast ? (
                    <>
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
                    </>
                ) : (
                    <span className="alert alert-accent alert-soft px-3 py-1 text-xs font-bold uppercase tracking-wider">
                        {t('broadcast_chip')}
                    </span>
                )}
                <div className="flex-1" />
                <button
                    type="button"
                    onClick={() => setShowTemplates((v) => !v)}
                    className={[
                        'btn btn-sm',
                        showTemplates
                            ? 'btn-accent'
                            : '',
                    ].join(' ')}
                    title={t('templates')}
                >
                    <FontAwesomeIcon icon={faBolt} className="h-3 w-3" />
                    {t('templates')}
                </button>
            </div>
            {showTemplates && (
                <div className="border-base-300 mb-2 flex flex-wrap gap-1.5 rounded-lg border p-2">
                    {TEMPLATES.map((k) => (
                        <button
                            key={k}
                            type="button"
                            onClick={() => applyTemplate(k)}
                            className="btn btn-xs"
                        >
                            {t(`template_label.${k}`)}
                        </button>
                    ))}
                </div>
            )}
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
                    className="input w-full border-none outline-none"
                />
                <button
                    type="submit"
                    disabled={busy || body.trim().length === 0}
                    className="btn btn-sm"
                >
                    {busy ? '…' : t('send')}
                    <FontAwesomeIcon icon={faPaperPlane} className="h-3 w-3" />
                </button>
            </form>
            {error && <p className="text-error mt-1.5 text-xs">{error}</p>}
        </div>
    );
}

function isQuietHoursPacific(): boolean {
    const fmt = new Intl.DateTimeFormat('en-US', {
        timeZone: 'America/Los_Angeles',
        hour: 'numeric',
        hour12: false,
    });
    const hour = Number(fmt.format(new Date()));
    return hour >= 21 || hour < 7;
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
                'alert alert-soft px-3 py-1 text-xs',
                active
                    ? 'alert-primary font-bold'
                    : 'font-semibold',
            ].join(' ')}
        >
            {label}
        </button>
    );
}
