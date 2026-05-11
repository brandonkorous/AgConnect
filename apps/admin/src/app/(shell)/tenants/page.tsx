import Link from 'next/link';
import { fetchTenants } from '@/lib/directory-api';

export const metadata = { title: 'Tenants — AgConn Admin' };
export const dynamic = 'force-dynamic';

type SearchParams = Record<string, string | string[] | undefined>;

export default async function TenantsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;
  const search = typeof sp['search'] === 'string' ? sp['search'] : undefined;
  const result = await fetchTenants(search);

  return (
    <div className="space-y-4">
      <div>
        <p className="eyebrow text-base-content/60">Platform</p>
        <h1 className="font-serif text-2xl font-medium tracking-tight">Tenants</h1>
        <p className="text-base-content/70 mt-1 max-w-2xl text-sm">
          Every tenant on the platform with rollup counts. Click in for full detail and
          impersonation entry-point.
        </p>
      </div>

      <form className="bg-base-100 border-base-300 rounded-box flex gap-3 border p-3">
        <input
          type="text"
          name="search"
          defaultValue={search ?? ''}
          placeholder="search by name or slug"
          className="input input-sm flex-1"
        />
        <button type="submit" className="btn btn-sm rounded-full">
          Search
        </button>
        {search && (
          <Link href="/tenants" className="btn btn-ghost btn-sm">
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
      ) : result.data.tenants.length === 0 ? (
        <div className="bg-base-100 border-base-300 text-base-content/70 rounded-box border p-8 text-center text-sm">
          No tenants found.
        </div>
      ) : (
        <div className="bg-base-100 border-base-300 overflow-hidden rounded-box border">
          <table className="table">
            <thead className="bg-base-200">
              <tr>
                <th>Name</th>
                <th>Slug</th>
                <th className="text-right">Users</th>
                <th className="text-right">Employers</th>
                <th className="text-right">Jobs</th>
                <th>Status</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {result.data.tenants.map((t) => (
                <tr key={t.id}>
                  <td className="text-sm font-medium">{t.name}</td>
                  <td className="font-mono text-xs">{t.slug}</td>
                  <td className="text-right font-mono text-xs tabular-nums">
                    {t.counts.users.toLocaleString('en-US')}
                  </td>
                  <td className="text-right font-mono text-xs tabular-nums">
                    {t.counts.employers.toLocaleString('en-US')}
                  </td>
                  <td className="text-right font-mono text-xs tabular-nums">
                    {t.counts.jobs.toLocaleString('en-US')}
                  </td>
                  <td>
                    {t.deletedAt ? (
                      <span className="badge badge-error badge-sm">Suspended</span>
                    ) : (
                      <span className="badge badge-success badge-sm">Active</span>
                    )}
                  </td>
                  <td className="space-x-3 text-right text-xs">
                    <Link href={`/tenants/${t.id}`} className="link link-hover">
                      Open
                    </Link>
                    {!t.deletedAt && (
                      <Link href={`/t/${t.id}`} className="link link-hover">
                        Impersonate →
                      </Link>
                    )}
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
