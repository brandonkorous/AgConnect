'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useUser } from '@clerk/nextjs';
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
} from '@fortawesome/free-solid-svg-icons';
import type { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import { Wordmark } from '@/components/primitives/Wordmark';
import { UserMenu, computeInitials } from '@/components/shell/UserMenu';

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
    /** 'inline' renders the desktop aside (md+); 'drawer' renders the body for the mobile drawer. */
    variant?: 'inline' | 'drawer';
};

export function WorkerSidebar({ active, locale, variant = 'inline' }: Props) {
    const t = useTranslations('worker.dashboard.sidebar');
    const pathname = usePathname();
    const { user } = useUser();
    const derived = ITEMS.find((it) => pathname.startsWith(`/${locale}${it.path}`))?.key;
    const current = active ?? derived ?? 'dashboard';

    const firstName = user?.firstName ?? '';
    const lastName = user?.lastName ?? '';
    const email = user?.primaryEmailAddress?.emailAddress ?? null;
    const phone = user?.primaryPhoneNumber?.phoneNumber ?? null;
    const fullName =
        [firstName, lastName].filter(Boolean).join(' ') ||
        email ||
        phone ||
        t('profile_default_name');
    const userInitials = computeInitials(firstName, lastName, email, phone);

    const wrapperClass =
        variant === 'inline'
            ? 'bg-base-100 border-base-300 sticky top-0 hidden min-h-screen w-[248px] shrink-0 flex-col gap-1 border-r p-4 pb-6 md:flex'
            : 'flex h-full w-full flex-col gap-1 p-4 pb-6';

    return (
        <aside className={wrapperClass}>
            <div className="flex items-center px-2 pb-4 pt-1">
                <Link href={`/${locale}`} aria-label="AgConn home">
                    <Wordmark size="sm" tone="ink" />
                </Link>
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
                <UserMenu
                    locale={locale}
                    profileHref={`/${locale}/worker/profile`}
                    fieldModeHref={`/${locale}/field`}
                    name={fullName}
                    subtext={t('profile_default_location')}
                    initials={userInitials}
                    labels={{
                        profile: t('menu_profile'),
                        fieldMode: t('menu_field_mode'),
                        fieldModeHint: t('menu_field_mode_hint'),
                        signOut: t('sign_out'),
                        language: t('menu_language'),
                        languageEn: t('lang_en'),
                        languageEs: t('lang_es'),
                    }}
                />
            </div>
        </aside>
    );
}
