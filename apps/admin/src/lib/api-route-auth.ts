import 'server-only';
import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { apiAccess } from './admin-access';
import { isAdminRole } from './clerk';

// Call first in every /api route handler: a 401/403 response, or null when the caller is an admin.
export async function denyUnlessAdmin(): Promise<NextResponse | null> {
  const session = await auth().catch(() => null);
  const access = apiAccess(session?.userId, session?.orgId, isAdminRole(session?.orgRole));
  if (access === 'allow') return null;
  const status = access === 'unauthenticated' ? 401 : 403;
  return NextResponse.json({ ok: false, error: { code: access } }, { status });
}
