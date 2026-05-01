import { notFound } from 'next/navigation';
import { fetchCorrelation } from '../../client';

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
      <div className="bg-base-100 border-base-300 rounded-2xl border p-4">
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
          <li
            key={e.id}
            className="bg-base-100 border-base-300 rounded-2xl border p-4"
          >
            <div className="flex items-baseline justify-between">
              <span className="font-mono text-sm">{e.action}</span>
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
