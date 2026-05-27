import { redirect } from 'next/navigation';
import type { Route } from 'next';
import { auth } from '@clerk/nextjs/server';
import { isOk } from '@agconn/api-client';
import { getServerApiClient } from '@/lib/api/server-client';
import { shellFromUA } from '@/lib/shell-from-ua';

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
      // Admin lives on its own subdomain backed by a separate Clerk instance.
      // A web-Clerk session shouldn't carry these roles in practice; if it
      // does (legacy data), drop them onto the worker dashboard rather than
      // a removed /admin route.
      redirect(`/${locale}/worker/dashboard`);
    case 'worker': {
      // UA-sniff: mobile workers land in the mobile-first /field shell;
      // desktop workers land in the responsive /worker shell. Each shell's
      // layout owns its own un-onboarded redirect (to /<shell>/onboarding).
      // Workers can flip later via "Switch view" in the user menu.
      const shell = await shellFromUA();
      if (shell === 'field') {
        redirect(`/${locale}/field` as Route);
      }
      redirect(`/${locale}/worker/dashboard`);
    }
    default:
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
