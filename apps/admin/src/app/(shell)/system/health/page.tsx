import Link from 'next/link';
import { fetchHealth } from '@/lib/system-api';

export const metadata = { title: 'Service health — AgConn Admin' };
export const dynamic = 'force-dynamic';

function statusBadge(status: 'ok' | 'degraded' | 'down' | 'unknown') {
  const cls =
    status === 'ok'
      ? 'badge-success'
      : status === 'degraded'
        ? 'badge-warning'
        : status === 'down'
          ? 'badge-error'
          : 'badge-ghost';
  return <span className={`badge ${cls} badge-sm`}>{status}</span>;
}

function relTime(iso: string | null): string {
  if (!iso) return 'never';
  const diff = Date.now() - new Date(iso).getTime();
  if (diff < 0) return iso.slice(0, 19);
  const s = Math.floor(diff / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

export default async function HealthPage() {
  const result = await fetchHealth();

  return (
    <div className="space-y-4">
      <div className="text-xs">
        <Link href="/system" className="link link-hover text-base-content/60">
          ← System
        </Link>
      </div>
      <div className="flex items-baseline justify-between">
        <div>
          <p className="eyebrow text-base-content/60">Platform</p>
          <h1 className="font-serif text-2xl font-medium tracking-tight">Service health</h1>
          <p className="text-base-content/70 mt-1 max-w-2xl text-sm">
            Live /health pings paired with a recency probe from the database. The combination
            distinguishes &quot;up but idle&quot; from &quot;hasn&apos;t written in N minutes&quot;.
          </p>
        </div>
        {result.ok && (
          <div className="text-base-content/60 text-right text-[11px]">
            Checked {relTime(result.data.checkedAt)}
            <br />
            <Link href="/system/health" className="link link-hover">
              Refresh
            </Link>
          </div>
        )}
      </div>

      {!result.ok ? (
        <div role="alert" className="alert alert-error">
          <span>
            {result.error.code} — {result.error.message}
          </span>
        </div>
      ) : (
        <>
          <div className="bg-base-100 border-base-300 overflow-hidden rounded-box border">
            <table className="table">
              <thead className="bg-base-200">
                <tr>
                  <th>Service</th>
                  <th>Status</th>
                  <th className="text-right">Latency</th>
                  <th>Last activity</th>
                  <th>URL / note</th>
                </tr>
              </thead>
              <tbody>
                {result.data.services.map((s) => (
                  <tr key={s.name}>
                    <td>
                      <div className="font-mono text-xs">{s.name}</div>
                      <div className="text-base-content/60 mt-0.5 text-[11px]">{s.description}</div>
                    </td>
                    <td>{statusBadge(s.ping.status)}</td>
                    <td className="text-right font-mono tabular-nums text-xs">
                      {s.ping.latencyMs !== null ? `${s.ping.latencyMs} ms` : '—'}
                    </td>
                    <td className="text-xs">
                      <div className="font-mono">{relTime(s.lastActivity.at)}</div>
                      <div className="text-base-content/60 text-[10px]">{s.lastActivity.what}</div>
                    </td>
                    <td className="font-mono text-[11px] max-w-[28ch] truncate">
                      {s.ping.error
                        ? <span className="text-error">{s.ping.error}</span>
                        : s.url ?? <span className="text-base-content/40">no URL</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="bg-base-100 border-base-300 rounded-box border p-4">
            <h2 className="font-serif text-sm font-medium">Environment</h2>
            <div className="mt-3 grid gap-2 text-xs sm:grid-cols-2">
              <KV k="Node" v={result.data.env.node} />
              <KV k="NODE_ENV" v={result.data.env.nodeEnv} />
              <KV k="Git SHA" v={result.data.env.gitSha ?? '—'} mono />
              <KV k="Region" v={result.data.env.region ?? '—'} mono />
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function KV({ k, v, mono }: { k: string; v: string; mono?: boolean }) {
  return (
    <div className="border-base-200 flex justify-between border-b py-1 last:border-b-0">
      <span className="text-base-content/60">{k}</span>
      <span className={mono ? 'font-mono text-[11px]' : ''}>{v}</span>
    </div>
  );
}
