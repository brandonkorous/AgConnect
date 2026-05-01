'use client';

import { useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';

export function FooterNewsletter() {
    const t = useTranslations('landing.footer.newsletter');
    const tw = useTranslations('landing.waitlist');
    const locale = useLocale();
    const [email, setEmail] = useState('');
    const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'already' | 'error'>(
        'idle',
    );

    async function onSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (status === 'submitting' || !email.trim()) return;
        setStatus('submitting');

        const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:3001';
        try {
            const res = await fetch(`${apiBase}/v1/landing/waitlist`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: email.trim(),
                    locale,
                    source: 'landing_newsletter',
                }),
            });
            const json = (await res.json().catch(() => null)) as
                | { ok: true; data: { status: string; needsConfirm: boolean } }
                | { ok: false; error: { code: string; message: string } }
                | null;
            if (!res.ok || !json || !json.ok) {
                setStatus('error');
                return;
            }
            setStatus(json.data.status === 'already_confirmed' ? 'already' : 'success');
        } catch {
            setStatus('error');
        }
    }

    const successCopy =
        status === 'already' ? tw('already_confirmed') : t('success');

    return (
        <div className="bg-primary text-primary-content rounded-2xl flex flex-col items-start gap-6 p-8 lg:items-center">
            <div className="flex flex-1 flex-col gap-2">
                <p className="text-primary-content font-serif text-2xl font-semibold tracking-tight">
                    {t('headline')}
                </p>
                <p className="text-primary-content/70 font-sans text-sm">{t('body')}</p>
            </div>
            {status === 'success' || status === 'already' ? (
                <div role="status" className="alert alert-success lg:flex-1">
                    <span>{successCopy}</span>
                </div>
            ) : (
                <form
                    onSubmit={onSubmit}
                    className="flex w-full flex-col items-stretch gap-2 sm:flex-row sm:items-center lg:flex-1"
                >
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder={t('placeholder')}
                        aria-label={t('label')}
                        required
                        className="input input-bordered w-full flex-1"
                    />
                    <button
                        type="submit"
                        disabled={status === 'submitting'}
                        className="btn btn-accent w-full sm:w-auto"
                    >
                        {status === 'submitting' ? tw('submitting') : t('cta')}
                    </button>
                    {status === 'error' && (
                        <div role="alert" className="alert alert-error text-sm w-full sm:w-auto">
                            <span>{tw('error')}</span>
                        </div>
                    )}
                </form>
            )}
        </div>
    );
}
