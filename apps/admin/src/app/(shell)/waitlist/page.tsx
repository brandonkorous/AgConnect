import Link from 'next/link';
import { fetchWaitlist } from '@/lib/ops-api';

export const metadata = { title: 'Waitlist — AgConn Admin' };
export const dynamic = 'force-dynamic';

type SearchParams = Record<string, string | string[] | undefined>;
const AUDIENCES = ['worker', 'employer', 'training_org', 'other'];
const STATES = ['pending', 'confirmed', 'welcomed', 'unsubscribed'];

export default async function WaitlistPage({
    searchParams,
}: {
    searchParams: Promise<SearchParams>;
}) {
    const sp = await searchParams;
    const reveal = sp['reveal'] === 'true';
    const search = typeof sp['search'] === 'string' ? sp['search'] : undefined;
    const audience = typeof sp['audience'] === 'string' ? sp['audience'] : undefined;
    const stateRaw = typeof sp['state'] === 'string' ? sp['state'] : undefined;
    const state = STATES.includes(stateRaw ?? '')
        ? (stateRaw as 'pending' | 'confirmed' | 'welcomed' | 'unsubscribed')
        : undefined;

    const result = await fetchWaitlist({ search, audience, state, reveal });

    const revealHref = (() => {
        const qs = new URLSearchParams();
        if (search) qs.set('search', search);
        if (audience) qs.set('audience', audience);
        if (state) qs.set('state', state);
        if (!reveal) qs.set('reveal', 'true');
        return `/waitlist${qs.toString() ? `?${qs.toString()}` : ''}`;
    })();

    const exportHref = (() => {
        const qs = new URLSearchParams();
        if (search) qs.set('search', search);
        if (audience) qs.set('audience', audience);
        if (state) qs.set('state', state);
        if (reveal) qs.set('reveal', 'true');
        return `/api/export/ops/waitlist/export.csv${qs.toString() ? `?${qs.toString()}` : ''}`;
    })();

    return (
        <div className="space-y-4">
            <div className="flex items-baseline justify-between">
                <div>
                    <p className="eyebrow text-base-content/60">Platform</p>
                    <h1 className="font-serif text-2xl font-medium tracking-tight">Waitlist</h1>
                    <p className="text-base-content/70 mt-1 max-w-2xl text-sm">
                        Landing-page sign-ups grouped by audience. Filter by state to find people ready
                        to onboard.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <a href={exportHref} className="btn btn-ghost btn-sm rounded-full">
                        Export CSV
                    </a>
                    <Link
                        href={revealHref}
                        className={`btn btn-sm rounded-full ${reveal ? 'btn-warning' : 'btn-ghost'}`}
                    >
                        {reveal ? 'Hide PII' : 'Reveal PII'}
                    </Link>
                </div>
            </div>

            {result.ok && result.data.summary.length > 0 && (
                <div className="grid gap-3 md:grid-cols-4">
                    {result.data.summary.map((s) => (
                        <div
                            key={s.audience}
                            className="bg-base-100 border-base-300 rounded-box border p-4"
                        >
                            <div className="text-base-content/60 text-xs uppercase tracking-wide">
                                {s.audience}
                            </div>
                            <div className="mt-1 font-serif text-2xl tabular-nums">
                                {s.count.toLocaleString('en-US')}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <form className="bg-base-100 border-base-300 rounded-box flex flex-wrap gap-3 border p-3">
                {reveal && <input type="hidden" name="reveal" value="true" />}
                <input
                    type="text"
                    name="search"
                    defaultValue={search ?? ''}
                    placeholder="email or phone"
                    className="input input-sm min-w-56 flex-1"
                />
                <select name="audience" defaultValue={audience ?? ''} className="select select-sm">
                    <option value="">Any audience</option>
                    {AUDIENCES.map((a) => (
                        <option key={a} value={a}>
                            {a}
                        </option>
                    ))}
                </select>
                <select name="state" defaultValue={state ?? ''} className="select select-sm">
                    <option value="">Any state</option>
                    {STATES.map((s) => (
                        <option key={s} value={s}>
                            {s}
                        </option>
                    ))}
                </select>
                <button type="submit" className="btn btn-sm rounded-full">
                    Search
                </button>
                {(search || audience || state) && (
                    <Link
                        href={`/waitlist${reveal ? '?reveal=true' : ''}`}
                        className="btn btn-ghost btn-sm"
                    >
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
            ) : result.data.rows.length === 0 ? (
                <div className="bg-base-100 border-base-300 text-base-content/70 rounded-box border p-8 text-center text-sm">
                    No waitlist entries match.
                </div>
            ) : (
                <div className="bg-base-100 border-base-300 overflow-hidden rounded-box border">
                    <table className="table">
                        <thead className="bg-base-200">
                            <tr>
                                <th>Created</th>
                                <th>Audience</th>
                                <th>Email</th>
                                <th>Phone</th>
                                <th>County</th>
                                <th>Lang</th>
                                <th>State</th>
                                <th>Source</th>
                            </tr>
                        </thead>
                        <tbody>
                            {result.data.rows.map((w) => (
                                <tr key={w.id}>
                                    <td className="font-mono text-xs">{w.createdAt.slice(0, 10)}</td>
                                    <td className="text-xs">{w.audience ?? '—'}</td>
                                    <td className="font-mono text-xs">{w.email ?? '—'}</td>
                                    <td className="font-mono text-xs">{w.phone ?? '—'}</td>
                                    <td className="text-xs">{w.county ?? '—'}</td>
                                    <td className="text-xs uppercase">{w.preferredLang}</td>
                                    <td>
                                        <StateBadge w={w} />
                                    </td>
                                    <td className="font-mono text-xs">{w.source}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}

function StateBadge({
    w,
}: {
    w: {
        confirmedAt: string | null;
        welcomedAt: string | null;
        unsubscribedAt: string | null;
    };
}) {
    if (w.unsubscribedAt) return <span className="badge badge-error badge-sm">unsubscribed</span>;
    if (w.welcomedAt) return <span className="badge badge-success badge-sm">welcomed</span>;
    if (w.confirmedAt) return <span className="badge badge-info badge-sm">confirmed</span>;
    return <span className="badge badge-warning badge-sm">pending</span>;
}
