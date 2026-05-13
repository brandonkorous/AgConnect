'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { NAV_ITEMS } from './nav-items';

type SidebarProps = {
    scope: 'platform' | 'tenant';
    tenantId: string | null;
};

function buildHref(scope: 'platform' | 'tenant', tenantId: string | null, href: string): string {
    if (scope === 'tenant' && tenantId) {
        return href === '/' ? `/t/${tenantId}` : `/t/${tenantId}${href}`;
    }
    return href;
}

function isActive(currentPath: string, targetHref: string): boolean {
    if (targetHref.endsWith('/') && targetHref !== '/') {
        return currentPath.startsWith(targetHref);
    }
    if (targetHref === '/' || targetHref.match(/^\/t\/[^/]+$/)) {
        return currentPath === targetHref;
    }
    return currentPath === targetHref || currentPath.startsWith(`${targetHref}/`);
}

export function Sidebar({ scope, tenantId }: SidebarProps) {
    const pathname = usePathname();
    const items = NAV_ITEMS.filter((item) => item.scope === 'both' || item.scope === scope);

    return (
        <aside className="bg-base-100 border-base-300 sticky top-0 hidden h-screen w-64 flex-shrink-0 border-r md:flex md:flex-col">
            <div className="border-base-300 flex items-center gap-2 border-b px-5 py-4">
                <div className="bg-primary text-primary-content flex h-7 w-7 items-center justify-center rounded font-serif text-sm font-semibold">
                    A
                </div>
                <div className="leading-tight">
                    <div className="font-serif text-sm font-medium">AgConn</div>
                    <div className="text-base-content/60 text-xs tracking-wide uppercase">Admin</div>
                </div>
            </div>
            <nav className="flex-1 overflow-y-auto px-3 py-4">
                <ul className="menu menu-sm gap-0.5">
                    {items.map((item) => {
                        const href = buildHref(scope, tenantId, item.href);
                        const active = isActive(pathname, href);
                        return (
                            <li key={item.href}>
                                <Link href={href} className={active ? 'menu-active' : ''}>
                                    <FontAwesomeIcon icon={item.icon} className="h-4 w-4 opacity-70" />
                                    <span>{item.label}</span>
                                </Link>
                            </li>
                        );
                    })}
                </ul>
            </nav>
            <div className="border-base-300 text-base-content/50 border-t px-5 py-3 text-xs">
                Scope:{' '}
                <span className="text-base-content/80 font-medium">
                    {scope === 'tenant' ? 'Tenant' : 'Platform'}
                </span>
            </div>
        </aside>
    );
}
