'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faShieldHalved, faKey } from '@fortawesome/free-solid-svg-icons';
import { SectionCard, StatusBadge } from './SectionCard';
import type { ClerkUser } from './types';

type Props = { user: ClerkUser };

type SetupState = {
    secret: string;
    uri: string;
    code: string;
};

export function TwoStepVerificationSection({ user }: Props) {
    const t = useTranslations('employer.account.tsv');
    const tErr = useTranslations('employer.account');
    const [setup, setSetup] = useState<SetupState | null>(null);
    const [backupCodes, setBackupCodes] = useState<string[] | null>(null);
    const [busy, setBusy] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    async function withGuard(key: string, fn: () => Promise<void>) {
        setError(null);
        setBusy(key);
        try {
            await fn();
        } catch {
            setError(tErr('error_generic'));
        } finally {
            setBusy(null);
        }
    }

    const onBeginSetup = () =>
        withGuard('begin', async () => {
            const totp = await user.createTOTP();
            setSetup({ secret: totp.secret ?? '', uri: totp.uri ?? '', code: '' });
            setBackupCodes(null);
        });

    async function onVerify(e: React.FormEvent) {
        e.preventDefault();
        if (!setup) return;
        await withGuard('verify', async () => {
            await user.verifyTOTP({ code: setup.code.trim() });
            const codes = await user.createBackupCode();
            setBackupCodes(codes.codes ?? []);
            setSetup(null);
        });
    }

    const onDisable = () =>
        withGuard('disable', async () => {
            await user.disableTOTP();
            setSetup(null);
            setBackupCodes(null);
        });

    const onRegenerate = () =>
        withGuard('regen', async () => {
            const codes = await user.createBackupCode();
            setBackupCodes(codes.codes ?? []);
        });

    const enabled = user.totpEnabled;

    return (
        <SectionCard heading={t('heading')} subtitle={t('subtitle')}>
            <div className="mb-4 flex flex-wrap items-center gap-3">
                <FontAwesomeIcon
                    icon={faShieldHalved}
                    className={enabled ? 'text-success h-5 w-5' : 'text-base-content/50 h-5 w-5'}
                />
                <span className="text-sm">{enabled ? t('enabled') : t('disabled')}</span>
                <StatusBadge
                    tone={enabled ? 'verified' : 'unverified'}
                    label={enabled ? t('enabled') : t('disabled')}
                />
            </div>

            {!enabled && !setup && (
                <button
                    type="button"
                    className="btn btn-sm btn-primary rounded-full"
                    onClick={onBeginSetup}
                    disabled={busy === 'begin'}
                >
                    {t('add_cta')}
                </button>
            )}

            {setup && (
                <form onSubmit={onVerify} className="border-base-300 mt-2 grid gap-4 border-t pt-5">
                    <p className="text-base-content/80 text-sm">{t('qr_instructions')}</p>
                    {setup.uri && (
                        <img
                            src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(setup.uri)}`}
                            alt=""
                            className="border-base-300 h-44 w-44 rounded-xl border bg-white p-2"
                        />
                    )}
                    <fieldset className="fieldset w-full min-w-0 max-w-sm">
                        <legend className="fieldset-legend">{t('secret_label')}</legend>
                        <kbd className="kbd font-mono break-all text-xs">{setup.secret}</kbd>
                    </fieldset>
                    <fieldset className="fieldset w-full min-w-0 max-w-xs">
                        <legend className="fieldset-legend">{t('code_label')}</legend>
                        <input
                            type="text"
                            inputMode="numeric"
                            autoComplete="one-time-code"
                            className="input w-full tabular-nums"
                            value={setup.code}
                            onChange={(e) => setSetup({ ...setup, code: e.target.value })}
                            maxLength={6}
                        />
                    </fieldset>
                    <div className="flex gap-2">
                        <button
                            type="submit"
                            className="btn btn-sm btn-primary rounded-full"
                            disabled={busy === 'verify' || setup.code.trim().length < 6}
                        >
                            {t('verify')}
                        </button>
                        <button
                            type="button"
                            className="btn btn-sm border-base-300 rounded-full border bg-transparent"
                            onClick={() => setSetup(null)}
                        >
                            {tErr('emails.remove')}
                        </button>
                    </div>
                </form>
            )}

            {backupCodes && backupCodes.length > 0 && (
                <div className="border-base-300 mt-5 grid gap-2 border-t pt-5">
                    <div className="flex items-center gap-2">
                        <FontAwesomeIcon icon={faKey} className="text-base-content/70 h-4 w-4" />
                        <h3 className="text-sm font-semibold">{t('backup_codes_title')}</h3>
                    </div>
                    <p className="text-base-content/70 text-xs">{t('backup_codes_save')}</p>
                    <ul className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                        {backupCodes.map((c) => (
                            <li key={c}>
                                <kbd className="kbd font-mono w-full justify-center text-xs">{c}</kbd>
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {enabled && !setup && (
                <div className="border-base-300 mt-5 flex flex-wrap gap-2 border-t pt-5">
                    <button
                        type="button"
                        className="btn btn-sm border-base-300 rounded-full border bg-transparent"
                        onClick={onRegenerate}
                        disabled={busy === 'regen'}
                    >
                        {t('regenerate_codes')}
                    </button>
                    <button
                        type="button"
                        className="btn btn-sm text-error/90 rounded-full border-transparent bg-transparent"
                        onClick={onDisable}
                        disabled={busy === 'disable'}
                    >
                        {t('remove_cta')}
                    </button>
                </div>
            )}

            {error && <p className="label text-error mt-3">{error}</p>}
        </SectionCard>
    );
}
