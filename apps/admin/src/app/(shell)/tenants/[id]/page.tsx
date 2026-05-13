import Link from 'next/link';
import { notFound } from 'next/navigation';
import { fetchTenant } from '@/lib/directory-api';

export const metadata = { title: 'Tenant — AgConn Admin' };
export const dynamic = 'force-dynamic';

export default async function TenantDetailPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;
    const result = await fetchTenant(id);
    if (!result.ok) notFound();
    const { tenant: t, counts } = result.data;

    return (
        <div className="space-y-6">
            <div className="text-xs">
                <Link href="/tenants" className="link link-hover text-base-content/60">
                    ← Back to tenants
                </Link>
            </div>

            <header className="bg-base-100 border-base-300 rounded-box border p-6">
                <div className="flex items-baseline justify-between">
                    <div>
                        <p className="eyebrow text-base-content/60">Tenant</p>
                        <h1 className="font-serif text-2xl font-medium tracking-tight">{t.name}</h1>
                        <p className="text-base-content/60 mt-1 font-mono text-xs">{t.slug}</p>
                        <p className="text-base-content/50 mt-0.5 font-mono text-xs">{t.id}</p>
                    </div>
                    <div className="text-right">
                        {t.deletedAt ? (
                            <span className="badge badge-error">Suspended</span>
                        ) : (
                            <span className="badge badge-success">Active</span>
                        )}
                        <div className="mt-3">
                            <Link href={`/t/${t.id}`} className="btn btn-primary btn-sm rounded-full">
                                Impersonate →
                            </Link>
                        </div>
                    </div>
                </div>
            </header>

            <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-5">
                <Tile label="Users" value={counts.users} />
                <Tile label="Employers" value={counts.employers} />
                <Tile label="Jobs" value={counts.jobs} />
                <Tile label="Applications" value={counts.applications} />
                <Tile label="Enrollments" value={counts.enrollments} />
            </div>

            <div className="bg-base-100 border-base-300 rounded-box border p-5">
                <h2 className="font-serif text-sm font-medium">Settings (raw)</h2>
                <pre className="bg-base-200 mt-3 overflow-auto rounded p-3 text-xs">
                    {JSON.stringify(t.settings ?? {}, null, 2)}
                </pre>
                <div className="text-base-content/50 mt-3 grid grid-cols-2 text-xs">
                    <span>Created: {t.createdAt.replace('T', ' ').slice(0, 19)}</span>
                    <span className="text-right">
                        Updated: {t.updatedAt.replace('T', ' ').slice(0, 19)}
                    </span>
                </div>
            </div>
        </div>
    );
}

function Tile({ label, value }: { label: string; value: number }) {
    return (
        <div className="bg-base-100 border-base-300 rounded-box border p-5">
            <div className="text-base-content/60 text-xs uppercase tracking-wide">{label}</div>
            <div className="mt-2 font-serif text-2xl tabular-nums">
                {value.toLocaleString('en-US')}
            </div>
        </div>
    );
}
