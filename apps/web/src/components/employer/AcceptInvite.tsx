'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Route } from 'next';
import { useTranslations } from 'next-intl';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCircleCheck } from '@fortawesome/free-solid-svg-icons';
import { useAcceptInviteMutation } from '@/lib/api/hooks/mutations/members';
import { useActiveEmployer } from '@/lib/context/active-employer-context';

type Props = { token: string; locale: string };

// Accepting links the invite to whatever identity is signed in (Clerk
// protects this route, so there always is one) — reusing an existing
// worker account rather than ever creating a second one.
export function AcceptInvite({ token, locale }: Props) {
    const t = useTranslations('employer.accept_invite');
    const tRoles = useTranslations('employer.roles');
    const router = useRouter();
    const acceptMut = useAcceptInviteMutation();
    const { setActiveEmployer } = useActiveEmployer();
    const pending = acceptMut.isPending;
    const [error, setError] = useState<string | null>(null);
    const [done, setDone] = useState<{ employerName: string; roleKey: string } | null>(null);

    const KNOWN_CODES = new Set([
        'invalid_invite',
        'already_accepted',
        'invite_expired',
        'invite_bound_elsewhere',
    ]);

    async function accept() {
        setError(null);
        const res = await acceptMut.mutateAsync(token);
        if (res.ok) {
            setActiveEmployer(res.employerId);
            setDone({ employerName: res.employerName, roleKey: res.roleKey });
        } else {
            setError(
                KNOWN_CODES.has(res.code) ? t(`error.${res.code}`) : t('error.generic'),
            );
        }
    }

    if (done) {
        return (
            <div className="mt-6">
                <div className="text-success flex items-center gap-2">
                    <FontAwesomeIcon icon={faCircleCheck} className="h-5 w-5" />
                    <span className="font-semibold">{t('success_title')}</span>
                </div>
                <p className="text-base-content/70 mt-2 text-sm">
                    {t('success_body', {
                        employer: done.employerName,
                        role: tRoles(done.roleKey),
                    })}
                </p>
                <button
                    type="button"
                    className="btn btn-primary mt-6 w-full rounded-full font-semibold"
                    onClick={() => router.push(`/${locale}/employer/dashboard` as Route)}
                >
                    {t('go_to_dashboard')}
                </button>
            </div>
        );
    }

    return (
        <div className="mt-6">
            {error && (
                <div role="alert" className="alert alert-error alert-soft mb-4 text-sm">
                    {error}
                </div>
            )}
            <button
                type="button"
                className="btn btn-primary w-full rounded-full font-semibold"
                disabled={pending}
                aria-busy={pending}
                onClick={accept}
            >
                {pending && <span className="loading loading-spinner loading-xs" />}
                {t('accept')}
            </button>
        </div>
    );
}
