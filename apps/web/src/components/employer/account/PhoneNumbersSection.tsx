'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { SectionCard, StatusBadge } from './SectionCard';
import type { ClerkUser, ClerkPhone } from './types';

const PHONE_RX = /^\+?[0-9 ()\-.]{7,20}$/;

type Props = { user: ClerkUser };

export function PhoneNumbersSection({ user }: Props) {
    const t = useTranslations('employer.account.phones');
    const tEmails = useTranslations('employer.account.emails');
    const tErr = useTranslations('employer.account');
    const [adding, setAdding] = useState('');
    const [pending, setPending] = useState<{ id: string; code: string } | null>(null);
    const [busy, setBusy] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    async function withGuard(key: string, fn: () => Promise<unknown>) {
        setBusy(key);
        setError(null);
        try {
            await fn();
        } catch {
            setError(tErr('error_generic'));
        } finally {
            setBusy(null);
        }
    }

    async function onAdd(e: React.FormEvent) {
        e.preventDefault();
        const value = adding.trim();
        if (!PHONE_RX.test(value)) {
            setError(t('invalid'));
            return;
        }
        await withGuard('add', async () => {
            const created = await user.createPhoneNumber({ phoneNumber: value });
            await created.prepareVerification();
            setPending({ id: created.id, code: '' });
            setAdding('');
        });
    }

    async function onVerify(e: React.FormEvent) {
        e.preventDefault();
        if (!pending) return;
        const phone = user.phoneNumbers.find((p) => p.id === pending.id);
        if (!phone) return;
        await withGuard('verify', async () => {
            await phone.attemptVerification({ code: pending.code.trim() });
            setPending(null);
        });
    }

    return (
        <SectionCard heading={t('heading')} subtitle={t('subtitle')}>
            {user.phoneNumbers.length === 0 ? (
                <p className="text-base-content/60 text-sm">{t('empty')}</p>
            ) : (
                <ul className="divide-base-300 divide-y">
                    {user.phoneNumbers.map((phone) => (
                        <PhoneRow
                            key={phone.id}
                            phone={phone}
                            isPrimary={phone.id === user.primaryPhoneNumberId}
                            busy={busy === phone.id}
                            onSetPrimary={() =>
                                withGuard(phone.id, () =>
                                    user.update({ primaryPhoneNumberId: phone.id }),
                                )
                            }
                            onRemove={() => withGuard(phone.id, () => phone.destroy())}
                            onResend={() =>
                                withGuard(phone.id, () => phone.prepareVerification())
                            }
                        />
                    ))}
                </ul>
            )}

            {pending ? (
                <form onSubmit={onVerify} className="border-base-300 mt-5 grid gap-3 border-t pt-5">
                    <fieldset className="fieldset w-full min-w-0">
                        <legend className="fieldset-legend">{t('verify_code_label')}</legend>
                        <input
                            type="text"
                            inputMode="numeric"
                            autoComplete="one-time-code"
                            className="input w-full max-w-xs"
                            value={pending.code}
                            onChange={(e) => setPending({ ...pending, code: e.target.value })}
                            maxLength={6}
                        />
                    </fieldset>
                    <div className="flex gap-2">
                        <button
                            type="submit"
                            className="btn btn-sm btn-primary rounded-full"
                            disabled={busy === 'verify' || pending.code.trim().length < 4}
                        >
                            {t('verify')}
                        </button>
                        <button
                            type="button"
                            className="btn btn-sm border-base-300 rounded-full border bg-transparent"
                            onClick={() => setPending(null)}
                        >
                            {tEmails('remove')}
                        </button>
                    </div>
                </form>
            ) : (
                <form onSubmit={onAdd} className="border-base-300 mt-5 flex flex-wrap gap-2 border-t pt-5">
                    <fieldset className="fieldset w-full min-w-0 flex-1">
                        <input
                            type="tel"
                            className="input w-full"
                            value={adding}
                            onChange={(e) => setAdding(e.target.value)}
                            placeholder={t('add_placeholder')}
                            autoComplete="tel"
                        />
                    </fieldset>
                    <button
                        type="submit"
                        className="btn btn-sm btn-primary rounded-full self-end"
                        disabled={busy === 'add' || adding.trim().length === 0}
                    >
                        {t('send_code')}
                    </button>
                </form>
            )}

            {error && <p className="label text-error mt-3">{error}</p>}
        </SectionCard>
    );
}

type RowProps = {
    phone: ClerkPhone;
    isPrimary: boolean;
    busy: boolean;
    onSetPrimary: () => void;
    onRemove: () => void;
    onResend: () => void;
};

function PhoneRow({ phone, isPrimary, busy, onSetPrimary, onRemove, onResend }: RowProps) {
    const t = useTranslations('employer.account.emails');
    const tPhones = useTranslations('employer.account.phones');
    const verified = phone.verification?.status === 'verified';
    return (
        <li className="flex flex-wrap items-center gap-3 py-3">
            <div className="min-w-0 flex-1">
                <div className="text-base-content truncate text-sm font-medium tabular-nums">
                    {phone.phoneNumber}
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-1.5">
                    {isPrimary && <StatusBadge tone="primary" label={t('primary_badge')} />}
                    <StatusBadge
                        tone={verified ? 'verified' : 'unverified'}
                        label={verified ? t('verified_badge') : t('unverified_badge')}
                    />
                </div>
            </div>
            <div className="flex flex-wrap gap-2">
                {!verified && (
                    <button
                        type="button"
                        className="btn btn-xs border-base-300 rounded-full border bg-transparent"
                        onClick={onResend}
                        disabled={busy}
                    >
                        {tPhones('send_code')}
                    </button>
                )}
                {!isPrimary && verified && (
                    <button
                        type="button"
                        className="btn btn-xs border-base-300 rounded-full border bg-transparent"
                        onClick={onSetPrimary}
                        disabled={busy}
                    >
                        {t('set_primary')}
                    </button>
                )}
                {!isPrimary && (
                    <button
                        type="button"
                        className="btn btn-xs text-error/90 rounded-full border-transparent bg-transparent"
                        onClick={onRemove}
                        disabled={busy}
                    >
                        {t('remove')}
                    </button>
                )}
            </div>
        </li>
    );
}
