import type { Metadata } from 'next';
import { Link } from '@/i18n/navigation';

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

// Admin chrome is English-only by design — see docs/30-admin/02-placement-report/04-ui.md.
// Strings are inline rather than seeded so the admin app stays decoupled from
// the worker/employer translation pipeline.
const NAV = [
  { href: '/admin/audit', label: 'Audit log' },
  { href: '/admin/reports', label: 'Reports' },
] as const;

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-base-200 text-base-content min-h-screen">
      <header className="bg-base-100 border-base-300 border-b">
        <div className="container mx-auto flex flex-wrap items-center justify-between gap-4 px-5 py-4 md:px-8 lg:px-20">
          <h1 className="text-base-content font-serif text-xl font-medium">AgConn admin</h1>
          <nav className="flex gap-2 text-sm">
            {NAV.map((n) => (
              <Link
                key={n.href}
                href={n.href}
                className="hover:text-primary text-base-content/70 px-2 py-1"
              >
                {n.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>
      <main className="container mx-auto px-5 py-6 md:px-8 lg:px-20">{children}</main>
    </div>
  );
}
