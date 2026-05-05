'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTriangleExclamation } from '@fortawesome/free-solid-svg-icons';
import { SectionCard } from './SectionCard';
import { DeleteAccountModal } from './DeleteAccountModal';
import type { ClerkUser } from './types';

type Props = { user: ClerkUser; locale: string; businessName: string };

export function DangerZoneSection({ user, locale, businessName }: Props) {
    const t = useTranslations('employer.account');
    const tDanger = useTranslations('employer.account.danger');
    const [open, setOpen] = useState(false);

    return (
        <>
            <SectionCard heading={tDanger('heading')} tone="danger">
                <div
                    role="alert"
                    className="border-error/30 bg-error/5 mb-5 flex gap-3 rounded-xl border p-4"
                >
                    <FontAwesomeIcon
                        icon={faTriangleExclamation}
                        className="text-error mt-0.5 h-5 w-5 shrink-0"
                    />
                    <div className="min-w-0">
                        <h3 className="text-error text-sm font-semibold">
                            {t('delete_warning_title')}
                        </h3>
                        <p className="text-base-content/80 mt-1 text-sm">
                            {t('delete_warning_body')}
                        </p>
                    </div>
                </div>
                <button
                    type="button"
                    className="btn btn-sm btn-error rounded-full"
                    onClick={() => setOpen(true)}
                >
                    {tDanger('delete_cta')}
                </button>
            </SectionCard>
            {open && (
                <DeleteAccountModal
                    user={user}
                    locale={locale}
                    businessName={businessName}
                    onClose={() => setOpen(false)}
                />
            )}
        </>
    );
}
