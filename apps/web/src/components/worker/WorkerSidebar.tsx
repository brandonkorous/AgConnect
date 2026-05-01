'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useUser, useClerk } from '@clerk/nextjs';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faChartLine,
    faLeaf,
    faClipboardCheck,
    faCalendarDays,
    faSackDollar,
    faGraduationCap,
    faIdBadge,
    faComments,
    faChevronRight,
    faRightFromBracket,
} from '@fortawesome/free-solid-svg-icons';
import type { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import { Wordmark } from '@/components/primitives/Wordmark';
import { SidebarLocaleToggle } from './SidebarLocaleToggle';

export type WorkerNavKey =
    | 'dashboard'
    | 'browse_jobs'
    | 'my_applications'
    | 'my_shifts'
    | 'pay'
    | 'training'
    | 'documents'
    | 'messages';

type NavItem = {
    key: WorkerNavKey;
    icon: IconDefinition;
    /** Path under /[locale] — used for both href and active-match. */
    path: string;
    count?: number;
    accent?: boolean;
};

const ITEMS: NavItem[] = [
    { key: 'dashboard',       icon: faChartLine,       path: '/worker/dashboard' },
    { key: 'browse_jobs',     icon: faLeaf,            path: '/worker/jobs', count: 142 },
    { key: 'my_applications', icon: faClipboardCheck,  path: '/worker/applications', count: 5 },
    { key: 'my_shifts',       icon: faCalendarDays,    path: '/worker/shifts' },
    { key: 'pay',             icon: faSackDollar,      path: '/worker/pay' },
    { key: 'training',        icon: faGraduationCap,   path: '/worker/training' },
    { key: 'documents',       icon: faIdBadge,         path: '/worker/documents' },
    { key: 'messages',        icon: faComments,        path: '/worker/messages', count: 3, accent: true },
];

type Props = {
    /** Override the path-derived active item — kept for legacy callers. */
    active?: WorkerNavKey;
    locale: string;
};

export function WorkerSidebar({ active, locale }: Props) {
    const t = useTranslations('worker.dashboard.sidebar');
    const pathname = usePathname();
    const { user } = useUser();
    const { signOut } = useClerk();
    const derived = ITEMS.find((it) => pathname.startsWith(`/${locale}${it.path}`))?.key;
    const current = active ?? derived ?? 'dashboard';

    const firstName = user?.firstName ?? '';
    const lastName = user?.lastName ?? '';
    const fullName = [firstName, lastName].filter(Boolean).join(' ') || (user?.primaryPhoneNumber?.phoneNumber ?? user?.primaryEmailAddress?.emailAddress ?? '');
    const initials =
        firstName || lastName
            ? `${firstName[0] ?? ''}${lastName[0] ?? ''}`.toUpperCase() || '·'
            : (user?.primaryEmailAddress?.emailAddress?.[0] ?? user?.primaryPhoneNumber?.phoneNumber?.[1] ?? '·').toUpperCase();

    return (
        <aside className="bg-base-100 border-base-300 sticky top-0 flex min-h-screen w-[248px] shrink-0 flex-col gap-1 border-r p-4 pb-6">
            <div className="flex items-center justify-between px-2 pb-4 pt-1">
                <Link href={`/${locale}`} aria-label="AgConn home">
                    <Wordmark size="sm" tone="ink" />
                </Link>
                <SidebarLocaleToggle />
            </div>

            <nav className="flex flex-col gap-1">
                {ITEMS.map((item) => {
                    const isActive = item.key === current;
                    return (
                        <Link
                            key={item.key}
                            href={`/${locale}${item.path}`}
                            className={[
                                'flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm transition-colors',
                                isActive
                                    ? 'bg-primary/10 text-primary font-semibold'
                                    : 'text-base-content/70 hover:bg-base-200 font-medium',
                            ].join(' ')}
                        >
                            <FontAwesomeIcon icon={item.icon} className="h-4 w-4" />
                            <span className="flex-1">{t(item.key)}</span>
                            {item.count !== undefined && (
                                <span
                                    className={[
                                        'rounded-full px-1.5 py-0.5 font-mono text-[10px] font-bold',
                                        item.accent
                                            ? 'bg-accent text-accent-content'
                                            : isActive
                                              ? 'bg-base-100 text-primary'
                                              : 'bg-base-200 text-base-content/60',
                                    ].join(' ')}
                                >
                                    {item.count}
                                </span>
                            )}
                        </Link>
                    );
                })}
            </nav>

            <div className="mt-auto pt-6">
                <Link
                    href={`/${locale}/worker/profile`}
                    className="bg-base-200 border-base-300 hover:bg-base-300 flex items-center gap-2.5 rounded-2xl border p-3 no-underline transition-colors"
                >
                    <div className="bg-primary text-primary-content grid h-9 w-9 shrink-0 place-items-center rounded-full text-xs font-bold">
                        {initials}
                    </div>
                    <div className="min-w-0 flex-1">
                        <div className="text-base-content truncate text-sm font-semibold">
                            {fullName || t('profile_default_name')}
                        </div>
                        <div className="text-base-content/60 truncate text-xs">
                            {t('profile_default_location')}
                        </div>
                    </div>
                    <FontAwesomeIcon
                        icon={faChevronRight}
                        className="text-base-content/40 h-3 w-3"
                    />
                </Link>
                <button
                    type="button"
                    onClick={() => signOut({ redirectUrl: `/${locale}` })}
                    className="text-base-content/60 hover:text-base-content mt-2 flex w-full items-center justify-center gap-1.5 px-2.5 py-1.5 text-[11px] font-mono font-bold uppercase tracking-wider transition-colors"
                >
                    <FontAwesomeIcon icon={faRightFromBracket} className="h-3 w-3" />
                    {t('sign_out')}
                </button>
            </div>
        </aside>
    );
}
