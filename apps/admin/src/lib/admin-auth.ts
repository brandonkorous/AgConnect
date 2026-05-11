import { redirect } from 'next/navigation';
import { auth } from '@clerk/nextjs/server';
import { createClerkClient } from '@clerk/backend';
import { adminClerkSecretKey, adminClerkPublishableKey, isAdminRole } from './clerk';
import type { AdminOrgRole } from './clerk';

// Dedicated server-side Clerk client bound to the admin instance keys. Used
// for user/org lookups that don't flow through the middleware-set request
// context. Built lazily so a missing env at import time doesn't crash boot.
let _adminClerk: ReturnType<typeof createClerkClient> | null = null;
function adminClerk() {
  if (!_adminClerk) {
    _adminClerk = createClerkClient({
      secretKey: adminClerkSecretKey,
      publishableKey: adminClerkPublishableKey,
    });
  }
  return _adminClerk;
}

export type AdminSession = {
  userId: string;
  email: string | null;
  fullName: string | null;
  orgId: string;
  orgRole: AdminOrgRole;
  orgSlug: string | null;
};

// Server-side gate. Call from every admin shell page/layout.
// Returns the session if the user is a member of the admin org with an
// admin/super_admin role; otherwise redirects (anonymous → sign-in,
// signed-in non-admin → /forbidden).
export async function requireAdmin(): Promise<AdminSession> {
  const session = await auth();
  if (!session.userId) {
    redirect('/sign-in');
  }

  // orgRole + orgId come from Clerk's active-organization claim. If the user
  // has no active org the session won't carry them — that's a forbidden case
  // for admin (single-org instance, every member must have a role).
  const orgRole = session.orgRole;
  const orgId = session.orgId;
  if (!orgId || !isAdminRole(orgRole)) {
    redirect('/forbidden');
  }

  const user = await adminClerk().users.getUser(session.userId);
  const email =
    user.emailAddresses.find((e) => e.id === user.primaryEmailAddressId)?.emailAddress ??
    user.emailAddresses[0]?.emailAddress ??
    null;
  const fullName =
    [user.firstName, user.lastName].filter(Boolean).join(' ').trim() || null;

  return {
    userId: session.userId,
    email,
    fullName,
    orgId,
    orgRole,
    orgSlug: session.orgSlug ?? null,
  };
}

export function isSuperAdmin(session: AdminSession): boolean {
  return session.orgRole === 'org:super_admin';
}

// The admin Clerk instance is fully separate from apps/web's Clerk. Server
// helpers like `clerkClient()` read from CLERK_SECRET_KEY by default, so we
// guard against the wrong instance being used at runtime when both are
// inadvertently present in dev.
export function assertAdminClerkEnv(): void {
  if (!adminClerkPublishableKey || !adminClerkSecretKey) {
    throw new Error(
      'Admin Clerk env missing: NEXT_PUBLIC_ADMIN_CLERK_PUBLISHABLE_KEY and ADMIN_CLERK_SECRET_KEY are required.',
    );
  }
}
