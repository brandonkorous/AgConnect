import Link from 'next/link';
import { fetchEmails, fetchEmailSuppressions } from '@/lib/ops-api';
import { SavedViews } from '@/components/SavedViews';

export const metadata = { title: 'Email — AgConn Admin' };
export const dynamic = 'force-dynamic';

type SearchParams = Record<string, string | string[] | undefined>;
const EMAIL_STATUSES = ['queued', 'sent', 'delivered', 'bounced', 'complained', 'failed'];
const SUPPRESSION_REASONS = ['bounce', 'complaint', 'manual', 'unsubscribe'];

export default async function EmailPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;
  const tab = sp['tab'] === 'suppressions' ? 'suppressions' : 'logs';
  const reveal = sp['reveal'] === 'true';
  const search = typeof sp['search'] === 'string' ? sp['search'] : undefined;
  const status = typeof sp['status'] === 'string' ? sp['status'] : undefined;
  const reason = typeof sp['reason'] === 'string' ? sp['reason'] : undefined;
  const template = typeof sp['template'] === 'string' ? sp['template'] : undefined;

  const [logsRes, supRes] = await Promise.all([
    tab === 'logs' ? fetchEmails({ search, status, template, reveal }) : null,
    tab === 'suppressions' ? fetchEmailSuppressions({ search, reason, reveal }) : null,
  ]);

  const revealHref = (() => {
    const qs = new URLSearchParams();
    qs.set('tab', tab);
    if (search) qs.set('search', search);
    if (status) qs.set('status', status);
    if (reason) qs.set('reason', reason);
    if (template) qs.set('template', template);
    if (!reveal) qs.set('reveal', 'true');
    return `/email?${qs.toString()}`;
  })();

  const exportHref = (() => {
    const qs = new URLSearchParams();
    if (search) qs.set('search', search);
    if (status) qs.set('status', status);
    if (template) qs.set('template', template);
    if (reveal) qs.set('reveal', 'true');
    return `/api/export/ops/email/export.csv${qs.toString() ? `?${qs.toString()}` : ''}`;
  })();

  return (
    <div className="space-y-4">
      <div className="flex items-baseline justify-between">
        <div>
          <p className="eyebrow text-base-content/60">Platform</p>
          <h1 className="font-serif text-2xl font-medium tracking-tight">Email</h1>
          <p className="text-base-content/70 mt-1 max-w-2xl text-sm">
            Resend transactional log, bounces / complaints, and the suppression list.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {tab === 'logs' && (
            <a href={exportHref} className="btn btn-ghost btn-sm rounded-full">
              Export CSV
            </a>
          )}
          <Link
            href={revealHref}
            className={`btn btn-sm rounded-full ${reveal ? 'btn-warning' : 'btn-ghost'}`}
          >
            {reveal ? 'Hide PII' : 'Reveal PII'}
          </Link>
        </div>
      </div>

      <div role="tablist" className="tabs tabs-border">
        <Link
          href={`/email?tab=logs${reveal ? '&reveal=true' : ''}`}
          role="tab"
          className={`tab ${tab === 'logs' ? 'tab-active' : ''}`}
        >
          Send log
        </Link>
        <Link
          href={`/email?tab=suppressions${reveal ? '&reveal=true' : ''}`}
          role="tab"
          className={`tab ${tab === 'suppressions' ? 'tab-active' : ''}`}
        >
          Suppressions
        </Link>
      </div>

      {tab === 'logs' && logsRes && (
        <>
          <form className="bg-base-100 border-base-300 rounded-box flex flex-wrap gap-3 border p-3">
            <input type="hidden" name="tab" value="logs" />
            {reveal && <input type="hidden" name="reveal" value="true" />}
            <input
              type="text"
              name="search"
              defaultValue={search ?? ''}
              placeholder="email, provider id, subject"
              className="input input-sm min-w-64 flex-1"
            />
            <select name="status" defaultValue={status ?? ''} className="select select-sm">
              <option value="">Any status</option>
              {EMAIL_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            <input
              type="text"
              name="template"
              defaultValue={template ?? ''}
              placeholder="template"
              className="input input-sm w-40"
            />
            <button type="submit" className="btn btn-sm rounded-full">
              Search
            </button>
          </form>

          <SavedViews viewKey="email.logs" alwaysInclude={['tab']} />

          {!logsRes.ok ? (
            <Err result={logsRes} />
          ) : logsRes.data.emails.length === 0 ? (
            <Empty msg="No email log entries match." />
          ) : (
            <div className="bg-base-100 border-base-300 overflow-hidden rounded-box border">
              <table className="table">
                <thead className="bg-base-200">
                  <tr>
                    <th>Queued</th>
                    <th>Template</th>
                    <th>Subject</th>
                    <th>To</th>
                    <th>Status</th>
                    <th>Provider</th>
                  </tr>
                </thead>
                <tbody>
                  {logsRes.data.emails.map((e) => (
                    <tr key={e.id}>
                      <td className="font-mono text-xs">{e.queuedAt.replace('T', ' ').slice(0, 19)}</td>
                      <td className="text-xs">{e.template}</td>
                      <td className="max-w-[28ch] truncate text-xs">{e.subject}</td>
                      <td className="font-mono text-xs">{e.toEmail}</td>
                      <td>
                        <EmailStatusBadge status={e.status} />
                      </td>
                      <td className="font-mono text-[11px]">
                        {e.providerId?.slice(0, 14) ?? '—'}
                        {e.errorMsg && (
                          <div className="text-error text-[11px]">{e.errorMsg.slice(0, 24)}</div>
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

      {tab === 'suppressions' && supRes && (
        <>
          <form className="bg-base-100 border-base-300 rounded-box flex flex-wrap gap-3 border p-3">
            <input type="hidden" name="tab" value="suppressions" />
            {reveal && <input type="hidden" name="reveal" value="true" />}
            <input
              type="text"
              name="search"
              defaultValue={search ?? ''}
              placeholder="email substring"
              className="input input-sm min-w-64 flex-1"
            />
            <select name="reason" defaultValue={reason ?? ''} className="select select-sm">
              <option value="">Any reason</option>
              {SUPPRESSION_REASONS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
            <button type="submit" className="btn btn-sm rounded-full">
              Search
            </button>
          </form>

          <SavedViews viewKey="email.suppressions" alwaysInclude={['tab']} />

          {!supRes.ok ? (
            <Err result={supRes} />
          ) : supRes.data.suppressions.length === 0 ? (
            <Empty msg="No suppressed addresses." />
          ) : (
            <div className="bg-base-100 border-base-300 overflow-hidden rounded-box border">
              <table className="table">
                <thead className="bg-base-200">
                  <tr>
                    <th>Email</th>
                    <th>Reason</th>
                    <th>Source</th>
                    <th>Suppressed</th>
                  </tr>
                </thead>
                <tbody>
                  {supRes.data.suppressions.map((s, i) => (
                    <tr key={i}>
                      <td className="font-mono text-xs">{s.email}</td>
                      <td>
                        <span className="badge badge-error badge-sm">{s.reason}</span>
                      </td>
                      <td className="text-xs">{s.source}</td>
                      <td className="font-mono text-xs">
                        {s.suppressedAt.replace('T', ' ').slice(0, 19)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function EmailStatusBadge({ status }: { status: string }) {
  const cls =
    status === 'delivered'
      ? 'badge-success'
      : status === 'sent'
        ? 'badge-info'
        : status === 'queued'
          ? 'badge-warning'
          : status === 'bounced' || status === 'complained' || status === 'failed'
            ? 'badge-error'
            : 'badge-ghost';
  return <span className={`badge ${cls} badge-sm`}>{status}</span>;
}

function Err({ result }: { result: { ok: false; error: { code: string; message: string } } }) {
  return (
    <div role="alert" className="alert alert-error">
      <span>
        {result.error.code} — {result.error.message}
      </span>
    </div>
  );
}

function Empty({ msg }: { msg: string }) {
  return (
    <div className="bg-base-100 border-base-300 text-base-content/70 rounded-box border p-8 text-center text-sm">
      {msg}
    </div>
  );
}
