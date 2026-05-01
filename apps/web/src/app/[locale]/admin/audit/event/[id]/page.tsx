import { notFound } from 'next/navigation';
import { fetchAuditEvent } from '../../client';

export default async function EventPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const result = await fetchAuditEvent(id);
  if (!result.ok) notFound();
  const event = result.data.event;

  const verified =
    'verified' in result.data ? (result.data.verified ? '✓ verified' : '✗ mismatch') : '';

  return (
    <div className="bg-base-100 border-base-300 rounded-2xl border p-6">
      <h2 className="font-mono text-lg">{event.action}</h2>
      <p className="text-base-content/70 text-sm">
        {new Date(event.occurredAt).toISOString()}
      </p>
      <dl className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-[10rem_1fr]">
        <dt className="text-base-content/60 text-sm">Actor</dt>
        <dd className="font-mono text-sm">
          {event.actorId ?? '—'} ({event.actorRole ?? '—'}) [{event.actorType}]
        </dd>
        <dt className="text-base-content/60 text-sm">IP / UA</dt>
        <dd className="text-sm">
          {event.actorIp ?? '—'} · {event.actorUserAgent ?? '—'}
        </dd>
        <dt className="text-base-content/60 text-sm">Resource</dt>
        <dd className="font-mono text-sm">
          {event.resourceType ?? '—'}:{event.resourceId ?? '—'}
        </dd>
        <dt className="text-base-content/60 text-sm">Outcome</dt>
        <dd className="text-sm">{event.outcome}</dd>
        <dt className="text-base-content/60 text-sm">Correlation</dt>
        <dd className="font-mono text-xs">{event.correlationId ?? '—'}</dd>
        <dt className="text-base-content/60 text-sm">HMAC v</dt>
        <dd className="text-sm">
          {event.eventHmacV} {verified && <span className="ml-2">{verified}</span>}
        </dd>
      </dl>
      <h3 className="mt-6 text-base font-medium">Metadata</h3>
      <pre className="bg-base-200 mt-2 overflow-auto rounded-xl p-4 text-xs">
        {JSON.stringify(event.metadata, null, 2)}
      </pre>
    </div>
  );
}
