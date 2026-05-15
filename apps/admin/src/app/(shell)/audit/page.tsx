import Link from 'next/link';
import { AuditFilters } from './AuditFilters';
import { fetchAuditEvents, type ServerAuditEvent } from '@/lib/audit-api';
import { SavedViews } from '@/components/SavedViews';

export const metadata = { title: 'Audit log — AGCONN Admin' };
export const dynamic = 'force-dynamic';

type SearchParams = Record<string, string | string[] | undefined>;

const PRESET_MS: Record<string, number> = {
    '1h': 3600_000,
    '24h': 86_400_000,
    '7d': 604_800_000,
    '30d': 2_592_000_000,
};

function buildQs(sp: SearchParams): string {
    const params = new URLSearchParams();
    const pick = (k: string) => {
        const v = sp[k];
        if (typeof v === 'string' && v.length > 0) params.set(k, v);
    };
    pick('action');
    pick('actionPrefix');
    pick('actorId');
    pick('actorRole');
    pick('outcome');
    pick('correlationId');
    pick('resourceType');
    pick('resourceId');
    pick('cursor');

    if (typeof sp['from'] === 'string') params.set('from', sp['from']);
    else {
        const preset = (typeof sp['preset'] === 'string' ? sp['preset'] : '7d') as string;
        const ms = PRESET_MS[preset];
        if (ms) params.set('from', new Date(Date.now() - ms).toISOString());
    }
    if (typeof sp['to'] === 'string') params.set('to', sp['to']);
    return params.toString();
}

export default async function AdminAuditPage({
    searchParams,
}: {
    searchParams: Promise<SearchParams>;
}) {
    const sp = await searchParams;
    const qs = buildQs(sp);
    const result = await fetchAuditEvents(qs);

    return (
        <div className="space-y-4">
            <div>
                <p className="eyebrow text-base-content/60">Platform</p>
                <h1 className="font-serif text-2xl font-medium tracking-tight">Audit log</h1>
                <p className="text-base-content/70 mt-1 text-sm">
                    Append-only record of every sensitive action across the platform.
                </p>
            </div>
            <AuditFilters />
            <SavedViews viewKey="audit" />
            {!result.ok ? (
                <div role="alert" className="alert alert-error">
                    <span>{result.error.message || result.error.code}</span>
                </div>
            ) : result.data.events.length === 0 ? (
                <div className="bg-base-100 border-base-300 rounded-box border p-8 text-center text-sm">
                    No events match your filters. Try widening the date range.
                </div>
            ) : (
                <AuditTable events={result.data.events} />
            )}
        </div>
    );
}

function AuditTable({ events }: { events: ServerAuditEvent[] }) {
    return (
        <div className="bg-base-100 border-base-300 overflow-hidden rounded-box border">
            <table className="table-zebra table">
                <thead className="bg-base-200">
                    <tr>
                        <th>Time</th>
                        <th>Action</th>
                        <th>Actor</th>
                        <th>Resource</th>
                        <th>Outcome</th>
                        <th></th>
                    </tr>
                </thead>
                <tbody>
                    {events.map((e) => (
                        <tr key={e.id}>
                            <td className="font-mono text-xs">
                                {new Date(e.occurredAt).toISOString().replace('T', ' ').slice(0, 19)}
                            </td>
                            <td>
                                <div className="font-mono text-xs">{e.action}</div>
                            </td>
                            <td className="text-xs">
                                {e.actorId ? (
                                    <span className="font-mono">{e.actorId}</span>
                                ) : (
                                    <span className="text-base-content/50">—</span>
                                )}
                                {e.actorRole && (
                                    <span className="text-base-content/60 ml-1">({e.actorRole})</span>
                                )}
                            </td>
                            <td className="text-xs">
                                {e.resourceType && <span className="font-mono">{e.resourceType}</span>}
                                {e.resourceId && (
                                    <span className="text-base-content/70 font-mono">
                                        :{e.resourceId.slice(0, 8)}
                                    </span>
                                )}
                            </td>
                            <td>
                                {e.outcome === 'failure' ? (
                                    <span className="badge badge-error badge-sm">failure</span>
                                ) : (
                                    <span className="badge badge-ghost badge-sm">success</span>
                                )}
                            </td>
                            <td className="text-right text-xs">
                                <Link href={`/audit/event/${e.id}`} className="link link-hover">
                                    Open
                                </Link>
                                {e.correlationId && (
                                    <>
                                        <span className="mx-1 text-base-content/30">·</span>
                                        <Link
                                            href={`/audit/correlation/${e.correlationId}`}
                                            className="link link-hover"
                                        >
                                            Chain
                                        </Link>
                                    </>
                                )}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
