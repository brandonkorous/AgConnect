import Link from 'next/link';
import { fetchWorkers } from '@/lib/directory-api';
import { SavedViews } from '@/components/SavedViews';

export const metadata = { title: 'Workers — AGCONN Admin' };
export const dynamic = 'force-dynamic';

type SearchParams = Record<string, string | string[] | undefined>;
const COUNTIES = ['Fresno', 'Kern', 'Kings', 'Madera', 'Tulare'];

export default async function WorkersPage({
    searchParams,
}: {
    searchParams: Promise<SearchParams>;
}) {
    const sp = await searchParams;
    const search = typeof sp['search'] === 'string' ? sp['search'] : undefined;
    const county = typeof sp['county'] === 'string' ? sp['county'] : undefined;
    const result = await fetchWorkers({ search, county });

    return (
        <div className="space-y-4">
            <div>
                <p className="eyebrow text-base-content/60">Platform</p>
                <h1 className="font-serif text-2xl font-medium tracking-tight">Workers</h1>
                <p className="text-base-content/70 mt-1 max-w-2xl text-sm">
                    Platform-level worker directory. Read-only — workers manage their own profiles.
                </p>
            </div>

            <form className="bg-base-100 border-base-300 rounded-box flex flex-wrap gap-3 border p-3">
                <input
                    type="text"
                    name="search"
                    defaultValue={search ?? ''}
                    placeholder="search by name, email, phone, id"
                    className="input input-sm min-w-64 flex-1"
                />
                <select name="county" defaultValue={county ?? ''} className="select select-sm">
                    <option value="">Any county</option>
                    {COUNTIES.map((c) => (
                        <option key={c} value={c}>
                            {c}
                        </option>
                    ))}
                </select>
                <button type="submit" className="btn btn-sm rounded-full">
                    Search
                </button>
                {(search || county) && (
                    <Link href="/workers" className="btn btn-ghost btn-sm">
                        Reset
                    </Link>
                )}
            </form>

            <SavedViews viewKey="workers" />

            {!result.ok ? (
                <div role="alert" className="alert alert-error">
                    <span>
                        {result.error.code} — {result.error.message}
                    </span>
                </div>
            ) : result.data.workers.length === 0 ? (
                <div className="bg-base-100 border-base-300 text-base-content/70 rounded-box border p-8 text-center text-sm">
                    No workers match your search.
                </div>
            ) : (
                <div className="bg-base-100 border-base-300 overflow-hidden rounded-box border">
                    <table className="table">
                        <thead className="bg-base-200">
                            <tr>
                                <th>Name</th>
                                <th>Contact</th>
                                <th>County</th>
                                <th>Lang</th>
                                <th>Onboarded</th>
                                <th>Skills</th>
                                <th />
                            </tr>
                        </thead>
                        <tbody>
                            {result.data.workers.map((w) => (
                                <tr key={w.id}>
                                    <td>
                                        <div className="text-sm">
                                            {w.firstName || w.lastName ? (
                                                `${w.firstName ?? ''} ${w.lastName ?? ''}`
                                            ) : (
                                                <span className="text-base-content/40">—</span>
                                            )}
                                        </div>
                                        <div className="text-base-content/50 font-mono text-xs">
                                            {w.id.slice(0, 18)}…
                                        </div>
                                    </td>
                                    <td className="text-xs">
                                        <div className="font-mono">{w.phone ?? '—'}</div>
                                        {w.email && (
                                            <div className="text-base-content/60 mt-0.5">{w.email}</div>
                                        )}
                                    </td>
                                    <td className="text-xs">{w.county ?? '—'}</td>
                                    <td className="text-xs uppercase">{w.preferredLang}</td>
                                    <td className="text-xs">
                                        {w.onboarded ? (
                                            <span className="badge badge-success badge-sm">Yes</span>
                                        ) : (
                                            <span className="badge badge-ghost badge-sm">No</span>
                                        )}
                                    </td>
                                    <td>
                                        <div className="flex flex-wrap gap-1">
                                            {w.skills.slice(0, 3).map((s) => (
                                                <span key={s} className="badge badge-ghost badge-xs">
                                                    {s}
                                                </span>
                                            ))}
                                            {w.skills.length > 3 && (
                                                <span className="text-base-content/50 text-xs">
                                                    +{w.skills.length - 3}
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="text-right">
                                        <Link href={`/workers/${w.id}`} className="link link-hover text-xs">
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
