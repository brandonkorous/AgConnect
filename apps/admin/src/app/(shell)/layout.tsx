import { requireAdmin } from '@/lib/admin-auth';
import { Sidebar } from '@/components/admin-shell/Sidebar';
import { Topbar } from '@/components/admin-shell/Topbar';
import { listImpersonableTenants } from '@/lib/admin-tenants';

type Props = {
  children: React.ReactNode;
  params?: Promise<{ tenantId?: string }>;
};

// Wraps the entire signed-in surface. Tenant scope is detected from URL via
// the nested /t/[tenantId] segment — the inner layout calls
// `requireAdminScope(tenantId)` and passes the active id down through props.
export default async function ShellLayout({ children }: Props) {
  const session = await requireAdmin();
  const tenants = await listImpersonableTenants();

  return (
    <div className="bg-base-200 min-h-screen md:flex">
      <Sidebar scope="platform" tenantId={null} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar
          user={{ fullName: session.fullName, email: session.email }}
          tenants={tenants}
          activeTenantId={null}
        />
        <main className="flex-1 px-5 py-6 md:px-8">{children}</main>
      </div>
    </div>
  );
}
