import Link from 'next/link';
import { fetchJobs } from '@/lib/work-api';
import { SavedViews } from '@/components/SavedViews';

export const metadata = { title: 'Jobs — AgConn Admin' };
export const dynamic = 'force-dynamic';

type SearchParams = Record<string, string | string[] | undefined>;
const STATUSES = ['draft', 'active', 'closed', 'filled'];

export default async function JobsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;
  const search = typeof sp['search'] === 'string' ? sp['search'] : undefined;
  const status = typeof sp['status'] === 'string' ? sp['status'] : undefined;
  const result = await fetchJobs({ search, status });

  return (
    <div className="space-y-4">
      <div>
        <p className="eyebrow text-base-content/60">Platform</p>
        <h1 className="font-serif text-2xl font-medium tracking-tight">Jobs</h1>
        <p className="text-base-content/70 mt-1 max-w-2xl text-sm">
          Job postings across all employers. Use status filter to triage drafts vs active vs
          closed.
        </p>
      </div>

      <form className="bg-base-100 border-base-300 rounded-box flex flex-wrap gap-3 border p-3">
        <input
          type="text"
          name="search"
          defaultValue={search ?? ''}
          placeholder="title or seo slug"
          className="input input-sm min-w-64 flex-1"
        />
        <select name="status" defaultValue={status ?? ''} className="select select-sm">
          <option value="">Any status</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <button type="submit" className="btn btn-sm rounded-full">
          Search
        </button>
        {(search || status) && (
          <Link href="/jobs" className="btn btn-ghost btn-sm">
            Reset
          </Link>
        )}
      </form>

      <SavedViews viewKey="jobs" />

      {!result.ok ? (
        <div role="alert" className="alert alert-error">
          <span>
            {result.error.code} — {result.error.message}
          </span>
        </div>
      ) : result.data.jobs.length === 0 ? (
        <div className="bg-base-100 border-base-300 text-base-content/70 rounded-box border p-8 text-center text-sm">
          No jobs match these filters.
        </div>
      ) : (
        <div className="bg-base-100 border-base-300 overflow-hidden rounded-box border">
          <table className="table">
            <thead className="bg-base-200">
              <tr>
                <th>Title</th>
                <th>Location</th>
                <th>Wage</th>
                <th>Status</th>
                <th className="text-right">Fill</th>
                <th>Apply by</th>
                <th>Created</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {result.data.jobs.map((j) => (
                <tr key={j.id}>
                  <td className="text-sm">{j.titleEn}</td>
                  <td className="text-xs">
                    {j.county}
                    {j.city ? ` · ${j.city}` : ''}
                  </td>
                  <td className="font-mono text-xs">
                    ${j.wageMin.toFixed(2)}
                    {j.wageMin !== j.wageMax ? `–${j.wageMax.toFixed(2)}` : ''}/{j.wageUnit}
                  </td>
                  <td>
                    <StatusBadge status={j.status} />
                  </td>
                  <td className="text-right font-mono text-xs tabular-nums">
                    {j.hireCount}/{j.positionsTotal}
                  </td>
                  <td className="font-mono text-xs">{j.applyBy ?? '—'}</td>
                  <td className="font-mono text-xs">{j.createdAt.slice(0, 10)}</td>
                  <td className="text-right">
                    <Link href={`/jobs/${j.id}`} className="link link-hover text-xs">
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

function StatusBadge({ status }: { status: string }) {
  const cls =
    status === 'active'
      ? 'badge-success'
      : status === 'filled'
        ? 'badge-info'
        : status === 'closed'
          ? 'badge-ghost'
          : 'badge-warning';
  return <span className={`badge ${cls} badge-sm`}>{status}</span>;
}
