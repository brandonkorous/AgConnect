import Link from 'next/link';
import { fetchEnrollments } from '@/lib/work-api';

export const metadata = { title: 'Enrollments — AGCONN Admin' };
export const dynamic = 'force-dynamic';

type SearchParams = Record<string, string | string[] | undefined>;
const STATUSES = ['enrolled', 'completed', 'dropped'];

export default async function EnrollmentsPage({
    searchParams,
}: {
    searchParams: Promise<SearchParams>;
}) {
    const sp = await searchParams;
    const search = typeof sp['search'] === 'string' ? sp['search'] : undefined;
    const status = typeof sp['status'] === 'string' ? sp['status'] : undefined;
    const result = await fetchEnrollments({ search, status });

    return (
        <div className="space-y-4">
            <div>
                <p className="eyebrow text-base-content/60">Platform</p>
                <h1 className="font-serif text-2xl font-medium tracking-tight">Enrollments</h1>
                <p className="text-base-content/70 mt-1 max-w-2xl text-sm">
                    Training enrollments across all programs and funders. Cert issuance status visible
                    per row.
                </p>
            </div>

            <form className="bg-base-100 border-base-300 rounded-box flex flex-wrap gap-3 border p-3">
                <input
                    type="text"
                    name="search"
                    defaultValue={search ?? ''}
                    placeholder="worker id, enrollment id, or program title"
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
                    <Link href="/enrollments" className="btn btn-ghost btn-sm">
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
            ) : result.data.enrollments.length === 0 ? (
                <div className="bg-base-100 border-base-300 text-base-content/70 rounded-box border p-8 text-center text-sm">
                    No enrollments match.
                </div>
            ) : (
                <div className="bg-base-100 border-base-300 overflow-hidden rounded-box border">
                    <table className="table">
                        <thead className="bg-base-200">
                            <tr>
                                <th>Program</th>
                                <th>Funder</th>
                                <th>County</th>
                                <th>Worker</th>
                                <th>Status</th>
                                <th>Enrolled</th>
                                <th>Cert</th>
                                <th />
                            </tr>
                        </thead>
                        <tbody>
                            {result.data.enrollments.map((e) => (
                                <tr key={e.id}>
                                    <td className="text-sm">{e.programTitle}</td>
                                    <td className="text-xs">{e.funder}</td>
                                    <td className="text-xs">{e.county}</td>
                                    <td className="font-mono text-xs">
                                        <Link href={`/workers/${e.workerId}`} className="link link-hover">
                                            {e.workerId.slice(0, 18)}…
                                        </Link>
                                    </td>
                                    <td>
                                        <StatusBadge status={e.status} noShow={e.noShow} />
                                    </td>
                                    <td className="font-mono text-xs">{e.enrolledAt.slice(0, 10)}</td>
                                    <td className="font-mono text-xs">
                                        {e.certIssued ? (
                                            <span className="text-success">
                                                {e.certificateId ? e.certificateId.slice(0, 10) + '…' : '✓'}
                                            </span>
                                        ) : (
                                            <span className="text-base-content/40">—</span>
                                        )}
                                    </td>
                                    <td className="text-right">
                                        <Link href={`/enrollments/${e.id}`} className="link link-hover text-xs">
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

function StatusBadge({ status, noShow }: { status: string; noShow: boolean }) {
    if (noShow) {
        return <span className="badge badge-error badge-sm">no-show</span>;
    }
    const cls =
        status === 'completed'
            ? 'badge-success'
            : status === 'dropped'
                ? 'badge-ghost'
                : 'badge-info';
    return <span className={`badge ${cls} badge-sm`}>{status}</span>;
}
