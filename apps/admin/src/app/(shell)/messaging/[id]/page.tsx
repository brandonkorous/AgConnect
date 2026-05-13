import Link from 'next/link';
import { notFound } from 'next/navigation';
import { fetchConversation } from '@/lib/ops-api';

export const metadata = { title: 'Conversation — AgConn Admin' };
export const dynamic = 'force-dynamic';

export default async function ConversationDetailPage({
    params,
    searchParams,
}: {
    params: Promise<{ id: string }>;
    searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
    const { id } = await params;
    const sp = await searchParams;
    const reveal = sp['reveal'] === 'true';
    const result = await fetchConversation(id, reveal);
    if (!result.ok) notFound();
    const { conversation: c, participants, messages } = result.data;

    return (
        <div className="space-y-6">
            <div className="text-xs">
                <Link href="/messaging" className="link link-hover text-base-content/60">
                    ← Back to messaging
                </Link>
            </div>

            <header className="bg-base-100 border-base-300 rounded-box border p-6">
                <div className="flex items-baseline justify-between">
                    <div>
                        <p className="eyebrow text-base-content/60">Conversation</p>
                        <h1 className="font-serif text-xl font-medium tracking-tight">{c.title}</h1>
                        <p className="text-base-content/60 mt-1 text-sm">
                            <span className="badge badge-ghost badge-sm">{c.channel}</span>
                            {c.isGroup && <span className="badge badge-info badge-sm ml-1">group</span>}{' '}
                            · created {c.createdAt.replace('T', ' ').slice(0, 19)}
                        </p>
                    </div>
                    <Link
                        href={`/messaging/${c.id}?reveal=${reveal ? '' : 'true'}`}
                        className={`btn btn-sm rounded-full ${reveal ? 'btn-warning' : 'btn-ghost'}`}
                    >
                        {reveal ? 'Hide PII' : 'Reveal PII (logs audit)'}
                    </Link>
                </div>
            </header>

            <Section title={`Participants (${participants.length})`}>
                <table className="table-sm table">
                    <thead>
                        <tr>
                            <th>Role</th>
                            <th>User</th>
                            <th>Email</th>
                            <th>Phone</th>
                        </tr>
                    </thead>
                    <tbody>
                        {participants.map((p) => (
                            <tr key={p.id}>
                                <td>
                                    <span className="badge badge-ghost badge-sm">{p.role}</span>
                                </td>
                                <td className="font-mono text-xs">
                                    <Link href={`/users/${p.userId}`} className="link link-hover">
                                        {p.userId.slice(0, 18)}…
                                    </Link>
                                </td>
                                <td className="font-mono text-xs">{p.email ?? '—'}</td>
                                <td className="font-mono text-xs">{p.phone ?? '—'}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </Section>

            <Section title={`Messages (${messages.length})`}>
                {messages.length === 0 ? (
                    <p className="text-base-content/60 text-sm">No messages yet.</p>
                ) : (
                    <ol className="space-y-2">
                        {messages.map((m) => (
                            <li key={m.id} className="border-base-200 border-b pb-2 last:border-b-0">
                                <div className="flex items-baseline justify-between">
                                    <span className="text-base-content/60 font-mono text-xs">
                                        {m.direction} · {m.channel}
                                        <span className="ml-2">{m.senderUserId.slice(0, 12)}…</span>
                                    </span>
                                    <span className="text-base-content/50 font-mono text-xs">
                                        {m.createdAt.replace('T', ' ').slice(0, 19)}
                                    </span>
                                </div>
                                <p
                                    className={`mt-1 text-sm leading-relaxed ${reveal ? '' : 'text-base-content/40 italic'}`}
                                >
                                    {m.body}
                                </p>
                            </li>
                        ))}
                    </ol>
                )}
            </Section>
        </div>
    );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <div className="bg-base-100 border-base-300 rounded-box border p-5">
            <h2 className="font-serif text-sm font-medium">{title}</h2>
            <div className="mt-3 text-sm">{children}</div>
        </div>
    );
}
