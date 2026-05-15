import Link from 'next/link';
import { fetchBilling } from '@/lib/ops-api';

export const metadata = { title: 'Billing — AGCONN Admin' };
export const dynamic = 'force-dynamic';

type SearchParams = Record<string, string | string[] | undefined>;

export default async function BillingPage({
    searchParams,
}: {
    searchParams: Promise<SearchParams>;
}) {
    const sp = await searchParams;
    const search = typeof sp['search'] === 'string' ? sp['search'] : undefined;
    const eventType = typeof sp['eventType'] === 'string' ? sp['eventType'] : undefined;
    const processed =
        sp['processed'] === 'true' || sp['processed'] === 'false'
            ? (sp['processed'] as 'true' | 'false')
            : undefined;
    const result = await fetchBilling({ search, eventType, processed });

    const exportHref = (() => {
        const qs = new URLSearchParams();
        if (search) qs.set('search', search);
        if (eventType) qs.set('eventType', eventType);
        if (processed) qs.set('processed', processed);
        return `/api/export/ops/billing/export.csv${qs.toString() ? `?${qs.toString()}` : ''}`;
    })();

    return (
        <div className="space-y-4">
            <div className="flex items-baseline justify-between">
                <div>
                    <p className="eyebrow text-base-content/60">Platform</p>
                    <h1 className="font-serif text-2xl font-medium tracking-tight">Billing</h1>
                    <p className="text-base-content/70 mt-1 max-w-2xl text-sm">
                        Stripe webhook event log. Use the unprocessed filter to find webhooks that errored
                        and need re-processing.
                    </p>
                </div>
                <a href={exportHref} className="btn btn-ghost btn-sm rounded-full">
                    Export CSV
                </a>
            </div>

            <form className="bg-base-100 border-base-300 rounded-box flex flex-wrap gap-3 border p-3">
                <input
                    type="text"
                    name="search"
                    defaultValue={search ?? ''}
                    placeholder="stripe event id"
                    className="input input-sm min-w-64 flex-1"
                />
                <input
                    type="text"
                    name="eventType"
                    defaultValue={eventType ?? ''}
                    placeholder="event type (e.g. invoice.paid)"
                    className="input input-sm w-56"
                />
                <select name="processed" defaultValue={processed ?? ''} className="select select-sm">
                    <option value="">All</option>
                    <option value="true">Processed</option>
                    <option value="false">Unprocessed</option>
                </select>
                <button type="submit" className="btn btn-sm rounded-full">
                    Search
                </button>
                {(search || eventType || processed) && (
                    <Link href="/billing" className="btn btn-ghost btn-sm">
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
            ) : result.data.events.length === 0 ? (
                <div className="bg-base-100 border-base-300 text-base-content/70 rounded-box border p-8 text-center text-sm">
                    No billing events match.
                </div>
            ) : (
                <div className="bg-base-100 border-base-300 overflow-hidden rounded-box border">
                    <table className="table">
                        <thead className="bg-base-200">
                            <tr>
                                <th>Created</th>
                                <th>Event type</th>
                                <th>Employer</th>
                                <th>Stripe ID</th>
                                <th>Processed</th>
                                <th>Error</th>
                                <th />
                            </tr>
                        </thead>
                        <tbody>
                            {result.data.events.map((b) => (
                                <tr key={b.id}>
                                    <td className="font-mono text-xs">
                                        {b.createdAt.replace('T', ' ').slice(0, 19)}
                                    </td>
                                    <td className="font-mono text-xs">{b.eventType}</td>
                                    <td className="text-xs">
                                        <Link
                                            href={`/employers/${b.employerId}`}
                                            className="link link-hover"
                                        >
                                            {b.employerName}
                                        </Link>
                                    </td>
                                    <td className="font-mono text-xs">{b.stripeEventId.slice(0, 18)}…</td>
                                    <td>
                                        {b.processedAt ? (
                                            <span className="badge badge-success badge-sm">
                                                {b.processedAt.replace('T', ' ').slice(11, 19)}
                                            </span>
                                        ) : (
                                            <span className="badge badge-warning badge-sm">pending</span>
                                        )}
                                    </td>
                                    <td className="text-error max-w-[24ch] truncate text-xs">
                                        {b.errorMsg ?? ''}
                                    </td>
                                    <td className="text-right">
                                        <Link href={`/billing/${b.id}`} className="link link-hover text-xs">
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
