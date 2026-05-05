'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { Route } from 'next';
import { useTranslations } from 'next-intl';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faSun,
    faPaperPlane,
    faClipboardCheck,
    faComments,
} from '@fortawesome/free-solid-svg-icons';
import type { IconDefinition } from '@fortawesome/fontawesome-svg-core';

type TabKey = 'today' | 'apply' | 'applications' | 'messages';

type Tab = {
    key: TabKey;
    icon: IconDefinition;
    /** Path under /[locale]/field — used for href and active match. */
    path: string;
};

const TABS: Tab[] = [
    { key: 'today', icon: faSun, path: '' },
    { key: 'apply', icon: faPaperPlane, path: '/apply' },
    { key: 'applications', icon: faClipboardCheck, path: '/applications' },
    { key: 'messages', icon: faComments, path: '/messages' },
];

type Props = {
    locale: string;
};

export function FieldBottomNav({ locale }: Props) {
    const t = useTranslations('worker.field.bottom_nav');
    const pathname = usePathname();
    const base = `/${locale}/field`;

    return (
        <nav
            aria-label={t('aria')}
            className="bg-base-100 border-base-300 fixed inset-x-0 bottom-0 z-30 border-t pb-[env(safe-area-inset-bottom)]"
        >
            <ul className="mx-auto flex max-w-md">
                {TABS.map((tab) => {
                    const href = `${base}${tab.path}`;
                    const isActive =
                        tab.path === ''
                            ? pathname === href || pathname === `${href}/`
                            : pathname === href || pathname.startsWith(`${href}/`);
                    return (
                        <li key={tab.key} className="flex-1">
                            <Link
                                href={href as Route}
                                aria-current={isActive ? 'page' : undefined}
                                className={[
                                    'flex h-[68px] flex-col items-center justify-center gap-1 px-2 transition-colors',
                                    isActive
                                        ? 'text-primary font-semibold'
                                        : 'text-base-content/65 hover:text-base-content active:bg-base-200',
                                ].join(' ')}
                            >
                                <FontAwesomeIcon icon={tab.icon} className="h-5 w-5" />
                                <span className="text-[11px] leading-none">{t(tab.key)}</span>
                            </Link>
                        </li>
                    );
                })}
            </ul>
        </nav>
    );
}
