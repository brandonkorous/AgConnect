'use client';

import { useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import type { UserResource } from '@clerk/types';
import { SectionCard } from './SectionCard';

const MAX_BYTES = 5 * 1024 * 1024;

type Props = { user: UserResource };

export function ProfilePhotoSection({ user }: Props) {
    const t = useTranslations('employer.account.profile_photo');
    const tErr = useTranslations('employer.account');
    const inputRef = useRef<HTMLInputElement>(null);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function onPick(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        e.target.value = '';
        if (!file) return;
        setError(null);
        if (file.size > MAX_BYTES) {
            setError(t('upload_too_large'));
            return;
        }
        setBusy(true);
        try {
            await user.setProfileImage({ file });
        } catch {
            setError(tErr('error_generic'));
        } finally {
            setBusy(false);
        }
    }

    async function onRemove() {
        setBusy(true);
        setError(null);
        try {
            await user.setProfileImage({ file: null });
        } catch {
            setError(tErr('error_generic'));
        } finally {
            setBusy(false);
        }
    }

    return (
        <SectionCard heading={t('heading')} subtitle={t('subtitle')}>
            <div className="flex items-center gap-5">
                <img
                    src={user.imageUrl}
                    alt=""
                    className="border-base-300 h-24 w-24 shrink-0 rounded-full border object-cover"
                />
                <div className="flex flex-wrap gap-2">
                    <input
                        ref={inputRef}
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        className="hidden"
                        onChange={onPick}
                    />
                    <button
                        type="button"
                        className="btn btn-sm btn-primary rounded-full"
                        disabled={busy}
                        onClick={() => inputRef.current?.click()}
                    >
                        {t('change')}
                    </button>
                    {user.hasImage && (
                        <button
                            type="button"
                            className="btn btn-sm border-base-300 rounded-full border bg-transparent"
                            disabled={busy}
                            onClick={onRemove}
                        >
                            {t('remove')}
                        </button>
                    )}
                </div>
            </div>
            {error && <p className="label text-error mt-3">{error}</p>}
        </SectionCard>
    );
}
