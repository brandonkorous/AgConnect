import Link from 'next/link';
import { notFound } from 'next/navigation';
import { fetchEmployer } from '@/lib/directory-api';

export const metadata = { title: 'Employer — AgConn Admin' };
export const dynamic = 'force-dynamic';

export default async function EmployerDetailPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;
    const result = await fetchEmployer(id);
    if (!result.ok) notFound();
    const { employer: e, counts, verificationLog } = result.data;

    return (
        <div className="space-y-6">
            <div className="text-xs">
                <Link href="/employers" className="link link-hover text-base-content/60">
                    ← Back to employers
                </Link>
            </div>

            <header className="bg-base-100 border-base-300 rounded-box border p-6">
                <div className="flex items-baseline justify-between">
                    <div>
                        <p className="eyebrow text-base-content/60">Employer</p>
                        <h1 className="font-serif text-2xl font-medium tracking-tight">
                            {e.legalName}
                        </h1>
                        {e.dbaName && (
                            <p className="text-base-content/60 mt-0.5 text-sm">DBA: {e.dbaName}</p>
                        )}
                    </div>
                    <div className="text-right">
                        <StatusBadge
                            verified={e.flcVerifiedAt !== null}
                            rejected={e.rejectedAt !== null}
                        />
                        {e.plan && (
                            <div className="text-base-content/60 mt-2 text-xs">Plan: {e.plan}</div>
                        )}
                    </div>
                </div>
            </header>

            <div className="grid gap-4 md:grid-cols-3">
                <Tile label="Postings" value={counts.postings} />
                <Tile label="Applications" value={counts.applications} />
                <Tile label="Hires" value={counts.hires} />
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
                <Section title="Identity">
                    <KV k="Tenant" v={`${e.tenantName} (${e.tenantId.slice(0, 8)}…)`} />
                    <KV k="License type" v={e.licenseType ?? '—'} />
                    <KV k="FLC license #" v={e.flcLicenseNum ?? '—'} mono />
                    <KV k="DOL MSPA #" v={e.dolMspaNum ?? '—'} mono />
                    <KV k="EIN" v={e.ein ?? '—'} mono />
                    <KV k="County" v={e.county ?? '—'} />
                </Section>
                <Section title="Contact">
                    <KV k="Email" v={e.contactEmail ?? '—'} mono />
                    <KV k="Phone" v={e.contactPhone ?? '—'} mono />
                    <KV k="Street" v={e.streetAddress ?? '—'} />
                    <KV k="City" v={e.city ?? '—'} />
                </Section>
            </div>

            <Section title="Verification log">
                {verificationLog.length === 0 ? (
                    <p className="text-base-content/60 text-sm">No verification events yet.</p>
                ) : (
                    <ol className="space-y-2">
                        {verificationLog.map((l) => (
                            <li
                                key={l.id}
                                className="border-base-200 flex items-baseline justify-between border-b pb-2 last:border-b-0"
                            >
                                <div>
                                    <div className="font-mono text-xs">{l.action}</div>
                                    {l.notes && (
                                        <div className="text-base-content/70 mt-0.5 text-xs">{l.notes}</div>
                                    )}
                                </div>
                                <div className="text-base-content/50 font-mono text-xs">
                                    {l.createdAt.replace('T', ' ').slice(0, 19)}
                                    {l.actorUserId && <span className="ml-2">· {l.actorUserId.slice(0, 8)}…</span>}
                                </div>
                            </li>
                        ))}
                    </ol>
                )}
            </Section>
        </div>
    );
}

function StatusBadge({ verified, rejected }: { verified: boolean; rejected: boolean }) {
    if (verified) return <span className="badge badge-success">Verified</span>;
    if (rejected) return <span className="badge badge-error">Rejected</span>;
    return <span className="badge badge-warning">Pending</span>;
}

function Tile({ label, value }: { label: string; value: number }) {
    return (
        <div className="bg-base-100 border-base-300 rounded-box border p-5">
            <div className="text-base-content/60 text-xs uppercase tracking-wide">{label}</div>
            <div className="mt-2 font-serif text-3xl tabular-nums">{value.toLocaleString('en-US')}</div>
        </div>
    );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <div className="bg-base-100 border-base-300 rounded-box border p-5">
            <h2 className="font-serif text-sm font-medium">{title}</h2>
            <div className="mt-3 space-y-1.5 text-sm">{children}</div>
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
