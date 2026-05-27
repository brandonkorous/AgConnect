'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import type { Route } from 'next';
import { WorkerSidebar } from '@/components/worker/WorkerSidebar';
import { WorkerTopBar } from '@/components/worker/WorkerTopBar';
import { WorkerMobileShell } from '@/components/worker/WorkerMobileShell';
import { FieldModeSoftPrompt } from '@/components/field/FieldModeSoftPrompt';
import { useMe } from '@/lib/api/hooks/me';
import { useWorkerNavCounts } from '@/lib/api/hooks/nav-counts';
import { homePathForRole, UserRole } from '@/lib/auth/role-client';
import { ShellSkeleton } from './ShellSkeleton';

// Client-side shell for /worker. Replaces the previous async server layout
// that awaited requireRole() + fetchWorkerNavCounts(). Now:
// - Proxy (proxy.ts) handles unauth → /sign-in
// - useMe() drives role + onboarded gate; redirects via useRouter
// - useWorkerNavCounts() feeds the sidebar; sidebar shows zero counts
//   until the query resolves (no Suspense gate at shell level — page
//   children render in parallel with counts loading)

type Props = {
  locale: string;
  children: React.ReactNode;
};

export function WorkerShellClient({ locale, children }: Props) {
  const router = useRouter();
  const me = useMe();
  const navCounts = useWorkerNavCounts();

  useEffect(() => {
    if (me.isPending || !me.data) return;
    const { role, onboarded } = me.data.user;
    if (!onboarded) {
      router.replace(`/${locale}/worker/onboarding` as Route);
      return;
    }
    if (role !== UserRole.worker) {
      router.replace(homePathForRole(locale, role) as Route);
    }
  }, [me.isPending, me.data, router, locale]);

  if (me.isPending) return <ShellSkeleton />;
  if (!me.data) return <ShellSkeleton />;
  if (!me.data.user.onboarded) return <ShellSkeleton />;
  if (me.data.user.role !== UserRole.worker) return <ShellSkeleton />;

  return (
    <div className="flex min-h-screen items-start">
      <div className="print:hidden">
        <WorkerSidebar locale={locale} counts={navCounts.data} />
      </div>
      <main className="min-w-0 flex-1 flex flex-col min-h-screen">
        <div className="print:hidden">
          <FieldModeSoftPrompt locale={locale} />
          <WorkerMobileShell locale={locale} counts={navCounts.data} />
          <WorkerTopBar />
        </div>
        {children}
      </main>
    </div>
  );
}
