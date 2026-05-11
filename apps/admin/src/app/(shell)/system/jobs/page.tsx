import Link from 'next/link';
import { fetchQueues, fetchRecentJobs } from '@/lib/system-api';
import { ReplayButton } from './ReplayButton';

export const metadata = { title: 'Job queues — AgConn Admin' };
export const dynamic = 'force-dynamic';

type SearchParams = Record<string, string | string[] | undefined>;

export default async function JobsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;
  const queue = typeof sp['queue'] === 'string' ? sp['queue'] : undefined;
  const state =
    sp['state'] === 'retry' || sp['state'] === 'active' || sp['state'] === 'failed'
      ? (sp['state'] as 'failed' | 'retry' | 'active')
      : 'failed';

  const [queuesRes, recentRes] = await Promise.all([
    fetchQueues(),
    fetchRecentJobs({ queue, state, limit: 50 }),
  ]);

  return (
    <div className="space-y-4">
      <div className="text-xs">
        <Link href="/system" className="link link-hover text-base-content/60">
          ← System
        </Link>
      </div>
      <div>
        <p className="eyebrow text-base-content/60">Platform</p>
        <h1 className="font-serif text-2xl font-medium tracking-tight">Job queues</h1>
        <p className="text-base-content/70 mt-1 max-w-2xl text-sm">
          pg-boss queue depth and the most recent failures. Replay re-enqueues a fresh copy
          of the job; the original stays put.
        </p>
      </div>

      {!queuesRes.ok ? (
        <div role="alert" className="alert alert-error">
          <span>
            {queuesRes.error.code} — {queuesRes.error.message}
          </span>
        </div>
      ) : queuesRes.data.queues.length === 0 ? (
        <div className="bg-base-100 border-base-300 text-base-content/70 rounded-box border p-8 text-center text-sm">
          No queues registered. pg-boss may not be initialized yet.
        </div>
      ) : (
        <div className="bg-base-100 border-base-300 overflow-hidden rounded-box border">
          <table className="table">
            <thead className="bg-base-200">
              <tr>
                <th>Queue</th>
                <th className="text-right">Pending</th>
                <th className="text-right">Retry</th>
                <th className="text-right">Active</th>
                <th className="text-right">Failed</th>
                <th>Oldest pending</th>
              </tr>
            </thead>
            <tbody>
              {queuesRes.data.queues.map((q) => (
                <tr key={q.name}>
                  <td className="font-mono text-xs">
                    <Link href={`/system/jobs?queue=${encodeURIComponent(q.name)}`} className="link link-hover">
                      {q.name}
                    </Link>
                  </td>
                  <td className="text-right font-mono tabular-nums text-xs">{q.pending}</td>
                  <td className="text-right font-mono tabular-nums text-xs">{q.retry}</td>
                  <td className="text-right font-mono tabular-nums text-xs">{q.active}</td>
                  <td className={`text-right font-mono tabular-nums text-xs ${q.failed > 0 ? 'text-error' : ''}`}>
                    {q.failed}
                  </td>
                  <td className="font-mono text-[11px]">
                    {q.oldestPending ? q.oldestPending.replace('T', ' ').slice(0, 19) : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="flex items-baseline justify-between">
        <h2 className="font-serif text-lg">Recent {state} jobs{queue ? ` — ${queue}` : ''}</h2>
        <div role="tablist" className="tabs tabs-border">
          {(['failed', 'retry', 'active'] as const).map((s) => (
            <Link
              key={s}
              role="tab"
              href={`/system/jobs?state=${s}${queue ? `&queue=${encodeURIComponent(queue)}` : ''}`}
              className={`tab tab-sm ${state === s ? 'tab-active' : ''}`}
            >
              {s}
            </Link>
          ))}
        </div>
      </div>

      {!recentRes.ok ? (
        <div role="alert" className="alert alert-error">
          <span>
            {recentRes.error.code} — {recentRes.error.message}
          </span>
        </div>
      ) : recentRes.data.jobs.length === 0 ? (
        <div className="bg-base-100 border-base-300 text-base-content/70 rounded-box border p-6 text-center text-sm">
          No jobs in this state.
        </div>
      ) : (
        <div className="bg-base-100 border-base-300 overflow-hidden rounded-box border">
          <table className="table">
            <thead className="bg-base-200">
              <tr>
                <th>Created</th>
                <th>Queue</th>
                <th className="text-right">Retries</th>
                <th>Job ID</th>
                <th>Output</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {recentRes.data.jobs.map((j) => (
                <tr key={j.id}>
                  <td className="font-mono text-xs">
                    {j.createdAt.replace('T', ' ').slice(0, 19)}
                  </td>
                  <td className="font-mono text-xs">{j.queue}</td>
                  <td className="text-right font-mono tabular-nums text-xs">{j.retryCount}</td>
                  <td className="font-mono text-[11px]">{j.id.slice(0, 8)}…</td>
                  <td className="text-error max-w-[36ch] truncate text-[11px]">
                    {j.output ? JSON.stringify(j.output).slice(0, 80) : '—'}
                  </td>
                  <td className="text-right">
                    {state === 'failed' && <ReplayButton jobId={j.id} />}
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
