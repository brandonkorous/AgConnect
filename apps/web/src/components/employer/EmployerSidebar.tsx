'use client';

import Link from 'next/link';
import type { Route } from 'next';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useUser } from '@clerk/nextjs';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faChartLine,
    faBriefcase,
    faUsers,
    faMagnifyingGlass,
    faCreditCard,
    faIdBadge,
    faCalendarDays,
    faCoins,
    faShieldHalved,
    faCommentDots,
    faChartColumn,
} from '@fortawesome/free-solid-svg-icons';
import type { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import { Wordmark } from '@/components/primitives/Wordmark';
import { UserMenu } from '@/components/shell/UserMenu';

export type EmployerNavKey =
    | 'dashboard'
    | 'jobs'
    | 'candidates'
    | 'workers'
    | 'crews'
    | 'payroll'
    | 'compliance'
    | 'messages'
    | 'reports'
    | 'billing'
    | 'profile';

type NavItem = {
    key: EmployerNavKey;
    icon: IconDefinition;
    path: string;
    count?: number;
    countTitle?: string;
    accent?: boolean;
    pro?: boolean;
};

type Props = {
    locale: string;
    active?: EmployerNavKey;
    displayName: string;
    initials: string;
    candidatesCount?: number;
    jobsCount?: number;
    complianceCount?: number;
    messagesCount?: number;
    /** 'inline' renders the desktop aside (md+); 'drawer' renders the body for the mobile drawer. */
    variant?: 'inline' | 'drawer';
};

export function EmployerSidebar({
    locale,
    active,
    displayName,
    initials,
    candidatesCount,
    jobsCount,
    complianceCount,
    messagesCount,
    variant = 'inline',
}: Props) {
    const t = useTranslations('employer.shell.nav');
    const tBadge = useTranslations('employer.shell.badges');
    const tMenu = useTranslations('employer.shell.user_menu');
    const pathname = usePathname();
    const { user } = useUser();
    const userFirstName = user?.firstName ?? '';
    const userLastName = user?.lastName ?? '';
    const userFullName =
        [userFirstName, userLastName].filter(Boolean).join(' ') ||
        user?.primaryEmailAddress?.emailAddress ||
        user?.primaryPhoneNumber?.phoneNumber ||
        null;

    const items: NavItem[] = [
        { key: 'dashboard', icon: faChartLine, path: '/employer/dashboard' },
        {
            key: 'jobs',
            icon: faBriefcase,
            path: '/employer/jobs',
            count: jobsCount,
            countTitle: tBadge('active_postings_title'),
        },
        {
            key: 'candidates',
            icon: faUsers,
            path: '/employer/inbox',
            count: candidatesCount,
            accent: (candidatesCount ?? 0) > 0,
        },
        { key: 'workers', icon: faMagnifyingGlass, path: '/employer/workers', pro: true },
        { key: 'crews', icon: faCalendarDays, path: '/employer/crews' },
        { key: 'payroll', icon: faCoins, path: '/employer/payroll' },
        { key: 'compliance', icon: faShieldHalved, path: '/employer/compliance', count: complianceCount },
        { key: 'messages', icon: faCommentDots, path: '/employer/messages', count: messagesCount, accent: (messagesCount ?? 0) > 0 },
        { key: 'reports', icon: faChartColumn, path: '/employer/reports' },
        { key: 'billing', icon: faCreditCard, path: '/employer/billing' },
        { key: 'profile', icon: faIdBadge, path: '/employer/profile' },
    ];

    const wrapperClass =
        variant === 'inline'
            ? 'bg-base-200 border-base-300 sticky top-0 hidden h-screen w-[248px] shrink-0 flex-col gap-1 border-r p-4 pb-6 print:hidden md:flex'
            : 'bg-base-200 flex h-full w-full flex-col gap-1 p-4 pb-6';

    return (
        <aside className={wrapperClass}>
            <div className="flex items-center justify-between px-2 pb-4 pt-1">
                <Link href={`/${locale}`} aria-label="AGCONN home">
                    <Wordmark size="sm" tone="ink" />
                </Link>
                <span className="badge badge-neutral badge-sm font-mono tracking-wider">
                    {tBadge('surface_hire')}
                </span>
            </div>

            <ul className="menu menu-md w-full flex-1 flex-nowrap overflow-y-auto p-0 gap-2">
                {items.map((item) => {
                    const href = `/${locale}${item.path}`;
                    const isActive = pathname.startsWith(href) ||
                        (item.key === active);
                    return (
                        <li key={item.key}>
                            <Link
                                href={href as Route}
                                className={isActive ? 'menu-active' : ''}
                            >
                                <FontAwesomeIcon icon={item.icon} className="w-4" />
                                <span className="flex-1">{t(item.key)}</span>
                                {item.pro && (
                                    <span className="badge badge-warning badge-sm">
                                        {tBadge('pro')}
                                    </span>
                                )}
                                {item.count !== undefined && item.count > 0 && (
                                    <span
                                        className={[
                                            'badge badge-sm',
                                            item.accent ? 'badge-accent' : 'badge-neutral',
                                        ].join(' ')}
                                        title={item.countTitle}
                                    >
                                        {item.count}
                                    </span>
                                )}
                            </Link>
                        </li>
                    );
                })}
            </ul>

            <div className="pt-6">
                <UserMenu
                    locale={locale}
                    profileHref={`/${locale}/employer/profile`}
                    accountHref={`/${locale}/employer/account`}
                    helpHref={`/${locale}/employer/help`}
                    name={displayName}
                    subtext={userFullName ?? undefined}
                    initials={initials}
                    labels={{
                        profile: tMenu('profile'),
                        account: tMenu('account'),
                        help: tMenu('help'),
                        signOut: tMenu('sign_out'),
                        language: tMenu('language'),
                        languageEn: tMenu('language_en'),
                        languageEs: tMenu('language_es'),
                    }}
                />
            </div>
        </aside>
    );
}
