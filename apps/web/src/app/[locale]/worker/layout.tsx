import { WorkerSidebar } from '@/components/worker/WorkerSidebar';
import { WorkerTopBar } from '@/components/worker/WorkerTopBar';

type Props = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

// Shared shell for every authenticated worker surface (dashboard, jobs,
// applications, training, wallet, profile). Marketing pages (/onboarding,
// /verify, anonymous /training browse) live outside this segment and provide
// their own chrome. The sidebar derives its active item from `usePathname`.
export default async function WorkerLayout({ children, params }: Props) {
  const { locale } = await params;
  return (
    <div className="bg-base-100 flex min-h-screen items-start">
      <WorkerSidebar locale={locale} />
      <main className="min-w-0 flex-1">
        <WorkerTopBar />
        {children}
      </main>
    </div>
  );
}
