'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { SectionCard } from './SectionCard';
import type { ClerkUser } from './types';

type Props = { user: ClerkUser };

export function PersonalInfoSection({ user }: Props) {
    const t = useTranslations('employer.account.personal_info');
    const tErr = useTranslations('employer.account');
    const [firstName, setFirstName] = useState(user.firstName ?? '');
    const [lastName, setLastName] = useState(user.lastName ?? '');
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    function validate(): string | null {
        if (firstName.length > 64 || lastName.length > 64) return t('too_long');
        return null;
    }

    async function onSave(e: React.FormEvent) {
        e.preventDefault();
        setError(null);
        setSuccess(false);
        const v = validate();
        if (v) {
            setError(v);
            return;
        }
        setBusy(true);
        try {
            await user.update({
                firstName: firstName.trim(),
                lastName: lastName.trim(),
            });
            setSuccess(true);
        } catch {
            setError(tErr('error_generic'));
        } finally {
            setBusy(false);
        }
    }

    const dirty =
        (user.firstName ?? '') !== firstName.trim() ||
        (user.lastName ?? '') !== lastName.trim();

    return (
        <SectionCard heading={t('heading')} subtitle={t('subtitle')}>
            <form onSubmit={onSave} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <fieldset className="fieldset w-full min-w-0">
                    <legend className="fieldset-legend">{t('first_name')}</legend>
                    <input
                        type="text"
                        className="input w-full"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        autoComplete="given-name"
                        maxLength={64}
                    />
                </fieldset>
                <fieldset className="fieldset w-full min-w-0">
                    <legend className="fieldset-legend">{t('last_name')}</legend>
                    <input
                        type="text"
                        className="input w-full"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        autoComplete="family-name"
                        maxLength={64}
                    />
                </fieldset>

                {error && (
                    <p className="label text-error sm:col-span-2">{error}</p>
                )}
                {success && !error && (
                    <p className="label text-success sm:col-span-2">{t('save_success')}</p>
                )}

                <div className="sm:col-span-2">
                    <button
                        type="submit"
                        className="btn btn-sm btn-primary rounded-full"
                        disabled={busy || !dirty}
                    >
                        {t('save')}
                    </button>
                </div>
            </form>
        </SectionCard>
    );
}
