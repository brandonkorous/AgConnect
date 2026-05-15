import { notFound } from 'next/navigation';
import Link from 'next/link';
import { fetchCorrelation } from '@/lib/audit-api';

export const metadata = { title: 'Correlation chain — AGCONN Admin' };
export const dynamic = 'force-dynamic';

export default async function CorrelationPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;
    const result = await fetchCorrelation(id);
    if (!result.ok) notFound();
    const events = result.data.events;
    const hasFailure = events.some((e) => e.outcome === 'failure');

    return (
        <div className="space-y-3">
            <div className="text-xs">
                <Link href="/audit" className="link link-hover text-base-content/60">
                    ← Back to audit log
                </Link>
            </div>
            <div className="bg-base-100 border-base-300 rounded-box border p-4">
                <p className="text-base-content/70 text-sm">Correlation ID</p>
                <p className="font-mono text-sm">{id}</p>
                {hasFailure && (
                    <div role="alert" className="alert alert-error mt-2 text-sm">
                        <span>This request chain ended in failure.</span>
                    </div>
                )}
            </div>
            <ol className="space-y-2">
                {events.map((e) => (
                    <li key={e.id} className="bg-base-100 border-base-300 rounded-box border p-4">
                        <div className="flex items-baseline justify-between">
                            <Link href={`/audit/event/${e.id}`} className="link link-hover font-mono text-sm">
                                {e.action}
                            </Link>
                            <span className="text-base-content/60 font-mono text-xs">
                                {new Date(e.occurredAt).toISOString().replace('T', ' ').slice(11, 23)}
                            </span>
                        </div>
                        <p className="text-base-content/70 text-xs">
                            {e.actorRole ?? 'system'} · {e.actorId ?? '—'} ·{' '}
                            {e.outcome === 'failure' ? (
                                <span className="text-error">failure</span>
                            ) : (
                                'success'
                            )}
                        </p>
                    </li>
                ))}
            </ol>
        </div>
    );
}
