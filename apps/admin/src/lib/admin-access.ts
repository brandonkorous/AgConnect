// Pure auth decisions for the admin app, kept import-free so node:test can load them.

export type ApiAccess = 'allow' | 'unauthenticated' | 'forbidden';

// The ADMIN_BEARER_TOKEN fallback is for local dev and CI only; production never uses it.
export function bearerFallback(token: string, nodeEnv: string | undefined): string | null {
  if (!token || nodeEnv === 'production') return null;
  return `Bearer ${token}`;
}

// Decides whether a Clerk session may call an /api route handler.
export function apiAccess(
  userId: string | null | undefined,
  orgId: string | null | undefined,
  isAdmin: boolean,
): ApiAccess {
  if (!userId) return 'unauthenticated';
  if (!orgId || !isAdmin) return 'forbidden';
  return 'allow';
}
