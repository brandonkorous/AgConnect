import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const t = await getTranslations('admin');
  const tFallback = (k: string, en: string) => {
    const out = t(k, { default: '' });
    return out && out.length > 0 ? out : en;
  };

  const nav = [
    { href: '/admin/audit', label: tFallback('nav.audit', 'Audit log') },
    { href: '/admin/reports', label: tFallback('nav.reports', 'Reports') },
  ];

  return (
    <div className="bg-base-200 text-base-content min-h-screen">
      <header className="bg-base-100 border-base-300 border-b">
        <div className="container mx-auto flex flex-wrap items-center justify-between gap-4 px-5 py-4 md:px-8 lg:px-20">
          <h1 className="text-base-content font-serif text-xl font-medium">
            {tFallback('chrome.title', 'AgConn admin')}
          </h1>
          <nav className="flex gap-2 text-sm">
            {nav.map((n) => (
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
