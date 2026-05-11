'use client';

import { useRouter, usePathname } from 'next/navigation';
import { useMemo } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBuilding, faChevronDown } from '@fortawesome/free-solid-svg-icons';

export type TenantOption = {
  id: string;
  name: string;
};

type Props = {
  tenants: TenantOption[];
  activeTenantId: string | null;
};

// The tenant scope lives in the URL ( /t/<id>/... ). Switching tenants rewrites
// the current path: if we're at /t/<old>/jobs, we go to /t/<new>/jobs.
// Switching to "Platform" strips the /t/<id> prefix.
export function TenantSwitcher({ tenants, activeTenantId }: Props) {
  const router = useRouter();
  const pathname = usePathname();

  const subPath = useMemo(() => {
    const match = pathname.match(/^\/t\/[^/]+(\/.*)?$/);
    return match?.[1] ?? '/';
  }, [pathname]);

  const onChange = (next: string) => {
    const target = next === 'platform' ? subPath : `/t/${next}${subPath === '/' ? '' : subPath}`;
    router.push(target);
  };

  const activeLabel =
    activeTenantId === null
      ? 'Platform'
      : (tenants.find((t) => t.id === activeTenantId)?.name ?? activeTenantId);

  return (
    <div className="dropdown dropdown-end">
      <button
        type="button"
        tabIndex={0}
        className="btn btn-sm btn-ghost border-base-300 hover:bg-base-200 gap-2 rounded-full border px-3"
      >
        <FontAwesomeIcon icon={faBuilding} className="h-3.5 w-3.5 opacity-70" />
        <span className="max-w-[16ch] truncate text-left text-sm">{activeLabel}</span>
        <FontAwesomeIcon icon={faChevronDown} className="h-3 w-3 opacity-60" />
      </button>
      <ul
        tabIndex={0}
        className="menu dropdown-content bg-base-100 rounded-box border-base-300 z-10 mt-2 w-64 border p-1 shadow-[var(--shadow-pop)]"
      >
        <li>
          <button
            type="button"
            className={activeTenantId === null ? 'menu-active' : ''}
            onClick={() => onChange('platform')}
          >
            <span className="font-medium">Platform</span>
            <span className="text-base-content/50 ml-auto text-[11px] uppercase tracking-wide">
              global
            </span>
          </button>
        </li>
        {tenants.length > 0 && <li className="menu-title text-[11px] uppercase">Tenants</li>}
        {tenants.map((t) => (
          <li key={t.id}>
            <button
              type="button"
              className={activeTenantId === t.id ? 'menu-active' : ''}
              onClick={() => onChange(t.id)}
            >
              <span className="truncate">{t.name}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
