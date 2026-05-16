'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { Route } from 'next';
import { useTranslations } from 'next-intl';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBars } from '@fortawesome/free-solid-svg-icons';
import { Wordmark } from '@/components/primitives/Wordmark';
import { SideDrawer } from '@/components/shell/SideDrawer';
import {
    EmployerSidebar,
    type SwitcherEmployer,
} from '@/components/employer/EmployerSidebar';

type Props = {
    locale: string;
    displayName: string;
    initials: string;
    candidatesCount?: number;
    jobsCount?: number;
    complianceCount?: number;
    messagesCount?: number;
    permissions?: string[];
    scope?: string | null;
    employers?: SwitcherEmployer[];
    activeEmployerId?: string | null;
};

export function EmployerMobileShell({
    locale,
    displayName,
    initials,
    candidatesCount,
    jobsCount,
    complianceCount,
    messagesCount,
    permissions,
    scope,
    employers,
    activeEmployerId,
}: Props) {
    const t = useTranslations('shell.mobile');
    const [open, setOpen] = useState(false);

    return (
        <>
            <header className="bg-base-300 border-base-200 sticky top-0 z-30 flex h-14 items-center gap-3 border-b px-4 print:hidden md:hidden">
                <button
                    type="button"
                    onClick={() => setOpen(true)}
                    aria-label={t('open_menu_aria')}
                    aria-expanded={open}
                    aria-controls="employer-drawer"
                    className="text-base-content/75 hover:text-base-content active:bg-base-200 -ml-2 grid h-11 w-11 place-items-center rounded-full"
                >
                    <FontAwesomeIcon icon={faBars} className="h-4 w-4" aria-hidden />
                </button>
                <Link
                    href={`/${locale}/employer/dashboard` as Route}
                    aria-label="AGCONN home"
                    className="flex h-full items-center"
                >
                    <Wordmark size="sm" tone="ink" />
                </Link>
                <span className="bg-base-content text-base-100 ml-1 rounded px-1.5 py-0.5 font-mono text-[10px] font-bold tracking-wider">
                    HIRE
                </span>
            </header>

            <div id="employer-drawer">
                <SideDrawer
                    open={open}
                    onClose={() => setOpen(false)}
                    ariaLabel={t('drawer_aria')}
                >
                    <EmployerSidebar
                        locale={locale}
                        variant="drawer"
                        displayName={displayName}
                        initials={initials}
                        candidatesCount={candidatesCount}
                        jobsCount={jobsCount}
                        complianceCount={complianceCount}
                        messagesCount={messagesCount}
                        permissions={permissions}
                        scope={scope}
                        employers={employers}
                        activeEmployerId={activeEmployerId}
                    />
                </SideDrawer>
            </div>
        </>
    );
}
