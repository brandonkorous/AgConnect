'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { SectionCard, StatusBadge } from './SectionCard';
import type { ClerkUser, ClerkEmail } from './types';

const EMAIL_RX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type Props = { user: ClerkUser };

export function EmailsSection({ user }: Props) {
    const t = useTranslations('employer.account.emails');
    const tErr = useTranslations('employer.account');
    const [adding, setAdding] = useState('');
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
        if (!EMAIL_RX.test(value)) {
            setError(t('invalid'));
            return;
        }
        await withGuard('add', async () => {
            const created = await user.createEmailAddress({ email: value });
            await created.prepareVerification({ strategy: 'email_link', redirectUrl: window.location.href });
            setAdding('');
        });
    }

    return (
        <SectionCard heading={t('heading')} subtitle={t('subtitle')}>
            {user.emailAddresses.length === 0 ? (
                <p className="text-base-content/60 text-sm">{t('empty')}</p>
            ) : (
                <ul className="divide-base-300 divide-y">
                    {user.emailAddresses.map((email) => (
                        <EmailRow
                            key={email.id}
                            email={email}
                            isPrimary={email.id === user.primaryEmailAddressId}
                            busy={busy === email.id}
                            onSetPrimary={() =>
                                withGuard(email.id, () =>
                                    user.update({ primaryEmailAddressId: email.id }),
                                )
                            }
                            onRemove={() => withGuard(email.id, () => email.destroy())}
                            onResend={() =>
                                withGuard(email.id, () =>
                                    email.prepareVerification({
                                        strategy: 'email_link',
                                        redirectUrl: window.location.href,
                                    }),
                                )
                            }
                        />
                    ))}
                </ul>
            )}

            <form onSubmit={onAdd} className="border-base-300 mt-5 flex flex-wrap gap-2 border-t pt-5">
                <fieldset className="fieldset w-full min-w-0 flex-1">
                    <input
                        type="email"
                        className="input w-full"
                        value={adding}
                        onChange={(e) => setAdding(e.target.value)}
                        placeholder={t('add_placeholder')}
                        autoComplete="email"
                    />
                </fieldset>
                <button
                    type="submit"
                    className="btn btn-sm btn-primary rounded-full self-end"
                    disabled={busy === 'add' || adding.trim().length === 0}
                >
                    {t('add')}
                </button>
            </form>

            {error && <p className="label text-error mt-3">{error}</p>}
        </SectionCard>
    );
}

type RowProps = {
    email: ClerkEmail;
    isPrimary: boolean;
    busy: boolean;
    onSetPrimary: () => void;
    onRemove: () => void;
    onResend: () => void;
};

function EmailRow({ email, isPrimary, busy, onSetPrimary, onRemove, onResend }: RowProps) {
    const t = useTranslations('employer.account.emails');
    const verified = email.verification?.status === 'verified';
    return (
        <li className="flex flex-wrap items-center gap-3 py-3">
            <div className="min-w-0 flex-1">
                <div className="text-base-content truncate text-sm font-medium">
                    {email.emailAddress}
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-1.5">
                    {isPrimary && <StatusBadge tone="primary" label={t('primary_badge')} />}
                    <StatusBadge
                        tone={verified ? 'verified' : 'unverified'}
                        label={verified ? t('verified_badge') : t('unverified_badge')}
                    />
                </div>
                {!verified && (
                    <p className="text-base-content/60 mt-1 text-xs">{t('verify_check_inbox')}</p>
                )}
            </div>
            <div className="flex flex-wrap gap-2">
                {!verified && (
                    <button
                        type="button"
                        className="btn btn-xs border-base-300 rounded-full border bg-transparent"
                        onClick={onResend}
                        disabled={busy}
                    >
                        {t('resend')}
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
