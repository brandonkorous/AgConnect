'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { SectionCard } from './SectionCard';
import type { ClerkUser } from './types';

type Props = { user: ClerkUser };

export function PasswordSection({ user }: Props) {
    const t = useTranslations('employer.account.password');
    const tErr = useTranslations('employer.account');
    const [current, setCurrent] = useState('');
    const [next, setNext] = useState('');
    const [confirm, setConfirm] = useState('');
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    async function onSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError(null);
        setSuccess(false);
        if (next.length < 8) {
            setError(t('too_short'));
            return;
        }
        if (next !== confirm) {
            setError(t('mismatch'));
            return;
        }
        setBusy(true);
        try {
            await user.updatePassword({
                newPassword: next,
                currentPassword: user.passwordEnabled ? current : undefined,
                signOutOfOtherSessions: true,
            });
            setSuccess(true);
            setCurrent('');
            setNext('');
            setConfirm('');
        } catch {
            setError(tErr('error_generic'));
        } finally {
            setBusy(false);
        }
    }

    return (
        <SectionCard heading={t('heading')} subtitle={t('subtitle')}>
            <form onSubmit={onSubmit} className="grid gap-4 sm:max-w-md">
                {user.passwordEnabled && (
                    <fieldset className="fieldset w-full min-w-0">
                        <legend className="fieldset-legend">{t('current')}</legend>
                        <input
                            type="password"
                            className="input w-full"
                            value={current}
                            onChange={(e) => setCurrent(e.target.value)}
                            autoComplete="current-password"
                        />
                    </fieldset>
                )}
                <fieldset className="fieldset w-full min-w-0">
                    <legend className="fieldset-legend">{t('new')}</legend>
                    <input
                        type="password"
                        className="input w-full"
                        value={next}
                        onChange={(e) => setNext(e.target.value)}
                        autoComplete="new-password"
                        minLength={8}
                    />
                </fieldset>
                <fieldset className="fieldset w-full min-w-0">
                    <legend className="fieldset-legend">{t('confirm')}</legend>
                    <input
                        type="password"
                        className="input w-full"
                        value={confirm}
                        onChange={(e) => setConfirm(e.target.value)}
                        autoComplete="new-password"
                        minLength={8}
                    />
                </fieldset>

                {error && <p className="label text-error">{error}</p>}
                {success && !error && (
                    <p className="label text-success">{t('update_success')}</p>
                )}

                <div>
                    <button
                        type="submit"
                        className="btn btn-sm btn-primary rounded-full"
                        disabled={busy || next.length === 0}
                    >
                        {t('update')}
                    </button>
                </div>
            </form>
        </SectionCard>
    );
}
