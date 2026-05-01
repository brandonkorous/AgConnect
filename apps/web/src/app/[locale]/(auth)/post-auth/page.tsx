import { redirect } from 'next/navigation';
import type { Route } from 'next';
import { auth } from '@clerk/nextjs/server';
import { isOk } from '@agconn/api-client';
import { getServerApiClient } from '@/lib/api/server-client';

export const dynamic = 'force-dynamic';

type Props = { params: Promise<{ locale: string }> };

// Post-auth router. After Clerk completes sign-in or sign-up, the form
// pushes the user here. We look up the role from /v1/me/tenant (or the
// onboarding endpoints) and redirect to the right dashboard.
export default async function PostAuthPage({ params }: Props) {
  const { locale } = await params;
  const session = await auth().catch(() => null);
  const userId = session?.userId ?? null;
  if (!userId) {
    redirect(`/${locale}/sign-in` as Route);
  }

  const role = await fetchRole();
  switch (role) {
    case 'employer':
      redirect(`/${locale}/employer/dashboard`);
    case 'admin':
      redirect(`/${locale}/admin/audit`);
    case 'training_org':
      redirect(`/${locale}/admin/audit`);
    case 'worker':
      redirect(`/${locale}/worker/dashboard`);
    default:
      // Webhook hasn't replicated the user yet — send them to the worker
      // dashboard, which itself redirects unauthenticated/unknown users
      // to /onboarding. Worst case the user sees one extra hop.
      redirect(`/${locale}/worker/dashboard`);
  }
}

async function fetchRole(): Promise<
  'worker' | 'employer' | 'admin' | 'training_org' | null
> {
  try {
    const client = await getServerApiClient();
    const res = await client.get<{
      user: { role: 'worker' | 'employer' | 'admin' | 'training_org' };
    }>('/v1/me/tenant', { handleErrorInline: true });
    if (!isOk(res)) return null;
    return res.data.user.role;
  } catch {
    return null;
  }
}
