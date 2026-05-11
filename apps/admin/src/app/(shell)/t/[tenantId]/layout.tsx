import { requireAdmin } from '@/lib/admin-auth';
import { Sidebar } from '@/components/admin-shell/Sidebar';
import { Topbar } from '@/components/admin-shell/Topbar';
import { listImpersonableTenants } from '@/lib/admin-tenants';
import { notFound } from 'next/navigation';

type Props = {
  children: React.ReactNode;
  params: Promise<{ tenantId: string }>;
};

// Tenant-scoped layout. Re-renders the chrome with the tenant switcher active
// and the sidebar filtered to tenant-scope items. The api requireAdminOrg
// middleware uses the same tenantId from the URL as the X-Admin-Tenant-Id
// header value when this app calls the api.
export default async function TenantShellLayout({ children, params }: Props) {
  const { tenantId } = await params;
  const session = await requireAdmin();
  const tenants = await listImpersonableTenants();

  // Validate the tenantId is one the admin can impersonate. In Phase 1 the list
  // is empty (stub), so we skip the check until the api endpoint lands; once
  // wired, an unknown tenantId yields 404.
  if (tenants.length > 0 && !tenants.some((t) => t.id === tenantId)) {
    notFound();
  }

  return (
    <div className="bg-base-200 min-h-screen md:flex">
      <Sidebar scope="tenant" tenantId={tenantId} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar
          user={{ fullName: session.fullName, email: session.email }}
          tenants={tenants}
          activeTenantId={tenantId}
        />
        <main className="flex-1 px-5 py-6 md:px-8">{children}</main>
      </div>
    </div>
  );
}
