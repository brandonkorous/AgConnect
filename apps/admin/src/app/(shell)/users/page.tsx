import Link from 'next/link';
import { fetchUsers } from '@/lib/directory-api';

export const metadata = { title: 'Users — AGCONN Admin' };
export const dynamic = 'force-dynamic';

type SearchParams = Record<string, string | string[] | undefined>;

const ROLES = ['worker', 'employer', 'admin', 'training_org'];

export default async function UsersPage({
    searchParams,
}: {
    searchParams: Promise<SearchParams>;
}) {
    const sp = await searchParams;
    const search = typeof sp['search'] === 'string' ? sp['search'] : undefined;
    const role = typeof sp['role'] === 'string' ? sp['role'] : undefined;
    const result = await fetchUsers({ search, role });

    return (
        <div className="space-y-4">
            <div>
                <p className="eyebrow text-base-content/60">Platform</p>
                <h1 className="font-serif text-2xl font-medium tracking-tight">Users</h1>
                <p className="text-base-content/70 mt-1 max-w-2xl text-sm">
                    Cross-tenant user search by Clerk ID, email, or phone. Includes platform-level workers
                    and tenant-scoped employers / training orgs.
                </p>
            </div>

            <form className="bg-base-100 border-base-300 rounded-box flex flex-wrap gap-3 border p-3">
                <input
                    type="text"
                    name="search"
                    defaultValue={search ?? ''}
                    placeholder="search by id, email, phone"
                    className="input input-sm min-w-64 flex-1"
                />
                <select name="role" defaultValue={role ?? ''} className="select select-sm">
                    <option value="">Any role</option>
                    {ROLES.map((r) => (
                        <option key={r} value={r}>
                            {r}
                        </option>
                    ))}
                </select>
                <button type="submit" className="btn btn-sm rounded-full">
                    Search
                </button>
                {(search || role) && (
                    <Link href="/users" className="btn btn-ghost btn-sm">
                        Reset
                    </Link>
                )}
            </form>

            {!result.ok ? (
                <div role="alert" className="alert alert-error">
                    <span>
                        {result.error.code} — {result.error.message}
                    </span>
                </div>
            ) : result.data.users.length === 0 ? (
                <div className="bg-base-100 border-base-300 text-base-content/70 rounded-box border p-8 text-center text-sm">
                    No users match your search.
                </div>
            ) : (
                <div className="bg-base-100 border-base-300 overflow-hidden rounded-box border">
                    <table className="table">
                        <thead className="bg-base-200">
                            <tr>
                                <th>User ID</th>
                                <th>Role</th>
                                <th>Tenant</th>
                                <th>Email</th>
                                <th>Phone</th>
                                <th>Lang</th>
                                <th>Created</th>
                                <th />
                            </tr>
                        </thead>
                        <tbody>
                            {result.data.users.map((u) => (
                                <tr key={u.id}>
                                    <td className="font-mono text-xs">{u.id.slice(0, 18)}…</td>
                                    <td>
                                        <span className="badge badge-ghost badge-sm">{u.role}</span>
                                    </td>
                                    <td className="font-mono text-xs">
                                        {u.tenantId ? u.tenantId.slice(0, 8) + '…' : '—'}
                                    </td>
                                    <td className="text-xs">{u.email ?? '—'}</td>
                                    <td className="font-mono text-xs">{u.phone ?? '—'}</td>
                                    <td className="text-xs uppercase">{u.preferredLang}</td>
                                    <td className="font-mono text-xs">{u.createdAt.slice(0, 10)}</td>
                                    <td className="text-right">
                                        <Link href={`/users/${u.id}`} className="link link-hover text-xs">
                                            Open →
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
