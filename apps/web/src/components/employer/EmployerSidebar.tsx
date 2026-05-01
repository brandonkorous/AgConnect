'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faChartLine,
  faBriefcase,
  faUsers,
  faMagnifyingGlass,
  faCreditCard,
  faIdBadge,
  faChevronRight,
} from '@fortawesome/free-solid-svg-icons';
import type { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import { Wordmark } from '@/components/primitives/Wordmark';
import { SidebarLocaleToggle } from '@/components/worker/SidebarLocaleToggle';

export type EmployerNavKey = 'dashboard' | 'jobs' | 'inbox' | 'workers' | 'billing' | 'profile';

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
  inboxCount?: number;
  jobsCount?: number;
};

export function EmployerSidebar({
  locale,
  active,
  displayName,
  initials,
  inboxCount,
  jobsCount,
}: Props) {
  const t = useTranslations('employer.shell.nav');
  const pathname = usePathname();

  const items: NavItem[] = [
    { key: 'dashboard', icon: faChartLine, path: '/employer/dashboard' },
    { key: 'jobs', icon: faBriefcase, path: '/employer/jobs', count: jobsCount },
    {
      key: 'inbox',
      icon: faUsers,
      path: '/employer/inbox',
      count: inboxCount,
      accent: (inboxCount ?? 0) > 0,
    },
    { key: 'workers', icon: faMagnifyingGlass, path: '/employer/workers' },
    { key: 'billing', icon: faCreditCard, path: '/employer/billing' },
    { key: 'profile', icon: faIdBadge, path: '/employer/profile' },
  ];

  const derived = items.find((it) => pathname.startsWith(`/${locale}${it.path}`))?.key;
  const current = active ?? derived ?? 'dashboard';

  return (
    <aside className="bg-base-100 border-base-300 sticky top-0 flex min-h-screen w-[248px] shrink-0 flex-col gap-1 border-r p-4 pb-6">
      <div className="flex items-center justify-between px-2 pb-2 pt-1">
        <Link href={`/${locale}`} aria-label="AgConn home">
          <Wordmark size="sm" tone="ink" />
        </Link>
        <span className="bg-base-content text-base-100 rounded px-1.5 py-0.5 font-mono text-[10px] font-bold tracking-wider">
          HIRE
        </span>
      </div>

      <div className="px-2 pb-3 pt-1">
        <div className="bg-base-200 border-base-300 flex items-center gap-2 rounded-lg border px-2.5 py-1.5">
          <div className="bg-primary text-primary-content grid h-5 w-5 place-items-center rounded text-[9px] font-bold">
            {initials}
          </div>
          <div className="min-w-0 flex-1 text-xs font-semibold">{displayName}</div>
          <FontAwesomeIcon
            icon={faChevronRight}
            className="text-base-content/40 h-2.5 w-2.5"
          />
        </div>
      </div>

      <div className="px-2">
        <SidebarLocaleToggle />
      </div>

      <nav className="mt-2 flex flex-col gap-1">
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
    </aside>
  );
}
