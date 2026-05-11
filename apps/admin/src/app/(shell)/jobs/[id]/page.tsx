import Link from 'next/link';
import { notFound } from 'next/navigation';
import { fetchJob } from '@/lib/work-api';

export const metadata = { title: 'Job — AgConn Admin' };
export const dynamic = 'force-dynamic';

export default async function JobDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const result = await fetchJob(id);
  if (!result.ok) notFound();
  const { job: j, applicationCount, screeningQuestions, renotifications } = result.data;

  return (
    <div className="space-y-6">
      <div className="text-xs">
        <Link href="/jobs" className="link link-hover text-base-content/60">
          ← Back to jobs
        </Link>
      </div>

      <header className="bg-base-100 border-base-300 rounded-box border p-6">
        <div className="flex items-baseline justify-between">
          <div>
            <p className="eyebrow text-base-content/60">Job</p>
            <h1 className="font-serif text-2xl font-medium tracking-tight">{j.titleEn}</h1>
            <p className="text-base-content/60 mt-1 text-sm">
              <Link href={`/employers/${j.employerId}`} className="link link-hover">
                {j.employerName}
              </Link>{' '}
              · {j.county}
              {j.city ? ` · ${j.city}` : ''}
            </p>
          </div>
          <StatusBadge status={j.status} />
        </div>
      </header>

      <div className="grid gap-4 md:grid-cols-3">
        <Tile label="Positions" value={`${j.hireCount}/${j.positionsTotal}`} />
        <Tile label="Applications" value={applicationCount.toString()} />
        <Tile
          label="Wage"
          value={`$${j.wageMin.toFixed(2)}${j.wageMin !== j.wageMax ? `–${j.wageMax.toFixed(2)}` : ''}/${j.wageUnit}`}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Section title="Schedule">
          <KV k="Start" v={j.startDate} mono />
          <KV k="End" v={j.endDate ?? '—'} mono />
          <KV k="Apply by" v={j.applyBy ?? '—'} mono />
          <KV k="Published" v={j.publishedAt ?? '—'} mono />
          <KV k="Filled" v={j.filledAt ?? '—'} mono />
          <KV k="Closed" v={j.closedAt ?? '—'} mono />
        </Section>
        <Section title="Logistics">
          <KV k="Zip" v={j.zipCode ?? '—'} mono />
          <KV k="Housing" v={j.housing ? 'Yes' : 'No'} />
          <KV k="Transport" v={j.transport ? 'Yes' : 'No'} />
          <KV k="SEO slug" v={j.seoSlug ?? '—'} mono />
        </Section>
      </div>

      {j.skills.length > 0 && (
        <Section title="Skills">
          <div className="flex flex-wrap gap-1.5">
            {j.skills.map((s) => (
              <span key={s} className="badge badge-ghost badge-sm">
                {s}
              </span>
            ))}
          </div>
        </Section>
      )}

      <Section title={`Screening questions (${screeningQuestions.length})`}>
        {screeningQuestions.length === 0 ? (
          <p className="text-base-content/60 text-sm">No screening questions.</p>
        ) : (
          <ol className="space-y-2">
            {screeningQuestions.map((q) => (
              <li key={q.id} className="border-base-200 border-b pb-2 last:border-b-0">
                <div className="flex items-baseline justify-between text-sm">
                  <span>{q.questionEn}</span>
                  <span className="text-base-content/60 font-mono text-[11px]">
                    {q.answerType}
                    {q.required ? ' · required' : ''}
                  </span>
                </div>
                <div className="text-base-content/60 mt-0.5 text-xs italic">{q.questionEs}</div>
              </li>
            ))}
          </ol>
        )}
      </Section>

      <Section title={`Renotifications (${renotifications.length})`}>
        {renotifications.length === 0 ? (
          <p className="text-base-content/60 text-sm">No renotification events.</p>
        ) : (
          <table className="table-sm table">
            <thead>
              <tr>
                <th>Channel</th>
                <th>Status</th>
                <th>Sent</th>
                <th>Error</th>
              </tr>
            </thead>
            <tbody>
              {renotifications.map((r) => (
                <tr key={r.id}>
                  <td className="text-xs">{r.channel}</td>
                  <td>
                    <span className="badge badge-ghost badge-sm">{r.status}</span>
                  </td>
                  <td className="font-mono text-xs">
                    {r.sentAt ? r.sentAt.replace('T', ' ').slice(0, 19) : '—'}
                  </td>
                  <td className="text-base-content/70 text-xs">{r.error ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Section>

      <Section title="Description (EN)">
        <p className="text-base-content/80 whitespace-pre-wrap text-sm leading-relaxed">
          {j.descriptionEn}
        </p>
      </Section>
      <Section title="Description (ES)">
        <p className="text-base-content/80 whitespace-pre-wrap text-sm leading-relaxed italic">
          {j.descriptionEs}
        </p>
      </Section>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const cls =
    status === 'active'
      ? 'badge-success'
      : status === 'filled'
        ? 'badge-info'
        : status === 'closed'
          ? 'badge-ghost'
          : 'badge-warning';
  return <span className={`badge ${cls}`}>{status}</span>;
}

function Tile({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-base-100 border-base-300 rounded-box border p-5">
      <div className="text-base-content/60 text-xs uppercase tracking-wide">{label}</div>
      <div className="mt-2 font-serif text-2xl tabular-nums">{value}</div>
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

function KV({ k, v, mono }: { k: string; v: string; mono?: boolean }) {
  return (
    <div className="border-base-200 flex justify-between border-b py-1.5 text-sm last:border-b-0">
      <span className="text-base-content/60">{k}</span>
      <span className={mono ? 'font-mono text-xs' : ''}>{v}</span>
    </div>
  );
}
