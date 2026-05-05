'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGoogle, faMicrosoft, faApple } from '@fortawesome/free-brands-svg-icons';
import type { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import { SectionCard } from './SectionCard';
import type { ClerkUser } from './types';

type ProviderKey = 'google' | 'microsoft' | 'apple';

const PROVIDERS: { key: ProviderKey; icon: IconDefinition; strategy: 'oauth_google' | 'oauth_microsoft' | 'oauth_apple'; labelKey: 'connect_google' | 'connect_microsoft' | 'connect_apple'; title: string }[] = [
    { key: 'google', icon: faGoogle, strategy: 'oauth_google', labelKey: 'connect_google', title: 'Google' },
    { key: 'microsoft', icon: faMicrosoft, strategy: 'oauth_microsoft', labelKey: 'connect_microsoft', title: 'Microsoft' },
    { key: 'apple', icon: faApple, strategy: 'oauth_apple', labelKey: 'connect_apple', title: 'Apple' },
];

type Props = { user: ClerkUser; locale: string };

export function ConnectedAccountsSection({ user, locale }: Props) {
    const t = useTranslations('employer.account.connected');
    const tErr = useTranslations('employer.account');
    const [busy, setBusy] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    async function onConnect(strategy: 'oauth_google' | 'oauth_microsoft' | 'oauth_apple') {
        setBusy(strategy);
        setError(null);
        try {
            const account = await user.createExternalAccount({
                strategy,
                redirectUrl: `/${locale}/employer/account`,
            });
            const url = account.verification?.externalVerificationRedirectURL;
            if (url) {
                window.location.href = url.toString();
                return;
            }
            setError(t('error'));
        } catch {
            setError(t('error'));
        } finally {
            setBusy(null);
        }
    }

    async function onDisconnect(id: string) {
        const acc = user.externalAccounts.find((a) => a.id === id);
        if (!acc) return;
        setBusy(id);
        setError(null);
        try {
            await acc.destroy();
        } catch {
            setError(tErr('error_generic'));
        } finally {
            setBusy(null);
        }
    }

    const connectedByProvider = new Map(
        user.externalAccounts.map((a) => [a.provider, a]),
    );

    return (
        <SectionCard heading={t('heading')} subtitle={t('subtitle')}>
            <ul className="divide-base-300 divide-y">
                {PROVIDERS.map((p) => {
                    const connected = connectedByProvider.get(p.key);
                    return (
                        <li key={p.key} className="flex flex-wrap items-center gap-3 py-3">
                            <FontAwesomeIcon icon={p.icon} className="text-base-content/70 h-5 w-5" />
                            <div className="min-w-0 flex-1">
                                <div className="text-base-content text-sm font-medium">{p.title}</div>
                                {connected && (
                                    <div className="text-base-content/60 truncate text-xs">
                                        {t('connected_at', {
                                            label:
                                                connected.emailAddress ||
                                                connected.username ||
                                                connected.accountIdentifier?.() ||
                                                p.title,
                                        })}
                                    </div>
                                )}
                            </div>
                            {connected ? (
                                <button
                                    type="button"
                                    className="btn btn-xs text-error/90 rounded-full border-transparent bg-transparent"
                                    disabled={busy === connected.id}
                                    onClick={() => onDisconnect(connected.id)}
                                >
                                    {t('disconnect')}
                                </button>
                            ) : (
                                <button
                                    type="button"
                                    className="btn btn-sm border-base-300 rounded-full border bg-transparent"
                                    disabled={busy === p.strategy}
                                    onClick={() => onConnect(p.strategy)}
                                >
                                    {t(p.labelKey)}
                                </button>
                            )}
                        </li>
                    );
                })}
            </ul>
            {user.externalAccounts.length === 0 && (
                <p className="text-base-content/60 mt-3 text-xs">{t('empty')}</p>
            )}
            {error && <p className="label text-error mt-3">{error}</p>}
        </SectionCard>
    );
}
