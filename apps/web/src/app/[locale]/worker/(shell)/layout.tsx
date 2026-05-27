import { WorkerShellClient } from './WorkerShellClient';

// Thin server entry. Resolves the locale param, hands off to the client
// shell which gates auth/onboarded/role and renders chrome via hooks.
// Auth (unauthenticated) is enforced by proxy.ts before this runs.

type Props = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

export default async function WorkerLayout({ children, params }: Props) {
  const { locale } = await params;
  return <WorkerShellClient locale={locale}>{children}</WorkerShellClient>;
}
