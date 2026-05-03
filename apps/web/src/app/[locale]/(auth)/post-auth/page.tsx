import { redirect } from 'next/navigation';
import type { Route } from 'next';
import { auth } from '@clerk/nextjs/server';
import { isOk } from '@agconn/api-client';
import { getServerApiClient } from '@/lib/api/server-client';

export const dynamic = 'force-dynamic';

type Role = 'worker' | 'employer' | 'admin' | 'training_org';
type Props = { params: Promise<{ locale: string }> };

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
    case 'training_org':
      redirect(`/${locale}/admin/audit`);
    case 'worker':
      redirect(`/${locale}/worker/dashboard`);
    default:
      // API didn't return a role — provisioning hasn't completed. Worker
      // dashboard itself redirects unknown users to /onboarding.
      redirect(`/${locale}/worker/dashboard`);
  }
}

async function fetchRole(): Promise<Role | null> {
  try {
    const client = await getServerApiClient();
    const res = await client.get<{ user: { role: Role } }>('/v1/me', {
      handleErrorInline: true,
    });
    if (!isOk(res)) return null;
    return res.data.user.role;
  } catch {
    return null;
  }
}
