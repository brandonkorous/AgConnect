import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { getEmployerProfile } from '@/lib/api/employer';
import {
  listComplianceCategories,
  listComplianceActions,
} from '@/lib/api/employer-ops';
import { PrintTrigger } from '@/components/employer/compliance/PrintTrigger';

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'employer.compliance.audit' });
  return { title: `AgConn — ${t('title')}` };
}

export default async function ComplianceAuditPage({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'employer.compliance.audit' });

  const [profile, cats, actions] = await Promise.all([
    getEmployerProfile(),
    listComplianceCategories(),
    listComplianceActions(),
  ]);
  if (!profile) notFound();

  const overall = Math.round(
    cats.reduce((sum, c) => sum + c.score, 0) / Math.max(1, cats.length),
  );
  const today = new Date();
  const generatedDate = today.toLocaleDateString(locale === 'es' ? 'es-MX' : 'en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  const docId = buildDocId(profile.id ?? profile.legalName, today);

  const statusLabel = (s: 'ok' | 'warn' | 'fail') => {
    if (s === 'ok') return t('legend_ok');
    if (s === 'warn') return t('legend_warn');
    return t('legend_fail');
  };

  return (
    <div className="bg-white text-black min-h-screen">
      {/* On-screen toolbar — hidden when printing. */}
      <div className="screen-only mx-auto flex max-w-[7in] items-center justify-between px-6 pb-4 pt-6">
        <a
          href={`/${locale}/employer/compliance`}
          className="text-base-content/60 hover:text-base-content text-sm"
        >
          ← {t('back')}
        </a>
        <PrintTrigger label={t('print_button')} />
      </div>

      <article className="doc-binder mx-auto max-w-[7in] px-[0.5in] pb-[0.75in] pt-[0.5in] print:max-w-none print:px-0 print:pt-0 print:pb-0">

        {/* ─────────────────── Letterhead-style header */}
        <header>
          <div className="flex items-end justify-between border-b border-black pb-3">
            <span className="font-serif text-[26pt] font-semibold leading-none tracking-tight text-black">
              AG<span style={{ opacity: 0.5 }}>CONN</span>
            </span>
            <span className="meta text-right">
              <span className="block">{t('letterhead_dept')}</span>
              <span className="block">DOC {docId}</span>
            </span>
          </div>
          <h1 className="mt-5 text-[22pt] font-semibold leading-tight">
            {t('title')}
          </h1>
          <div className="meta mt-1">{t('subtitle')}</div>

          <div className="mt-5 border-t border-black pt-3">
            <Field label={t('employer')} value={profile.legalName} />
            <Field
              label={t('generated')}
              value={generatedDate}
              valueMono
            />
            <Field
              label={t('overall_score')}
              value={`${overall}%`}
            />
            <Field
              label={t('actions_due')}
              value={String(actions.length)}
            />
          </div>
        </header>

        {/* ─────────────────── §1 Summary */}
        <Section number={1} heading={t('summary_heading')}>
          <p className="mt-2">
            {t('summary_body', {
              employer: profile.legalName,
              score: overall,
              actions: actions.length,
            })}
          </p>
          <p className="mt-3">
            <span className="font-semibold">{t('legend_heading')}: </span>
            <span>{t('legend_ok')}</span>
            <span className="meta"> · </span>
            <span>{t('legend_warn')}</span>
            <span className="meta"> · </span>
            <span>{t('legend_fail')}</span>
          </p>
        </Section>

        {/* ─────────────────── Category sections (§2 onwards) */}
        {cats.map((c, idx) => (
          <Section key={c.key} number={idx + 2} heading={c.label}>
            <div className="mt-1 flex items-baseline justify-between">
              <div className="meta">
                {t('category_score', { score: c.score })}
              </div>
            </div>
            <table className="mt-3">
              <thead>
                <tr>
                  <th style={{ width: '22%' }}>{t('col_status')}</th>
                  <th style={{ width: '32%' }}>{t('col_item')}</th>
                  <th>{t('col_details')}</th>
                  <th style={{ width: '14%' }}>{t('col_due')}</th>
                </tr>
              </thead>
              <tbody>
                {c.items.map((it) => (
                  <tr key={it.key}>
                    <td>{statusLabel(it.status)}</td>
                    <td className="font-semibold">{it.label}</td>
                    <td>{it.details || '—'}</td>
                    <td className="meta">
                      {it.dueAt
                        ? new Date(it.dueAt).toLocaleDateString(
                            locale === 'es' ? 'es-MX' : 'en-US',
                            { month: 'short', day: 'numeric', year: 'numeric' },
                          )
                        : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Section>
        ))}

        {/* ─────────────────── Signature block */}
        <Section number={cats.length + 2} heading={t('signature_heading')}>
          <p className="mt-2">{t('signature_body', { employer: profile.legalName })}</p>
          <div className="mt-10 grid grid-cols-2 gap-12">
            <SignLine label={t('sign_employer')} />
            <SignLine label={t('sign_inspector')} />
          </div>
        </Section>

        <footer className="mt-12 border-t border-black pt-3">
          <div className="meta flex items-baseline justify-between">
            <span>{t('footer_doc', { id: docId })}</span>
            <span>{t('footer_generated', { date: today.toISOString() })}</span>
          </div>
        </footer>
      </article>
    </div>
  );
}

function Section({
  number,
  heading,
  children,
}: {
  number: number;
  heading: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-8">
      <h2 className="border-b border-black pb-1 text-[13pt]">
        <span className="meta mr-2">§{number}</span>
        {heading}
      </h2>
      {children}
    </section>
  );
}

function Field({
  label,
  value,
  valueMono = false,
}: {
  label: string;
  value: string;
  valueMono?: boolean;
}) {
  return (
    <div className="grid grid-cols-[1.4in_1fr] items-baseline border-b border-black/15 py-1.5 last:border-b-0">
      <div className="meta">{label}</div>
      <div className={valueMono ? 'meta text-black' : 'font-semibold'}>{value}</div>
    </div>
  );
}

function SignLine({ label }: { label: string }) {
  return (
    <div>
      <div className="border-b border-black pb-9" />
      <div className="meta mt-1">{label}</div>
    </div>
  );
}

function buildDocId(seed: string, today: Date): string {
  // Stable doc id derived from the employer + the day the binder was
  // generated, e.g. "KOROUS-20260501-A4F2". Keeps the doc identifiable on
  // paper without exposing internal IDs.
  const tag = seed
    .toUpperCase()
    .replace(/[^A-Z]/g, '')
    .slice(0, 8) || 'AGCONN';
  const ymd =
    today.getFullYear().toString() +
    String(today.getMonth() + 1).padStart(2, '0') +
    String(today.getDate()).padStart(2, '0');
  let h = 0;
  for (const c of `${seed}|${ymd}`) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  const suffix = h.toString(16).toUpperCase().slice(0, 4).padStart(4, '0');
  return `${tag}-${ymd}-${suffix}`;
}
