import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faDownload, faCheck, faMinus, faBell } from '@fortawesome/free-solid-svg-icons';
import {
  listComplianceCategories,
  listComplianceActions,
} from '@/lib/api/employer-ops';
import {
  NewComplianceItemButton,
  EditComplianceItemButton,
} from '@/components/employer/compliance/ComplianceItemActions';

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'employer.compliance' });
  return { title: `AgConn — ${t('title')}` };
}

export default async function CompliancePage({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'employer.compliance' });

  const [cats, actions] = await Promise.all([
    listComplianceCategories(),
    listComplianceActions(),
  ]);

  const overall = Math.round(cats.reduce((sum, c) => sum + c.score, 0) / Math.max(1, cats.length));

  return (
    <div className="px-8 pb-16 pt-8">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-base-content/60 font-mono text-[11px] uppercase tracking-wider">
            {t('title')}
          </p>
          <h1 className="font-display mt-2 text-4xl font-light leading-tight tracking-tight md:text-5xl">
            <em className="text-primary not-italic font-light">{overall}%</em> {t('headline_suffix')}
          </h1>
          <div className="text-base-content/70 mt-2 text-sm">
            {t('summary', { actions: actions.length })}
          </div>
        </div>
        <div className="flex gap-2">
          <NewComplianceItemButton />
          <button
            type="button"
            className="bg-base-content text-base-100 inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold"
          >
            <FontAwesomeIcon icon={faDownload} className="h-3.5 w-3.5" />
            {t('audit_pdf')}
          </button>
        </div>
      </div>

      <div className="mb-6 grid gap-4 lg:grid-cols-[260px_1fr]">
        <div className="bg-base-100 border-base-300 grid place-items-center rounded-2xl border p-5 text-center">
          <div
            className="grid h-[150px] w-[150px] place-items-center rounded-full"
            style={{
              background: `conic-gradient(var(--color-primary) ${overall * 3.6}deg, var(--color-base-200) 0)`,
            }}
          >
            <div className="bg-base-100 grid h-[124px] w-[124px] place-items-center rounded-full">
              <div>
                <div className="text-primary font-display text-5xl font-light leading-none tracking-tight">
                  {overall}
                  <span className="text-base-content/40 text-lg">%</span>
                </div>
                <div className="text-base-content/60 mt-1 font-mono text-[10px] font-bold uppercase tracking-wider">
                  {t('overall_label')}
                </div>
              </div>
            </div>
          </div>
          <div className="text-base-content/70 mt-3 text-xs">{t('overall_delta')}</div>
        </div>

        <div className="bg-base-100 border-base-300 rounded-2xl border p-5">
          <div className="mb-3 flex items-center gap-2">
            <FontAwesomeIcon icon={faBell} className="text-accent h-4 w-4" />
            <div className="font-display text-xl font-light tracking-tight">
              {t('actions_title', { count: actions.length })}
            </div>
          </div>
          <div className="grid gap-2.5">
            {actions.map((a, i) => {
              const tone =
                a.severity === 'urgent'
                  ? { card: 'bg-error/10 border-error/30', pill: 'bg-error text-error-content' }
                  : { card: 'bg-warning/10 border-warning/30', pill: 'bg-warning text-warning-content' };
              return (
                <div
                  key={i}
                  className={['flex flex-wrap items-center gap-3 rounded-xl border p-3.5', tone.card].join(' ')}
                >
                  <div className="min-w-[260px] flex-1">
                    <div className="mb-1 flex flex-wrap items-center gap-2">
                      <span
                        className={[
                          'rounded-full px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wider',
                          tone.pill,
                        ].join(' ')}
                      >
                        {t(`severity.${a.severity}`)}
                      </span>
                      <span className="text-sm font-semibold">{a.title}</span>
                    </div>
                    <div className="text-base-content/70 text-xs">{a.detail}</div>
                  </div>
                  <button
                    type="button"
                    className="bg-base-content text-base-100 shrink-0 rounded-full px-3.5 py-2 text-xs font-bold"
                  >
                    {a.cta}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        {cats.map((c) => (
          <div key={c.key} className="bg-base-100 border-base-300 rounded-2xl border p-5">
            <div className="mb-3 flex items-center justify-between">
              <div className="text-sm font-semibold">{c.label}</div>
              <div className="flex items-center gap-2">
                <div className="bg-base-200 h-1.5 w-[60px] overflow-hidden rounded-full">
                  <div
                    className={[
                      'h-full',
                      c.score >= 95 ? 'bg-success' : c.score >= 85 ? 'bg-accent' : 'bg-error',
                    ].join(' ')}
                    style={{ width: `${c.score}%` }}
                  />
                </div>
                <span
                  className={[
                    'font-mono text-xs font-bold',
                    c.score >= 95 ? 'text-success' : 'text-accent',
                  ].join(' ')}
                >
                  {c.score}%
                </span>
              </div>
            </div>
            <div className="grid gap-2">
              {c.items.map((it) => {
                const tone =
                  it.status === 'ok'
                    ? { dot: 'bg-success/15 text-success', icon: faCheck }
                    : it.status === 'warn'
                      ? { dot: 'bg-warning/15 text-warning', icon: faBell }
                      : { dot: 'bg-error/15 text-error', icon: faMinus };
                return (
                  <div
                    key={it.key}
                    className="bg-base-200/60 flex items-center gap-2.5 rounded-lg px-3 py-2"
                  >
                    <div
                      className={[
                        'grid h-4 w-4 shrink-0 place-items-center rounded-full',
                        tone.dot,
                      ].join(' ')}
                    >
                      <FontAwesomeIcon icon={tone.icon} className="h-2 w-2" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-medium">{it.label}</div>
                      <div className="text-base-content/60 text-[11px]">{it.details}</div>
                    </div>
                    {it.id && (
                      <EditComplianceItemButton
                        itemId={it.id}
                        status={it.status}
                        details={it.details}
                        evidenceUrl={it.evidenceUrl ?? null}
                        dueAt={it.dueAt}
                        label={it.label}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
