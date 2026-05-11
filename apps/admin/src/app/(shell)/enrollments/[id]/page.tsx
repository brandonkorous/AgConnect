import Link from 'next/link';
import { notFound } from 'next/navigation';
import { fetchEnrollment } from '@/lib/work-api';

export const metadata = { title: 'Enrollment — AgConn Admin' };
export const dynamic = 'force-dynamic';

export default async function EnrollmentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const result = await fetchEnrollment(id);
  if (!result.ok) notFound();
  const { enrollment: e, program, worker } = result.data;

  return (
    <div className="space-y-6">
      <div className="text-xs">
        <Link href="/enrollments" className="link link-hover text-base-content/60">
          ← Back to enrollments
        </Link>
      </div>

      <header className="bg-base-100 border-base-300 rounded-box border p-6">
        <div className="flex items-baseline justify-between">
          <div>
            <p className="eyebrow text-base-content/60">Enrollment</p>
            <h1 className="font-serif text-xl font-medium tracking-tight">
              {program.titleEn}
            </h1>
            <p className="text-base-content/60 mt-1 text-sm">
              <Link href={`/workers/${worker.id}`} className="link link-hover">
                {worker.firstName && worker.lastName
                  ? `${worker.firstName} ${worker.lastName}`
                  : worker.id.slice(0, 18) + '…'}
              </Link>{' '}
              · {program.funder} · {program.county}
            </p>
          </div>
          <StatusBadge status={e.status} noShow={e.noShow} />
        </div>
      </header>

      <div className="grid gap-4 lg:grid-cols-2">
        <Section title="Enrollment">
          <KV k="Status" v={e.status} />
          <KV k="No-show" v={e.noShow ? 'Yes' : 'No'} />
          <KV k="Enrolled" v={e.enrolledAt.replace('T', ' ').slice(0, 19)} mono />
          <KV
            k="Completed"
            v={e.completedAt ? e.completedAt.replace('T', ' ').slice(0, 19) : '—'}
            mono
          />
          <KV
            k="Dropped"
            v={e.droppedAt ? e.droppedAt.replace('T', ' ').slice(0, 19) : '—'}
            mono
          />
          <KV k="Reminder 48h" v={e.reminderSent48h ? 'Sent' : '—'} />
          <KV k="Reminder 2h" v={e.reminderSent2h ? 'Sent' : '—'} />
        </Section>
        <Section title="Certificate">
          <KV k="Issued" v={e.certificateId ? 'Yes' : 'No'} />
          <KV k="Cert ID" v={e.certificateId ?? '—'} mono />
          <KV
            k="Generated"
            v={e.certGeneratedAt ? e.certGeneratedAt.replace('T', ' ').slice(0, 19) : '—'}
            mono
          />
          <KV k="Cert name" v={program.certName ?? '—'} />
          {e.certUrl && (
            <div className="mt-2">
              <a
                href={e.certUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="link link-hover text-xs"
              >
                View certificate →
              </a>
            </div>
          )}
        </Section>
      </div>

      <Section title="Program">
        <KV k="Title" v={program.titleEn} />
        <KV k="Funder" v={program.funder} />
        <KV k="County" v={program.county} />
        <KV k="Location" v={program.locationName} />
        <KV k="Start" v={program.startDate} mono />
        <KV k="End" v={program.endDate} mono />
      </Section>

      <Section title="Worker">
        <KV
          k="Name"
          v={
            worker.firstName && worker.lastName
              ? `${worker.firstName} ${worker.lastName}`
              : '—'
          }
        />
        <KV k="Email" v={worker.email ?? '—'} mono />
        <KV k="Phone" v={worker.phone ?? '—'} mono />
        <KV k="Language" v={worker.preferredLang.toUpperCase()} />
        <KV k="County" v={worker.county ?? '—'} />
      </Section>
    </div>
  );
}

function StatusBadge({ status, noShow }: { status: string; noShow: boolean }) {
  if (noShow) return <span className="badge badge-error">no-show</span>;
  const cls =
    status === 'completed'
      ? 'badge-success'
      : status === 'dropped'
        ? 'badge-ghost'
        : 'badge-info';
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
