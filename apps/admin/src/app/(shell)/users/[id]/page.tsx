import Link from 'next/link';
import { notFound } from 'next/navigation';
import { fetchUser } from '@/lib/directory-api';

export const metadata = { title: 'User — AGCONN Admin' };
export const dynamic = 'force-dynamic';

export default async function UserDetailPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;
    const result = await fetchUser(id);
    if (!result.ok) notFound();
    const { user: u, counts } = result.data;

    return (
        <div className="space-y-6">
            <div className="text-xs">
                <Link href="/users" className="link link-hover text-base-content/60">
                    ← Back to users
                </Link>
            </div>

            <header className="bg-base-100 border-base-300 rounded-box border p-6">
                <p className="eyebrow text-base-content/60">User · {u.role}</p>
                <h1 className="font-serif text-xl font-medium tracking-tight">
                    {u.workerProfile
                        ? `${u.workerProfile.firstName} ${u.workerProfile.lastName}`
                        : (u.employerProfile?.legalName ?? u.email ?? u.id)}
                </h1>
                <p className="text-base-content/50 mt-1 font-mono text-xs">{u.id}</p>
            </header>

            <div className="grid gap-4 md:grid-cols-2">
                <Section title="Identity">
                    <KV k="Role" v={u.role} />
                    <KV k="Tenant" v={u.tenantName ? `${u.tenantName}` : '—'} />
                    <KV k="Email" v={u.email ?? '—'} mono />
                    <KV k="Phone" v={u.phone ?? '—'} mono />
                    <KV k="Language" v={u.preferredLang.toUpperCase()} />
                    <KV k="Onboarded" v={u.onboarded ? 'Yes' : 'No'} />
                </Section>
                <Section title="Consent + SMS">
                    <KV k="Consent method" v={u.consentMethod ?? '—'} />
                    <KV k="Consented at" v={u.consentedAt ?? '—'} mono />
                    <KV k="SMS opt-in" v={u.smsOptInState ?? '—'} />
                </Section>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
                <Tile label="Applications" value={counts.applications} />
                <Tile label="Enrollments" value={counts.enrollments} />
            </div>

            {u.workerProfile && (
                <Section title="Worker profile">
                    <KV
                        k="Name"
                        v={`${u.workerProfile.firstName} ${u.workerProfile.lastName}`}
                    />
                    <KV k="County" v={u.workerProfile.county ?? '—'} />
                    <KV k="Onboarded at" v={u.workerProfile.onboardedAt ?? '—'} mono />
                    <div className="mt-3 text-xs">
                        <Link href={`/workers/${u.id}`} className="link link-hover">
                            Full worker view →
                        </Link>
                    </div>
                </Section>
            )}

            {u.employerProfile && (
                <Section title="Employer profile">
                    <KV k="Legal name" v={u.employerProfile.legalName} />
                    <KV k="License type" v={u.employerProfile.licenseType ?? '—'} />
                    <KV k="Verified" v={u.employerProfile.verified ? 'Yes' : 'No'} />
                    <div className="mt-3 text-xs">
                        <Link
                            href={`/employers/${u.employerProfile.id}`}
                            className="link link-hover"
                        >
                            Full employer view →
                        </Link>
                    </div>
                </Section>
            )}

            {u.permissions.length > 0 && (
                <Section title="Permissions">
                    <div className="flex flex-wrap gap-1.5">
                        {u.permissions.map((p) => (
                            <span key={p} className="badge badge-ghost badge-sm font-mono">
                                {p}
                            </span>
                        ))}
                    </div>
                </Section>
            )}
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
