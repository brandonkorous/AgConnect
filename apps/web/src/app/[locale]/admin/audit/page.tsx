import { getTranslations } from 'next-intl/server';
import { EmptyState } from '@agconn/ui';
import { AuditFilters } from './AuditFilters';
import { fetchAuditEvents, type ServerAuditEvent } from './client';

type SearchParams = Record<string, string | string[] | undefined>;

const buildQs = (sp: SearchParams): string => {
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
    const map: Record<string, number> = {
      '1h': 3600_000,
      '24h': 86_400_000,
      '7d': 604_800_000,
      '30d': 2_592_000_000,
    };
    const ms = map[preset];
    if (ms) params.set('from', new Date(Date.now() - ms).toISOString());
  }
  if (typeof sp['to'] === 'string') params.set('to', sp['to']);
  return params.toString();
};

export default async function AdminAuditPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;
  const t = await getTranslations('admin.audit');
  const tFallback = (k: string, en: string) => {
    const out = t(k, { default: '' });
    return out && out.length > 0 ? out : en;
  };

  const qs = buildQs(sp);
  const result = await fetchAuditEvents(qs);

  const filterCopy = {
    reset: tFallback('filter.reset', 'Reset filters'),
    outcome: {
      label: tFallback('filter.outcome.label', 'Outcome'),
      success: tFallback('filter.outcome.success', 'Success'),
      failure: tFallback('filter.outcome.failure', 'Failure'),
      both: tFallback('filter.outcome.both', 'All'),
    },
    date: {
      label: tFallback('filter.date.label', 'Date range'),
      preset: {
        '1h': tFallback('filter.date.preset.1h', 'Last hour'),
        '24h': tFallback('filter.date.preset.24h', 'Last 24 hours'),
        '7d': tFallback('filter.date.preset.7d', 'Last 7 days'),
        '30d': tFallback('filter.date.preset.30d', 'Last 30 days'),
        custom: tFallback('filter.date.preset.custom', 'Custom'),
      },
    },
    action: {
      label: tFallback('filter.action.label', 'Action'),
      prefix_mode: tFallback('filter.action.prefix_mode', 'Match prefix'),
    },
    actor: { label: tFallback('filter.actor.label', 'Actor') },
    correlation_id: { label: tFallback('filter.correlation_id.label', 'Correlation ID') },
  };

  return (
    <div>
      <AuditFilters copy={filterCopy} />
      {!result.ok ? (
        <div role="alert" className="alert alert-error">
          <span>
            {tFallback(`error.${result.error.code}.title`, result.error.message)}
          </span>
        </div>
      ) : result.data.events.length === 0 ? (
        <EmptyState
          title={tFallback('table.empty.title', 'No events match your filters')}
          description={tFallback(
            'table.empty.description',
            'Try widening the date range or removing a filter.',
          )}
        />
      ) : (
        <AuditTable events={result.data.events} t={tFallback} />
      )}
    </div>
  );
}

function AuditTable({
  events,
  t,
}: {
  events: ServerAuditEvent[];
  t: (k: string, en: string) => string;
}) {
  return (
    <div className="bg-base-100 border-base-300 overflow-hidden rounded-2xl border">
      <table className="table-zebra table">
        <thead className="bg-base-200">
          <tr>
            <th>{t('table.column.time', 'Time')}</th>
            <th>{t('table.column.action', 'Action')}</th>
            <th>{t('table.column.actor', 'Actor')}</th>
            <th>{t('table.column.resource', 'Resource')}</th>
            <th>{t('table.column.outcome', 'Outcome')}</th>
          </tr>
        </thead>
        <tbody>
          {events.map((e) => (
            <tr key={e.id}>
              <td className="font-mono text-xs">{new Date(e.occurredAt).toISOString().replace('T', ' ').slice(0, 19)}</td>
              <td>
                <div className="font-mono text-xs">{e.action}</div>
                <div className="text-base-content/70 text-xs">
                  {t(`action.${e.action}.label`, e.action)}
                </div>
              </td>
              <td className="text-xs">
                {e.actorId ? (
                  <span className="font-mono">{e.actorId}</span>
                ) : (
                  <span className="text-base-content/50">—</span>
                )}
                {e.actorRole && <span className="text-base-content/60 ml-1">({e.actorRole})</span>}
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
                  <span className="badge badge-error badge-sm" aria-label="failure">
                    failure
                  </span>
                ) : (
                  <span className="badge badge-ghost badge-sm">success</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
