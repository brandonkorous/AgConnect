'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { Route } from 'next';
import { useTranslations } from 'next-intl';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBars } from '@fortawesome/free-solid-svg-icons';
import { Wordmark } from '@/components/primitives/Wordmark';
import { SideDrawer } from '@/components/shell/SideDrawer';
import { WorkerSidebar } from '@/components/worker/WorkerSidebar';

type Props = {
    locale: string;
};

export function WorkerMobileShell({ locale }: Props) {
    const t = useTranslations('shell.mobile');
    const [open, setOpen] = useState(false);

    return (
        <>
            <header className="bg-base-100 border-base-300 sticky top-0 z-30 flex h-14 items-center gap-3 border-b px-4 md:hidden">
                <button
                    type="button"
                    onClick={() => setOpen(true)}
                    aria-label={t('open_menu_aria')}
                    aria-expanded={open}
                    aria-controls="worker-drawer"
                    className="text-base-content/75 hover:text-base-content active:bg-base-200 -ml-2 grid h-11 w-11 place-items-center rounded-full"
                >
                    <FontAwesomeIcon icon={faBars} className="h-4 w-4" aria-hidden />
                </button>
                <Link
                    href={`/${locale}/worker/dashboard` as Route}
                    aria-label="AgConn home"
                    className="flex h-full items-center"
                >
                    <Wordmark size="sm" tone="ink" />
                </Link>
            </header>

            <div id="worker-drawer">
                <SideDrawer
                    open={open}
                    onClose={() => setOpen(false)}
                    ariaLabel={t('drawer_aria')}
                >
                    <WorkerSidebar locale={locale} variant="drawer" />
                </SideDrawer>
            </div>
        </>
    );
}
