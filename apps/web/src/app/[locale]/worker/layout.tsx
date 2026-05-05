import { WorkerSidebar } from '@/components/worker/WorkerSidebar';
import { WorkerTopBar } from '@/components/worker/WorkerTopBar';
import { WorkerMobileShell } from '@/components/worker/WorkerMobileShell';
import { FieldModeSoftPrompt } from '@/components/field/FieldModeSoftPrompt';

type Props = {
    children: React.ReactNode;
    params: Promise<{ locale: string }>;
};

export default async function WorkerLayout({ children, params }: Props) {
    const { locale } = await params;
    return (
        <div className="flex min-h-screen items-start">
            <WorkerSidebar locale={locale} />
            <main className="min-w-0 flex-1">
                <FieldModeSoftPrompt locale={locale} />
                <WorkerMobileShell locale={locale} />
                <WorkerTopBar />
                {children}
            </main>
        </div>
    );
}
