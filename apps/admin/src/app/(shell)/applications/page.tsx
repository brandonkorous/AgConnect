import Link from 'next/link';
import { fetchApplications } from '@/lib/work-api';
import { SavedViews } from '@/components/SavedViews';

export const metadata = { title: 'Applications — AGCONN Admin' };
export const dynamic = 'force-dynamic';

type SearchParams = Record<string, string | string[] | undefined>;
const STATUSES = ['applied', 'reviewed', 'hired', 'rejected', 'withdrawn'];

export default async function ApplicationsPage({
    searchParams,
}: {
    searchParams: Promise<SearchParams>;
}) {
    const sp = await searchParams;
    const search = typeof sp['search'] === 'string' ? sp['search'] : undefined;
    const status = typeof sp['status'] === 'string' ? sp['status'] : undefined;
    const result = await fetchApplications({ search, status });

    return (
        <div className="space-y-4">
            <div>
                <p className="eyebrow text-base-content/60">Platform</p>
                <h1 className="font-serif text-2xl font-medium tracking-tight">Applications</h1>
                <p className="text-base-content/70 mt-1 max-w-2xl text-sm">
                    Every application across all jobs. Filter by status to triage support cases.
                </p>
            </div>

            <form className="bg-base-100 border-base-300 rounded-box flex flex-wrap gap-3 border p-3">
                <input
                    type="text"
                    name="search"
                    defaultValue={search ?? ''}
                    placeholder="application id, worker id, or job title"
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
                    <Link href="/applications" className="btn btn-ghost btn-sm">
                        Reset
                    </Link>
                )}
            </form>

            <SavedViews viewKey="applications" />

            {!result.ok ? (
                <div role="alert" className="alert alert-error">
                    <span>
                        {result.error.code} — {result.error.message}
                    </span>
                </div>
            ) : result.data.applications.length === 0 ? (
                <div className="bg-base-100 border-base-300 text-base-content/70 rounded-box border p-8 text-center text-sm">
                    No applications match.
                </div>
            ) : (
                <div className="bg-base-100 border-base-300 overflow-hidden rounded-box border">
                    <table className="table">
                        <thead className="bg-base-200">
                            <tr>
                                <th>Job</th>
                                <th>Worker</th>
                                <th>Status</th>
                                <th>Wage</th>
                                <th>Applied</th>
                                <th>Hired</th>
                                <th />
                            </tr>
                        </thead>
                        <tbody>
                            {result.data.applications.map((a) => (
                                <tr key={a.id}>
                                    <td className="text-sm">
                                        <Link href={`/jobs/${a.jobId}`} className="link link-hover">
                                            {a.jobTitle}
                                        </Link>
                                        {a.countyAtApply && (
                                            <div className="text-base-content/50 text-xs">
                                                {a.countyAtApply}
                                            </div>
                                        )}
                                    </td>
                                    <td className="font-mono text-xs">
                                        <Link href={`/workers/${a.workerId}`} className="link link-hover">
                                            {a.workerId.slice(0, 18)}…
                                        </Link>
                                    </td>
                                    <td>
                                        <StatusBadge status={a.status} />
                                    </td>
                                    <td className="font-mono text-xs">
                                        {a.wageOffered ? `$${a.wageOffered.toFixed(2)}` : '—'}
                                    </td>
                                    <td className="font-mono text-xs">{a.appliedAt.slice(0, 10)}</td>
                                    <td className="font-mono text-xs">
                                        {a.hiredAt ? a.hiredAt.slice(0, 10) : '—'}
                                    </td>
                                    <td className="text-right">
                                        <Link href={`/applications/${a.id}`} className="link link-hover text-xs">
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
        status === 'hired'
            ? 'badge-success'
            : status === 'rejected'
                ? 'badge-error'
                : status === 'withdrawn'
                    ? 'badge-ghost'
                    : status === 'reviewed'
                        ? 'badge-info'
                        : 'badge-warning';
    return <span className={`badge ${cls} badge-sm`}>{status}</span>;
}
