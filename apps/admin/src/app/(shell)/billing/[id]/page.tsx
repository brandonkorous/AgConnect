import Link from 'next/link';
import { notFound } from 'next/navigation';
import { fetchBillingEvent } from '@/lib/ops-api';

export const metadata = { title: 'Billing event — AgConn Admin' };
export const dynamic = 'force-dynamic';

export default async function BillingEventDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const result = await fetchBillingEvent(id);
  if (!result.ok) notFound();
  const { event: b } = result.data;

  return (
    <div className="space-y-6">
      <div className="text-xs">
        <Link href="/billing" className="link link-hover text-base-content/60">
          ← Back to billing
        </Link>
      </div>

      <header className="bg-base-100 border-base-300 rounded-box border p-6">
        <p className="eyebrow text-base-content/60">Billing event</p>
        <h1 className="font-mono text-lg">{b.eventType}</h1>
        <p className="text-base-content/60 mt-1 text-sm">
          <Link href={`/employers/${b.employerId}`} className="link link-hover">
            {b.employerName}
          </Link>
        </p>
      </header>

      <div className="grid gap-4 md:grid-cols-2">
        <Section title="Identity">
          <KV k="Stripe event id" v={b.stripeEventId} mono />
          <KV k="Internal id" v={b.id} mono />
          <KV k="Tenant" v={b.tenantId} mono />
        </Section>
        <Section title="Processing">
          <KV k="Created" v={b.createdAt.replace('T', ' ').slice(0, 19)} mono />
          <KV
            k="Processed"
            v={b.processedAt ? b.processedAt.replace('T', ' ').slice(0, 19) : 'Not processed'}
            mono
          />
          {b.errorMsg && (
            <div className="bg-error/10 text-error mt-2 rounded p-3 text-xs">
              {b.errorMsg}
            </div>
          )}
        </Section>
      </div>

      <Section title="Payload">
        <pre className="bg-base-200 overflow-auto rounded p-3 text-[11px] leading-relaxed">
          {JSON.stringify(b.payload, null, 2)}
        </pre>
      </Section>

      <p className="text-base-content/50 text-xs">
        View this event in Stripe:{' '}
        <a
          href={`https://dashboard.stripe.com/events/${b.stripeEventId}`}
          target="_blank"
          rel="noopener noreferrer"
          className="link link-hover font-mono"
        >
          dashboard.stripe.com/events/{b.stripeEventId} →
        </a>
      </p>
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
      <span className={mono ? 'font-mono text-xs break-all text-right' : ''}>{v}</span>
    </div>
  );
}
