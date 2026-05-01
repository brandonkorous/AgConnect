import Link from 'next/link';
import { useTranslations } from 'next-intl';
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
} from '@fortawesome/free-solid-svg-icons';
import type { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import { Wordmark } from '@/components/primitives/Wordmark';
import { SidebarLocaleToggle } from './SidebarLocaleToggle';

type NavKey =
    | 'dashboard'
    | 'browse_jobs'
    | 'my_applications'
    | 'my_shifts'
    | 'pay'
    | 'training'
    | 'documents'
    | 'messages';

type NavItem = {
    key: NavKey;
    icon: IconDefinition;
    href: string;
    count?: number;
    accent?: boolean;
};

const ITEMS: NavItem[] = [
    { key: 'dashboard', icon: faChartLine, href: '#' },
    { key: 'browse_jobs', icon: faLeaf, href: '#', count: 142 },
    { key: 'my_applications', icon: faClipboardCheck, href: '#', count: 5 },
    { key: 'my_shifts', icon: faCalendarDays, href: '#' },
    { key: 'pay', icon: faSackDollar, href: '#' },
    { key: 'training', icon: faGraduationCap, href: '#' },
    { key: 'documents', icon: faIdBadge, href: '#' },
    { key: 'messages', icon: faComments, href: '#', count: 3, accent: true },
];

type Props = { active?: NavKey; locale: string };

export function WorkerSidebar({ active = 'dashboard', locale }: Props) {
    const t = useTranslations('worker.dashboard.sidebar');

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
                    const isActive = item.key === active;
                    return (
                        <a
                            key={item.key}
                            href={item.href}
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
                        </a>
                    );
                })}
            </nav>

            <div className="mt-auto pt-6">
                <div className="bg-base-200 border-base-300 flex items-center gap-2.5 rounded-2xl border p-3">
                    <div className="bg-primary text-primary-content grid h-9 w-9 place-items-center rounded-full text-xs font-bold">
                        MR
                    </div>
                    <div className="min-w-0 flex-1">
                        <div className="text-sm font-semibold">Miguel Reyes</div>
                        <div className="text-base-content/60 text-xs">
                            {t('profile_default_location')}
                        </div>
                    </div>
                    <FontAwesomeIcon
                        icon={faChevronRight}
                        className="text-base-content/40 h-3 w-3"
                    />
                </div>
            </div>
        </aside>
    );
}
