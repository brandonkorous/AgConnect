import { redirect } from 'next/navigation';
import { EmployerSidebar } from '@/components/employer/EmployerSidebar';
import { EmployerTopBar } from '@/components/employer/EmployerTopBar';
import { VerificationBanner } from '@/components/employer/VerificationBanner';
import { getEmployerProfile, verificationStatus, listInbox } from '@/lib/api/employer';

type Props = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

export default async function EmployerLayout({ children, params }: Props) {
  const { locale } = await params;
  const profile = await getEmployerProfile();

  // Not onboarded yet — push to onboarding. Onboarding renders its own minimal
  // chrome; employers without a profile shouldn't see the shell.
  if (!profile) {
    redirect(`/${locale}/employer/onboarding`);
  }

  const status = verificationStatus(profile);
  const initials = profile.displayName
    .split(/\s+/)
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="bg-base-100 flex min-h-screen items-start">
      <EmployerSidebar
        locale={locale}
        displayName={profile.displayName}
        initials={initials}
        inboxCount={6}
        jobsCount={3}
      />
      <main className="min-w-0 flex-1">
        <EmployerTopBar locale={locale} canPublish={status === 'verified'} />
        <VerificationBanner
          status={status}
          rejectionReason={profile.rejectionReason}
          locale={locale}
        />
        {children}
      </main>
    </div>
  );
}
