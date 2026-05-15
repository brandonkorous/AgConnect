'use client';

import Link from 'next/link';
import type { Route } from 'next';
import { usePathname } from 'next/navigation';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChalkboardUser, faGraduationCap } from '@fortawesome/free-solid-svg-icons';
import { Wordmark } from '@/components/primitives/Wordmark';

type Props = {
  locale: string;
  displayName: string;
};

export function TrainingOrgSidebar({ locale, displayName }: Props) {
  const pathname = usePathname();
  const isEs = locale === 'es';

  const items = [
    {
      key: 'programs',
      label: isEs ? 'Programas' : 'Programs',
      path: '/training-org/programs',
      icon: faGraduationCap,
    },
  ];

  return (
    <aside className="bg-base-200 border-base-300 sticky top-0 hidden h-screen w-[248px] shrink-0 flex-col gap-1 border-r p-4 pb-6 print:hidden md:flex">
      <div className="flex items-center justify-between px-2 pb-4 pt-1">
        <Link href={`/${locale}`} aria-label="AGCONN home">
          <Wordmark size="sm" tone="ink" />
        </Link>
        <span className="badge badge-neutral badge-sm font-mono tracking-wider">
          {isEs ? 'CAPACITAR' : 'TRAIN'}
        </span>
      </div>

      <ul className="menu menu-md w-full flex-1 flex-nowrap overflow-y-auto p-0 gap-2">
        {items.map((item) => {
          const href = `/${locale}${item.path}`;
          const isActive = pathname.startsWith(href);
          return (
            <li key={item.key}>
              <Link href={href as Route} className={isActive ? 'menu-active' : ''}>
                <FontAwesomeIcon icon={item.icon} className="w-4" />
                <span className="flex-1">{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>

      <div className="border-base-300 mt-auto border-t pt-4">
        <div className="flex items-center gap-3 px-2">
          <div className="bg-primary text-primary-content grid h-9 w-9 place-items-center rounded-full text-xs font-semibold">
            <FontAwesomeIcon icon={faChalkboardUser} className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">{displayName}</p>
            <p className="text-base-content/60 truncate text-xs">
              {isEs ? 'Org. de capacitación' : 'Training org'}
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}
