'use client';

import Link from 'next/link';
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
    accent?: boolean;
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
}: Props) {
    const t = useTranslations('employer.shell.nav');
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
        { key: 'jobs', icon: faBriefcase, path: '/employer/jobs', count: jobsCount },
        {
            key: 'candidates',
            icon: faUsers,
            path: '/employer/inbox',
            count: candidatesCount,
            accent: (candidatesCount ?? 0) > 0,
        },
        { key: 'workers', icon: faMagnifyingGlass, path: '/employer/workers' },
        { key: 'crews', icon: faCalendarDays, path: '/employer/crews' },
        { key: 'payroll', icon: faCoins, path: '/employer/payroll' },
        { key: 'compliance', icon: faShieldHalved, path: '/employer/compliance', count: complianceCount },
        { key: 'messages', icon: faCommentDots, path: '/employer/messages', count: messagesCount, accent: (messagesCount ?? 0) > 0 },
        { key: 'reports', icon: faChartColumn, path: '/employer/reports' },
        { key: 'billing', icon: faCreditCard, path: '/employer/billing' },
        { key: 'profile', icon: faIdBadge, path: '/employer/profile' },
    ];

    const derived = items.find((it) => pathname.startsWith(`/${locale}${it.path}`))?.key;
    const current = active ?? derived ?? 'dashboard';

    return (
        <aside className="bg-base-200 border-base-300 sticky top-0 flex min-h-screen w-[248px] shrink-0 flex-col gap-1 border-r p-4 pb-6">
            <div className="flex items-center justify-between px-2 pb-4 pt-1">
                <Link href={`/${locale}`} aria-label="AgConn home">
                    <Wordmark size="sm" tone="ink" />
                </Link>
                <span className="bg-base-content text-base-100 rounded px-1.5 py-0.5 font-mono text-[10px] font-bold tracking-wider">
                    HIRE
                </span>
            </div>

            <nav className="flex flex-col gap-1">
                {items.map((item) => {
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
                            {item.count !== undefined && item.count > 0 && (
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
