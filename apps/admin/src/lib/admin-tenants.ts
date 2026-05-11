import 'server-only';
import type { TenantOption } from '@/components/admin-shell/TenantSwitcher';

// Server-side fetch of the admin's impersonable tenants. In Phase 1b this
// calls /admin/v1/me on the api; for now it returns an empty list so the
// switcher renders the Platform-only state without blocking the shell.
export async function listImpersonableTenants(): Promise<TenantOption[]> {
  return [];
}
