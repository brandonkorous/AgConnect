import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const t = await getTranslations('admin.audit');
  return (
    <div className="bg-base-200 text-base-content min-h-screen">
      <header className="bg-base-100 border-base-300 border-b">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <h1 className="text-base-content font-serif text-xl font-medium">{t('page.title')}</h1>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-6 py-6">{children}</main>
    </div>
  );
}
