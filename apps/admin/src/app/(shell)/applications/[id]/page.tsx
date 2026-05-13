import Link from 'next/link';
import { notFound } from 'next/navigation';
import { fetchApplication } from '@/lib/work-api';

export const metadata = { title: 'Application — AgConn Admin' };
export const dynamic = 'force-dynamic';

export default async function ApplicationDetailPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;
    const result = await fetchApplication(id);
    if (!result.ok) notFound();
    const { application: a, events, screeningAnswers } = result.data;

    return (
        <div className="space-y-6">
            <div className="text-xs">
                <Link href="/applications" className="link link-hover text-base-content/60">
                    ← Back to applications
                </Link>
            </div>

            <header className="bg-base-100 border-base-300 rounded-box border p-6">
                <div className="flex items-baseline justify-between">
                    <div>
                        <p className="eyebrow text-base-content/60">Application</p>
                        <h1 className="font-serif text-xl font-medium tracking-tight">
                            <Link href={`/jobs/${a.jobId}`} className="link link-hover">
                                {a.jobTitle}
                            </Link>
                        </h1>
                        <p className="text-base-content/60 mt-1 text-sm">
                            by{' '}
                            <Link href={`/workers/${a.workerId}`} className="link link-hover">
                                {a.workerName ?? a.workerId.slice(0, 12) + '…'}
                            </Link>
                        </p>
                    </div>
                    <StatusBadge status={a.status} />
                </div>
            </header>

            <div className="grid gap-4 md:grid-cols-2">
                <Section title="Worker">
                    <KV k="Name" v={a.workerName ?? '—'} />
                    <KV k="Email" v={a.workerEmail ?? '—'} mono />
                    <KV k="Phone" v={a.workerPhone ?? '—'} mono />
                    <KV k="Language" v={a.workerLang.toUpperCase()} />
                    <KV k="County" v={a.workerCounty ?? a.countyAtApply ?? '—'} />
                </Section>
                <Section title="Timeline">
                    <KV k="Applied" v={a.appliedAt.replace('T', ' ').slice(0, 19)} mono />
                    <KV
                        k="Reviewed"
                        v={a.reviewedAt ? a.reviewedAt.replace('T', ' ').slice(0, 19) : '—'}
                        mono
                    />
                    <KV
                        k="Hired"
                        v={a.hiredAt ? a.hiredAt.replace('T', ' ').slice(0, 19) : '—'}
                        mono
                    />
                    <KV
                        k="Rejected"
                        v={a.rejectedAt ? a.rejectedAt.replace('T', ' ').slice(0, 19) : '—'}
                        mono
                    />
                    <KV k="Wage offered" v={a.wageOffered ? `$${a.wageOffered.toFixed(2)}` : '—'} mono />
                    <KV k="Start date" v={a.startDate ?? '—'} mono />
                </Section>
            </div>

            {(a.workerNote || a.employerNote || a.rejectionReason) && (
                <Section title="Notes">
                    {a.workerNote && (
                        <Note title="Worker note" body={a.workerNote} />
                    )}
                    {a.employerNote && (
                        <Note title="Employer note (private)" body={a.employerNote} />
                    )}
                    {a.rejectionReason && (
                        <Note
                            title="Rejection reason"
                            body={`${a.rejectionReason}${a.rejectionReasonText ? `\n${a.rejectionReasonText}` : ''}`}
                        />
                    )}
                </Section>
            )}

            {a.skillsAtApply.length > 0 && (
                <Section title="Skills at apply">
                    <div className="flex flex-wrap gap-1.5">
                        {a.skillsAtApply.map((s) => (
                            <span key={s} className="badge badge-ghost badge-sm">
                                {s}
                            </span>
                        ))}
                    </div>
                </Section>
            )}

            <Section title={`Screening answers (${screeningAnswers.length})`}>
                {screeningAnswers.length === 0 ? (
                    <p className="text-base-content/60 text-sm">No screening answers.</p>
                ) : (
                    <ol className="space-y-2">
                        {screeningAnswers.map((sa) => (
                            <li key={sa.id} className="border-base-200 border-b pb-2 last:border-b-0">
                                <div className="text-sm">{sa.questionEn}</div>
                                <div className="text-base-content/70 mt-0.5 font-mono text-xs">
                                    {sa.answerType === 'yes_no'
                                        ? sa.answerYes === null
                                            ? '—'
                                            : sa.answerYes
                                                ? 'Yes'
                                                : 'No'
                                        : (sa.answerText ?? '—')}
                                </div>
                            </li>
                        ))}
                    </ol>
                )}
            </Section>

            <Section title={`Events (${events.length})`}>
                {events.length === 0 ? (
                    <p className="text-base-content/60 text-sm">No events.</p>
                ) : (
                    <ol className="space-y-2">
                        {events.map((e) => (
                            <li
                                key={e.id}
                                className="border-base-200 flex items-baseline justify-between border-b pb-2 last:border-b-0"
                            >
                                <div className="font-mono text-xs">
                                    {e.fromStatus ?? '—'} → <strong>{e.toStatus}</strong>
                                    <span className="text-base-content/60 ml-2">
                                        by {e.actorRole} · {e.actorUserId.slice(0, 8)}…
                                    </span>
                                </div>
                                <span className="text-base-content/50 font-mono text-xs">
                                    {e.createdAt.replace('T', ' ').slice(0, 19)}
                                </span>
                            </li>
                        ))}
                    </ol>
                )}
            </Section>
        </div>
    );
}

function StatusBadge({ status }: { status: string }) {
    const cls =
        status === 'hired'
            ? 'badge-success'
            : status === 'rejected'
                ? 'badge-error'
                : status === 'withdrawn'
                    ? 'badge-ghost'
                    : status === 'reviewed'
                        ? 'badge-info'
                        : 'badge-warning';
    return <span className={`badge ${cls}`}>{status}</span>;
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <div className="bg-base-100 border-base-300 rounded-box border p-5">
            <h2 className="font-serif text-sm font-medium">{title}</h2>
            <div className="mt-3 text-sm">{children}</div>
        </div>
    );
}

function KV({ k, v, mono }: { k: string; v: string; mono?: boolean }) {
    return (
        <div className="border-base-200 flex justify-between border-b py-1.5 text-sm last:border-b-0">
            <span className="text-base-content/60">{k}</span>
            <span className={mono ? 'font-mono text-xs' : ''}>{v}</span>
        </div>
    );
}

function Note({ title, body }: { title: string; body: string }) {
    return (
        <div className="bg-base-200 mt-2 rounded p-3 first:mt-0">
            <div className="text-base-content/60 text-xs uppercase tracking-wide">{title}</div>
            <p className="mt-1.5 whitespace-pre-wrap text-sm leading-relaxed">{body}</p>
        </div>
    );
}
