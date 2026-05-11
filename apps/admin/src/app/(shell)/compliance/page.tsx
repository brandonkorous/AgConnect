import Link from 'next/link';
import { fetchComplianceItems, fetchScoreboard } from '@/lib/work-api';

export const metadata = { title: 'Compliance — AgConn Admin' };
export const dynamic = 'force-dynamic';

type SearchParams = Record<string, string | string[] | undefined>;
const STATUSES = ['ok', 'warn', 'fail'];

export default async function CompliancePage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;
  const search = typeof sp['search'] === 'string' ? sp['search'] : undefined;
  const status = typeof sp['status'] === 'string' ? sp['status'] : undefined;
  const category = typeof sp['category'] === 'string' ? sp['category'] : undefined;
  const tab = sp['tab'] === 'scoreboard' ? 'scoreboard' : 'items';

  const [itemsRes, scoreboardRes] = await Promise.all([
    tab === 'items' ? fetchComplianceItems({ search, status, category }) : null,
    tab === 'scoreboard' ? fetchScoreboard() : null,
  ]);

  return (
    <div className="space-y-4">
      <div>
        <p className="eyebrow text-base-content/60">Platform</p>
        <h1 className="font-serif text-2xl font-medium tracking-tight">Compliance</h1>
        <p className="text-base-content/70 mt-1 max-w-2xl text-sm">
          Per-employer compliance items and a scoreboard of the most-recent snapshot scores.
        </p>
      </div>

      <div role="tablist" className="tabs tabs-border">
        <Link
          href="/compliance?tab=items"
          role="tab"
          className={`tab ${tab === 'items' ? 'tab-active' : ''}`}
        >
          Items
        </Link>
        <Link
          href="/compliance?tab=scoreboard"
          role="tab"
          className={`tab ${tab === 'scoreboard' ? 'tab-active' : ''}`}
        >
          Scoreboard
        </Link>
      </div>

      {tab === 'items' && itemsRes && (
        <>
          <form className="bg-base-100 border-base-300 rounded-box flex flex-wrap gap-3 border p-3">
            <input type="hidden" name="tab" value="items" />
            <input
              type="text"
              name="search"
              defaultValue={search ?? ''}
              placeholder="label, key, or details substring"
              className="input input-sm min-w-64 flex-1"
            />
            <select name="status" defaultValue={status ?? ''} className="select select-sm">
              <option value="">Any status</option>
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            <input
              type="text"
              name="category"
              defaultValue={category ?? ''}
              placeholder="category"
              className="input input-sm w-40"
            />
            <button type="submit" className="btn btn-sm rounded-full">
              Search
            </button>
            {(search || status || category) && (
              <Link href="/compliance?tab=items" className="btn btn-ghost btn-sm">
                Reset
              </Link>
            )}
          </form>

          {!itemsRes.ok ? (
            <div role="alert" className="alert alert-error">
              <span>
                {itemsRes.error.code} — {itemsRes.error.message}
              </span>
            </div>
          ) : itemsRes.data.items.length === 0 ? (
            <div className="bg-base-100 border-base-300 text-base-content/70 rounded-box border p-8 text-center text-sm">
              No compliance items match.
            </div>
          ) : (
            <div className="bg-base-100 border-base-300 overflow-hidden rounded-box border">
              <table className="table">
                <thead className="bg-base-200">
                  <tr>
                    <th>Label</th>
                    <th>Category</th>
                    <th>Key</th>
                    <th>Status</th>
                    <th>Due</th>
                    <th>Employer</th>
                    <th>Evidence</th>
                  </tr>
                </thead>
                <tbody>
                  {itemsRes.data.items.map((i) => (
                    <tr key={i.id}>
                      <td className="text-sm">{i.label}</td>
                      <td className="text-xs">{i.category}</td>
                      <td className="font-mono text-[11px]">{i.itemKey}</td>
                      <td>
                        <StatusBadge status={i.status} />
                      </td>
                      <td className="font-mono text-xs">
                        {i.dueAt ? i.dueAt.slice(0, 10) : '—'}
                      </td>
                      <td className="text-xs">
                        <Link
                          href={`/employers/${i.employerId}`}
                          className="link link-hover"
                        >
                          {i.employerId.slice(0, 8)}…
                        </Link>
                      </td>
                      <td>
                        {i.evidenceUrl ? (
                          <a
                            href={i.evidenceUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="link link-hover text-xs"
                          >
                            View →
                          </a>
                        ) : (
                          <span className="text-base-content/40">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {tab === 'scoreboard' && scoreboardRes && (
        <>
          {!scoreboardRes.ok ? (
            <div role="alert" className="alert alert-error">
              <span>
                {scoreboardRes.error.code} — {scoreboardRes.error.message}
              </span>
            </div>
          ) : scoreboardRes.data.rows.length === 0 ? (
            <div className="bg-base-100 border-base-300 text-base-content/70 rounded-box border p-8 text-center text-sm">
              No score snapshots yet. The daily cron writes one per employer per day.
            </div>
          ) : (
            <>
              <p className="text-base-content/60 text-xs">
                Most-recent snapshot per employer · as of {scoreboardRes.data.asOf}
              </p>
              <div className="bg-base-100 border-base-300 overflow-hidden rounded-box border">
                <table className="table">
                  <thead className="bg-base-200">
                    <tr>
                      <th>Employer</th>
                      <th className="text-right">Score</th>
                      <th className="text-right">OK</th>
                      <th className="text-right">Warn</th>
                      <th className="text-right">Fail</th>
                      <th>Snapshot</th>
                    </tr>
                  </thead>
                  <tbody>
                    {scoreboardRes.data.rows.map((r) => (
                      <tr key={r.employerId}>
                        <td className="text-sm">
                          <Link
                            href={`/employers/${r.employerId}`}
                            className="link link-hover"
                          >
                            {r.employerName}
                          </Link>
                        </td>
                        <td className="text-right font-mono text-sm tabular-nums">
                          <ScoreBadge score={r.score} />
                        </td>
                        <td className="text-success text-right font-mono text-xs tabular-nums">
                          {r.okCount}
                        </td>
                        <td className="text-warning text-right font-mono text-xs tabular-nums">
                          {r.warnCount}
                        </td>
                        <td className="text-error text-right font-mono text-xs tabular-nums">
                          {r.failCount}
                        </td>
                        <td className="font-mono text-xs">{r.snapshotDate}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const cls =
    status === 'ok'
      ? 'badge-success'
      : status === 'warn'
        ? 'badge-warning'
        : 'badge-error';
  return <span className={`badge ${cls} badge-sm`}>{status}</span>;
}

function ScoreBadge({ score }: { score: number }) {
  const cls = score >= 90 ? 'text-success' : score >= 70 ? 'text-warning' : 'text-error';
  return <span className={cls}>{score}</span>;
}
