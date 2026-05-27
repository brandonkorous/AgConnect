'use client';

import { Suspense, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import type { Route } from 'next';
import { EmployerSidebar } from '@/components/employer/EmployerSidebar';
import { EmployerTopBar } from '@/components/employer/EmployerTopBar';
import { EmployerMobileShell } from '@/components/employer/EmployerMobileShell';
import { VerificationBanner } from '@/components/employer/VerificationBanner';
import { ClerkReadyGate } from '@/components/providers/ClerkReadyGate';
import { useMe } from '@/lib/api/hooks/me';
import { useMyMembershipsSuspense } from '@/lib/api/hooks/members';
import {
  useEmployerProfileSuspense,
  useEmployerJobsSuspense,
  useEmployerInboxSuspense,
  verificationStatus,
} from '@/lib/api/hooks/employer';
import { homePathForRole, UserRole } from '@/lib/auth/role-client';
import { EmployerShellSkeleton } from './EmployerShellSkeleton';

type Props = {
  locale: string;
  children: React.ReactNode;
};

export function EmployerShellClient({ locale, children }: Props) {
  return (
    <ClerkReadyGate fallback={<EmployerShellSkeleton />}>
      <Suspense fallback={<EmployerShellSkeleton />}>
        <EmployerShellInner locale={locale}>{children}</EmployerShellInner>
      </Suspense>
    </ClerkReadyGate>
  );
}

function EmployerShellInner({ locale, children }: Props) {
  const router = useRouter();
  const me = useMe();
  const { data: memberships } = useMyMembershipsSuspense();
  const { data: profile } = useEmployerProfileSuspense();
  const { data: jobs } = useEmployerJobsSuspense();
  const { data: inbox } = useEmployerInboxSuspense();

  const role = me.data?.user.role;

  useEffect(() => {
    if (me.isPending || !me.data) return;
    if (memberships.memberships.length === 0 && role !== UserRole.employer) {
      router.replace(homePathForRole(locale, role!) as Route);
      return;
    }
    if (!profile) {
      router.replace(`/${locale}/employer/onboarding` as Route);
    }
  }, [me.isPending, me.data, memberships, profile, role, router, locale]);

  if (me.isPending || !me.data) return <EmployerShellSkeleton />;
  if (memberships.memberships.length === 0 && role !== UserRole.employer) {
    return <EmployerShellSkeleton />;
  }
  if (!profile) return <EmployerShellSkeleton />;

  const active =
    memberships.memberships.find((m) => m.employerId === memberships.activeEmployerId) ??
    memberships.memberships[0] ??
    null;
  const employers = memberships.memberships.map((m) => ({
    employerId: m.employerId,
    legalName: m.legalName,
  }));

  const status = verificationStatus(profile);
  const initials = profile.displayName
    .split(/\s+/)
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const inboxNew = inbox.filter((a) => a.status === 'applied').length;
  const jobsActive = jobs.filter((j) => j.status === 'active').length;

  return (
    <div className="flex min-h-screen items-start print:block print:min-h-0">
      <EmployerSidebar
        locale={locale}
        displayName={profile.displayName}
        initials={initials}
        candidatesCount={inboxNew}
        jobsCount={jobsActive}
        permissions={active?.permissions ?? []}
        scope={active?.scopeQualifier ?? null}
        employers={employers}
        activeEmployerId={active?.employerId ?? null}
      />
      <main className="min-w-0 flex-1 flex flex-col min-h-screen">
        <div className="print:hidden">
          <EmployerMobileShell
            locale={locale}
            displayName={profile.displayName}
            initials={initials}
            candidatesCount={inboxNew}
            jobsCount={jobsActive}
            permissions={active?.permissions ?? []}
            scope={active?.scopeQualifier ?? null}
            employers={employers}
            activeEmployerId={active?.employerId ?? null}
          />
          <EmployerTopBar locale={locale} />
          <VerificationBanner
            status={status}
            rejectionReason={profile.rejectionReason}
            locale={locale}
          />
        </div>
        {children}
      </main>
    </div>
  );
}
