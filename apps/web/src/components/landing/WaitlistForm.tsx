'use client';

import { useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowRight } from '@fortawesome/free-solid-svg-icons';

type Audience = 'worker' | 'employer';

type Props = {
    audience: Audience;
    title: string;
    inputLabel: string;
    inputPlaceholder: string;
    ctaText: string;
    helpText: string;
    successText: string;
};

export function WaitlistForm({
    audience,
    title,
    inputLabel,
    inputPlaceholder,
    ctaText,
    helpText,
    successText,
}: Props) {
    const locale = useLocale();
    const t = useTranslations('landing.waitlist');
    const [value, setValue] = useState('');
    const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');

    async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        if (status === 'submitting' || !value.trim()) return;
        setStatus('submitting');

        const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:3001';
        const trimmed = value.trim();
        const body =
            audience === 'employer'
                ? { email: trimmed, locale, audience, source: 'landing_final_cta' }
                : { phone: trimmed, locale, audience, source: 'landing_final_cta' };

        try {
            const res = await fetch(`${apiBase}/v1/landing/waitlist`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });
            setStatus(res.ok ? 'success' : 'error');
        } catch {
            setStatus('error');
        }
    }

    const inputType = audience === 'employer' ? 'email' : 'tel';
    const inputId = `final-cta-${audience}`;

    return (
        <div className="flex flex-col gap-4">
            {title && (
                <h3 className="text-base-content font-serif text-xl font-medium tracking-tight">{title}</h3>
            )}
            {status === 'success' ? (
                <div role="status" className="alert alert-success">
                    <span>{successText}</span>
                </div>
            ) : (
                <form onSubmit={onSubmit} className="flex flex-col gap-3">
                    <fieldset className="fieldset w-full">
                        <legend className="fieldset-legend text-secondary text-sm pb-1.5">{inputLabel}</legend>
                        <input
                            id={inputId}
                            type={inputType}
                            autoComplete={audience === 'employer' ? 'email' : 'tel'}
                            inputMode={audience === 'employer' ? 'email' : 'tel'}
                            placeholder={inputPlaceholder}
                            value={value}
                            onChange={(e) => setValue(e.target.value)}
                            required
                            className="input w-full"
                        />
                    </fieldset>
                    <button type="submit" disabled={status === 'submitting'} className="btn btn-primary mt-1">
                        <span>{ctaText}</span>
                        <FontAwesomeIcon icon={faArrowRight} className="text-sm" />
                    </button>
                    <p className="text-secondary mt-1 font-sans text-xs leading-relaxed">{helpText}</p>
                    {status === 'error' && (
                        <div role="alert" className="alert alert-error text-sm">
                            <span>{t('error')}</span>
                        </div>
                    )}
                </form>
            )}
        </div>
    );
}
