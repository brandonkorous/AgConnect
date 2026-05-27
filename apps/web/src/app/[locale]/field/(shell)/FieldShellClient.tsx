'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import type { Route } from 'next';
import { FieldHeader } from '@/components/field/FieldHeader';
import { FieldBottomNav } from '@/components/field/FieldBottomNav';
import { SwitchToFullView } from '@/components/field/SwitchToFullView';
import { FieldOfflinePersistor } from '@/components/providers/FieldOfflinePersistor';
import { ClerkReadyGate } from '@/components/providers/ClerkReadyGate';
import { useMe } from '@/lib/api/hooks/me';
import { homePathForRole, UserRole } from '@/lib/auth/role-client';
import { FieldShellSkeleton } from './FieldShellSkeleton';

type Props = {
  locale: string;
  children: React.ReactNode;
};

export function FieldShellClient({ locale, children }: Props) {
  return (
    <ClerkReadyGate fallback={<FieldShellSkeleton />}>
      <FieldShellInner locale={locale}>{children}</FieldShellInner>
    </ClerkReadyGate>
  );
}

function FieldShellInner({ locale, children }: Props) {
  const router = useRouter();
  const me = useMe();

  useEffect(() => {
    if (me.isPending || !me.data) return;
    const { role, onboarded } = me.data.user;
    if (!onboarded) {
      router.replace(`/${locale}/field/onboarding` as Route);
      return;
    }
    if (role !== UserRole.worker) {
      router.replace(homePathForRole(locale, role) as Route);
    }
  }, [me.isPending, me.data, router, locale]);

  if (me.isPending) return <FieldShellSkeleton />;
  if (!me.data) return <FieldShellSkeleton />;
  if (!me.data.user.onboarded) return <FieldShellSkeleton />;
  if (me.data.user.role !== UserRole.worker) return <FieldShellSkeleton />;

  return (
    <div className="bg-base-200 min-h-screen">
      <FieldOfflinePersistor />
      <FieldHeader locale={locale} />
      <main className="mx-auto max-w-md px-4 pb-32 pt-4">
        {children}
        <SwitchToFullView locale={locale} />
      </main>
      <FieldBottomNav locale={locale} />
    </div>
  );
}
