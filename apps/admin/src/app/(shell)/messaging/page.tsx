import Link from 'next/link';
import { fetchConversations, fetchKeywords } from '@/lib/ops-api';

export const metadata = { title: 'Messaging — AgConn Admin' };
export const dynamic = 'force-dynamic';

type SearchParams = Record<string, string | string[] | undefined>;

export default async function MessagingPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;
  const tab = sp['tab'] === 'keywords' ? 'keywords' : 'conversations';
  const search = typeof sp['search'] === 'string' ? sp['search'] : undefined;
  const channel = typeof sp['channel'] === 'string' ? sp['channel'] : undefined;
  const active = sp['active'] === 'false' ? 'false' : sp['active'] === 'true' ? 'true' : undefined;

  const [convRes, kwRes] = await Promise.all([
    tab === 'conversations' ? fetchConversations({ search, channel }) : null,
    tab === 'keywords' ? fetchKeywords({ active }) : null,
  ]);

  return (
    <div className="space-y-4">
      <div>
        <p className="eyebrow text-base-content/60">Platform</p>
        <h1 className="font-serif text-2xl font-medium tracking-tight">Messaging</h1>
        <p className="text-base-content/70 mt-1 max-w-2xl text-sm">
          In-app + SMS conversations are PII-redacted by default. Reveal logs an audit event.
        </p>
      </div>

      <div role="tablist" className="tabs tabs-border">
        <Link
          href="/messaging?tab=conversations"
          role="tab"
          className={`tab ${tab === 'conversations' ? 'tab-active' : ''}`}
        >
          Conversations
        </Link>
        <Link
          href="/messaging?tab=keywords"
          role="tab"
          className={`tab ${tab === 'keywords' ? 'tab-active' : ''}`}
        >
          SMS keywords
        </Link>
      </div>

      {tab === 'conversations' && convRes && (
        <>
          <form className="bg-base-100 border-base-300 rounded-box flex flex-wrap gap-3 border p-3">
            <input type="hidden" name="tab" value="conversations" />
            <input
              type="text"
              name="search"
              defaultValue={search ?? ''}
              placeholder="title substring"
              className="input input-sm min-w-64 flex-1"
            />
            <select name="channel" defaultValue={channel ?? ''} className="select select-sm">
              <option value="">Any channel</option>
              <option value="app">App</option>
              <option value="sms">SMS</option>
            </select>
            <button type="submit" className="btn btn-sm rounded-full">
              Search
            </button>
            {(search || channel) && (
              <Link href="/messaging?tab=conversations" className="btn btn-ghost btn-sm">
                Reset
              </Link>
            )}
          </form>

          {!convRes.ok ? (
            <Err result={convRes} />
          ) : convRes.data.conversations.length === 0 ? (
            <Empty msg="No conversations match." />
          ) : (
            <div className="bg-base-100 border-base-300 overflow-hidden rounded-box border">
              <table className="table">
                <thead className="bg-base-200">
                  <tr>
                    <th>Title</th>
                    <th>Channel</th>
                    <th className="text-right">Participants</th>
                    <th className="text-right">Messages</th>
                    <th>Last message</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {convRes.data.conversations.map((c) => (
                    <tr key={c.id}>
                      <td className="text-sm">{c.title}</td>
                      <td>
                        <span className="badge badge-ghost badge-sm">{c.channel}</span>
                        {c.isGroup && <span className="badge badge-info badge-sm ml-1">group</span>}
                      </td>
                      <td className="text-right font-mono text-xs tabular-nums">
                        {c.participantCount}
                      </td>
                      <td className="text-right font-mono text-xs tabular-nums">
                        {c.messageCount}
                      </td>
                      <td className="font-mono text-xs">
                        {c.lastMessageAt ? c.lastMessageAt.replace('T', ' ').slice(0, 19) : '—'}
                      </td>
                      <td className="text-right">
                        <Link
                          href={`/messaging/${c.id}`}
                          className="link link-hover text-xs"
                        >
                          Open →
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {tab === 'keywords' && kwRes && (
        <>
          <form className="bg-base-100 border-base-300 rounded-box flex flex-wrap gap-3 border p-3">
            <input type="hidden" name="tab" value="keywords" />
            <select name="active" defaultValue={active ?? ''} className="select select-sm">
              <option value="">Active + inactive</option>
              <option value="true">Active only</option>
              <option value="false">Inactive only</option>
            </select>
            <button type="submit" className="btn btn-sm rounded-full">
              Filter
            </button>
            {active && (
              <Link href="/messaging?tab=keywords" className="btn btn-ghost btn-sm">
                Reset
              </Link>
            )}
          </form>

          {!kwRes.ok ? (
            <Err result={kwRes} />
          ) : kwRes.data.keywords.length === 0 ? (
            <Empty msg="No keywords configured." />
          ) : (
            <div className="bg-base-100 border-base-300 overflow-hidden rounded-box border">
              <table className="table">
                <thead className="bg-base-200">
                  <tr>
                    <th>Keyword</th>
                    <th>Kind</th>
                    <th>Entity</th>
                    <th>Active</th>
                    <th>Last used</th>
                    <th>Created</th>
                  </tr>
                </thead>
                <tbody>
                  {kwRes.data.keywords.map((k) => (
                    <tr key={k.id}>
                      <td className="font-mono text-sm">{k.keyword}</td>
                      <td className="text-xs">{k.kind}</td>
                      <td className="font-mono text-[11px]">{k.entityId.slice(0, 8)}…</td>
                      <td>
                        {k.active ? (
                          <span className="badge badge-success badge-sm">active</span>
                        ) : (
                          <span className="badge badge-ghost badge-sm">off</span>
                        )}
                      </td>
                      <td className="font-mono text-xs">
                        {k.lastUsedAt ? k.lastUsedAt.replace('T', ' ').slice(0, 19) : '—'}
                      </td>
                      <td className="font-mono text-xs">{k.createdAt.slice(0, 10)}</td>
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
