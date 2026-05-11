// Admin Clerk is a separate instance from the worker/employer one in apps/web.
// Keys live in NEXT_PUBLIC_ADMIN_CLERK_PUBLISHABLE_KEY + ADMIN_CLERK_SECRET_KEY
// so the two Clerk apps never share env or token validation.

export const adminClerkPublishableKey =
  process.env.NEXT_PUBLIC_ADMIN_CLERK_PUBLISHABLE_KEY ?? '';
export const adminClerkSecretKey = process.env.ADMIN_CLERK_SECRET_KEY ?? '';

export const clerkConfigured = Boolean(adminClerkPublishableKey && adminClerkSecretKey);

export const ADMIN_ORG_ROLES = ['org:admin', 'org:super_admin'] as const;
export type AdminOrgRole = (typeof ADMIN_ORG_ROLES)[number];

export function isAdminRole(role: string | undefined | null): role is AdminOrgRole {
  return role === 'org:admin' || role === 'org:super_admin';
}
