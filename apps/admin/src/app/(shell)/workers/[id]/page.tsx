import Link from 'next/link';
import { notFound } from 'next/navigation';
import { fetchWorker } from '@/lib/directory-api';

export const metadata = { title: 'Worker — AGCONN Admin' };
export const dynamic = 'force-dynamic';

export default async function WorkerDetailPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;
    const result = await fetchWorker(id);
    if (!result.ok) notFound();
    const { worker: w, certCount, applications, enrollments } = result.data;
    const fullName = w.profile
        ? `${w.profile.firstName} ${w.profile.lastName}`
        : (w.email ?? w.id);

    return (
        <div className="space-y-6">
            <div className="text-xs">
                <Link href="/workers" className="link link-hover text-base-content/60">
                    ← Back to workers
                </Link>
            </div>

            <header className="bg-base-100 border-base-300 rounded-box border p-6">
                <p className="eyebrow text-base-content/60">Worker</p>
                <h1 className="font-serif text-2xl font-medium tracking-tight">{fullName}</h1>
                <p className="text-base-content/50 mt-1 font-mono text-xs">{w.id}</p>
            </header>

            <div className="grid gap-4 md:grid-cols-3">
                <Tile label="Applications" value={applications.length} />
                <Tile label="Enrollments" value={enrollments.length} />
                <Tile label="Certificates" value={certCount} />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
                <Section title="Identity">
                    <KV k="Email" v={w.email ?? '—'} mono />
                    <KV k="Phone" v={w.phone ?? '—'} mono />
                    <KV k="Language" v={w.preferredLang.toUpperCase()} />
                    <KV k="Onboarded" v={w.onboarded ? 'Yes' : 'No'} />
                    <KV k="Created" v={w.createdAt.slice(0, 10)} mono />
                </Section>
                <Section title="Consent + SMS">
                    <KV k="Consent method" v={w.consentMethod ?? '—'} />
                    <KV k="Consented at" v={w.consentedAt ?? '—'} mono />
                    <KV k="SMS opt-in" v={w.smsOptInState ?? '—'} />
                </Section>
            </div>

            {w.profile && (
                <Section title="Profile">
                    <KV
                        k="Location"
                        v={
                            w.profile.county
                                ? `${w.profile.county}${w.profile.zipCode ? ` · ${w.profile.zipCode}` : ''}`
                                : '—'
                        }
                    />
                    <KV k="Onboarded at" v={w.profile.onboardedAt ?? '—'} mono />
                    <div className="mt-2">
                        <div className="text-base-content/60 text-xs uppercase tracking-wide">Skills</div>
                        <div className="mt-1.5 flex flex-wrap gap-1">
                            {w.profile.skills.length === 0 ? (
                                <span className="text-base-content/40 text-xs">none</span>
                            ) : (
                                w.profile.skills.map((s) => (
                                    <span key={s} className="badge badge-ghost badge-sm">
                                        {s}
                                    </span>
                                ))
                            )}
                        </div>
                    </div>
                </Section>
            )}

            <Section title="Recent applications">
                {applications.length === 0 ? (
                    <p className="text-base-content/60 text-sm">No applications.</p>
                ) : (
                    <table className="table-sm table">
                        <thead>
                            <tr>
                                <th>Job</th>
                                <th>Status</th>
                                <th>Applied</th>
                                <th>Hired</th>
                                <th>Wage</th>
                            </tr>
                        </thead>
                        <tbody>
                            {applications.map((a) => (
                                <tr key={a.id}>
                                    <td className="text-xs">{a.jobTitle}</td>
                                    <td>
                                        <span className="badge badge-ghost badge-sm">{a.status}</span>
                                    </td>
                                    <td className="font-mono text-xs">{a.appliedAt.slice(0, 10)}</td>
                                    <td className="font-mono text-xs">
                                        {a.hiredAt ? a.hiredAt.slice(0, 10) : '—'}
                                    </td>
                                    <td className="font-mono text-xs">
                                        {a.wageOffered ? `$${a.wageOffered.toFixed(2)}` : '—'}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </Section>

            <Section title="Recent enrollments">
                {enrollments.length === 0 ? (
                    <p className="text-base-content/60 text-sm">No enrollments.</p>
                ) : (
                    <table className="table-sm table">
                        <thead>
                            <tr>
                                <th>Program</th>
                                <th>Funder</th>
                                <th>County</th>
                                <th>Status</th>
                                <th>Enrolled</th>
                                <th>Completed</th>
                                <th>Cert</th>
                            </tr>
                        </thead>
                        <tbody>
                            {enrollments.map((e) => (
                                <tr key={e.id}>
                                    <td className="text-xs">{e.programTitle}</td>
                                    <td className="text-xs">{e.funder}</td>
                                    <td className="text-xs">{e.county}</td>
                                    <td>
                                        <span className="badge badge-ghost badge-sm">{e.status}</span>
                                    </td>
                                    <td className="font-mono text-xs">{e.enrolledAt.slice(0, 10)}</td>
                                    <td className="font-mono text-xs">
                                        {e.completedAt ? e.completedAt.slice(0, 10) : '—'}
                                    </td>
                                    <td className="font-mono text-xs">
                                        {e.certificateId ? e.certificateId.slice(0, 8) + '…' : '—'}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </Section>
        </div>
    );
}

function Tile({ label, value }: { label: string; value: number }) {
    return (
        <div className="bg-base-100 border-base-300 rounded-box border p-5">
            <div className="text-base-content/60 text-xs uppercase tracking-wide">{label}</div>
            <div className="mt-2 font-serif text-2xl tabular-nums">
                {value.toLocaleString('en-US')}
            </div>
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
