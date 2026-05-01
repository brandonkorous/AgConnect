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
  const tList = await getTranslations({ locale, namespace: 'employer.compliance' });

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

  return (
    <div className="bg-base-100 min-h-screen px-8 pb-16 pt-8 print:px-0 print:pt-0">
      <div className="mx-auto max-w-3xl">
        <div className="mb-6 flex items-center justify-between print:hidden">
          <a
            href={`/${locale}/employer/compliance`}
            className="text-base-content/60 hover:text-base-content text-sm"
          >
            ← {t('back')}
          </a>
          <PrintTrigger label={t('print_button')} autoOpen={true} />
        </div>

        <header className="border-base-300 mb-8 border-b pb-6">
          <p className="text-base-content/60 font-mono text-[11px] uppercase tracking-wider">
            {t('eyebrow')}
          </p>
          <h1 className="font-display mt-2 text-4xl font-light leading-tight tracking-tight">
            {t('title')}
          </h1>
          <dl className="mt-4 grid grid-cols-2 gap-2 text-sm">
            <div>
              <dt className="text-base-content/60 font-mono text-[10px] uppercase tracking-wider">
                {t('employer')}
              </dt>
              <dd className="font-semibold">{profile.legalName}</dd>
            </div>
            <div>
              <dt className="text-base-content/60 font-mono text-[10px] uppercase tracking-wider">
                {t('generated')}
              </dt>
              <dd className="font-mono">
                {today.toLocaleDateString(locale === 'es' ? 'es-MX' : 'en-US', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                })}
              </dd>
            </div>
            <div>
              <dt className="text-base-content/60 font-mono text-[10px] uppercase tracking-wider">
                {t('overall_score')}
              </dt>
              <dd className="text-primary font-display text-2xl font-light">
                {overall}%
              </dd>
            </div>
            <div>
              <dt className="text-base-content/60 font-mono text-[10px] uppercase tracking-wider">
                {t('actions_due')}
              </dt>
              <dd className="font-display text-2xl font-light">{actions.length}</dd>
            </div>
          </dl>
        </header>

        {actions.length > 0 && (
          <section className="mb-8">
            <h2 className="font-display mb-3 text-xl font-light tracking-tight">
              {t('actions_heading')}
            </h2>
            <ul className="space-y-2">
              {actions.map((a, i) => (
                <li
                  key={i}
                  className={[
                    'rounded-lg border p-3.5 text-sm',
                    a.severity === 'urgent'
                      ? 'bg-error/10 border-error/30'
                      : 'bg-warning/10 border-warning/30',
                  ].join(' ')}
                >
                  <div className="font-semibold">{a.title}</div>
                  <div className="text-base-content/70 text-xs">{a.detail}</div>
                  <div className="text-base-content/60 mt-1 font-mono text-[10px] uppercase tracking-wider">
                    {tList(`severity.${a.severity}`)} · {a.cta}
                  </div>
                </li>
              ))}
            </ul>
          </section>
        )}

        <section>
          <h2 className="font-display mb-3 text-xl font-light tracking-tight">
            {t('items_heading')}
          </h2>
          <div className="grid gap-4">
            {cats.map((c) => (
              <div key={c.key} className="border-base-300 rounded-lg border p-4">
                <div className="mb-3 flex items-baseline justify-between">
                  <h3 className="text-sm font-semibold">{c.label}</h3>
                  <span className="font-mono text-sm font-bold">{c.score}%</span>
                </div>
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-base-content/60 border-base-300 border-b text-left font-mono uppercase tracking-wider">
                      <th className="py-1.5 pr-2 font-bold text-[10px]">{t('col_status')}</th>
                      <th className="py-1.5 pr-2 font-bold text-[10px]">{t('col_item')}</th>
                      <th className="py-1.5 pr-2 font-bold text-[10px]">{t('col_details')}</th>
                      <th className="py-1.5 font-bold text-[10px]">{t('col_due')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {c.items.map((it) => (
                      <tr key={it.key} className="border-base-200 border-b last:border-0">
                        <td className="py-2 pr-2 font-mono uppercase tracking-wider">
                          {it.status}
                        </td>
                        <td className="py-2 pr-2 font-medium">{it.label}</td>
                        <td className="text-base-content/70 py-2 pr-2">{it.details}</td>
                        <td className="font-mono py-2 text-[10px]">
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
              </div>
            ))}
          </div>
        </section>

        <footer className="text-base-content/60 mt-10 pt-6 text-[10px]">
          {t('footer', { generated: today.toISOString() })}
        </footer>
      </div>
    </div>
  );
}
