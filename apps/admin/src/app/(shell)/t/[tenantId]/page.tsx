type Props = { params: Promise<{ tenantId: string }> };

export const metadata = { title: 'Tenant overview — AGCONN Admin' };

export default async function TenantOverviewPage({ params }: Props) {
    const { tenantId } = await params;

    return (
        <div className="space-y-6">
            <div>
                <p className="eyebrow text-base-content/60">Tenant</p>
                <h1 className="font-serif text-2xl font-medium tracking-tight">Tenant overview</h1>
                <p className="text-base-content/70 mt-1 text-sm font-mono">{tenantId}</p>
            </div>
            <div className="bg-base-100 border-base-300 rounded-box border p-5 text-sm">
                Tenant-scope dashboards land in Phase 5 (Tier A → tenants & users).
            </div>
        </div>
    );
}
