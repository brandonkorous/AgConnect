import { currentUser } from '@clerk/nextjs/server';
import { requireRole, UserRole } from '@/lib/auth/role';
import { TrainingOrgSidebar } from '@/components/training-org/TrainingOrgSidebar';

type Props = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

export default async function TrainingOrgShellLayout({ children, params }: Props) {
  const { locale } = await params;
  await requireRole(locale, UserRole.training_org);
  const user = await currentUser();
  const displayName =
    [user?.firstName, user?.lastName].filter(Boolean).join(' ') ||
    user?.primaryEmailAddress?.emailAddress ||
    (locale === 'es' ? 'Organización' : 'Organization');

  return (
    <div className="flex min-h-screen items-start">
      <TrainingOrgSidebar locale={locale} displayName={displayName} />
      <main className="min-w-0 flex-1">{children}</main>
    </div>
  );
}
