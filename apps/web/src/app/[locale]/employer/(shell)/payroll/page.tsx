import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { getCurrentPayrollPeriod, listPayrollLines } from '@/lib/api/employer-ops';
import { PayrollActions } from '@/components/employer/payroll/PayrollActions';

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'employer.payroll' });
  return { title: `AgConn — ${t('title')}` };
}

export default async function PayrollPage({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'employer.payroll' });
  const period = await getCurrentPayrollPeriod();
  const lines = await listPayrollLines(period.id);

  const fmtCents = (c: number, withSign = false) => {
    const n = c / 100;
    const s = n.toLocaleString(locale === 'es' ? 'es-MX' : 'en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    return `${withSign && c < 0 ? '−' : ''}$${s}`;
  };

  return (
    <div className="px-8 pb-16 pt-8">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-base-content/60 font-mono text-[11px] uppercase tracking-wider">
            {t('eyebrow', {
              start: shortDate(period.startDate, locale),
              end: shortDate(period.endDate, locale),
            })}
          </p>
          <h1 className="font-display mt-2 text-4xl font-light leading-tight tracking-tight md:text-5xl">
            {t('title_a')} <em className="text-primary not-italic font-light">{t('title_b')}</em>
          </h1>
          <div className="text-base-content/70 mt-2 text-sm">
            {t('summary', {
              workers: period.totals.workers,
              hours: period.totals.hours.toLocaleString(),
              bonuses: 124,
            })}
          </div>
        </div>
        <PayrollActions periodId={period.id} status={period.status} />
      </div>

      <div className="mb-6 grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <section className="bg-base-content text-base-100 relative overflow-hidden rounded-2xl p-7">
          <div
            aria-hidden
            className="absolute inset-0 bg-[radial-gradient(ellipse_70%_80%_at_100%_0%,rgba(245,158,11,0.25),transparent_60%)]"
          />
          <div className="relative">
            <div className="text-accent font-mono text-[11px] uppercase tracking-wider">
              {t('hero_eyebrow')}
            </div>
            <div className="font-display mt-3 text-6xl font-light leading-none tracking-tight">
              {fmtCents(period.totals.netCents)}
            </div>
            <div className="border-base-100/20 mt-6 grid grid-cols-4 gap-4 border-t pt-5">
              {[
                { l: t('stat.gross'), v: fmtCents(period.totals.grossCents) },
                { l: t('stat.bonuses'), v: fmtCents(period.totals.bonusCents) },
                { l: t('stat.taxes'), v: fmtCents(-period.totals.taxesCents, true) },
                { l: t('stat.hours'), v: period.totals.hours.toLocaleString() },
              ].map((c, i) => (
                <div key={i}>
                  <div className="text-base-100/60 font-mono text-[10px] font-bold uppercase tracking-wider">
                    {c.l}
                  </div>
                  <div className="font-display mt-1 text-xl font-light tracking-tight">{c.v}</div>
                </div>
              ))}
            </div>
          </div>
        </section>
        <div className="grid grid-rows-2 gap-4">
          <div className="bg-base-100 border-base-300 rounded-2xl border p-5">
            <div className="text-base-content/60 font-mono text-[11px] font-semibold uppercase tracking-wider">
              {t('season_to_date')}
            </div>
            <div className="text-primary font-display mt-2 text-3xl font-light tracking-tight">
              $284,108
            </div>
            <div className="text-base-content/60 text-xs">
              {t('season_to_date_sub', { periods: 14, workers: 41 })}
            </div>
            <div className="mt-4 flex h-8 gap-1">
              {[42, 56, 48, 64, 72, 58, 66, 74, 82, 78, 86, 92, 88, 100].map((v, i) => (
                <div key={i} className="flex flex-1 items-end">
                  <div
                    className={[
                      'w-full rounded-sm',
                      i === 13 ? 'bg-accent' : 'bg-primary',
                    ].join(' ')}
                    style={{ height: `${v}%`, opacity: i === 13 ? 1 : 0.3 + i * 0.05 }}
                  />
                </div>
              ))}
            </div>
          </div>
          <div className="bg-accent text-accent-content rounded-2xl p-5">
            <div className="font-mono text-[11px] font-bold uppercase tracking-wider">
              {t('h2a_eyebrow')}
            </div>
            <div className="font-display mt-2 text-xl font-light leading-tight tracking-tight">
              {t('h2a_headline')}
            </div>
            <div className="mt-2 text-xs opacity-90">{t('h2a_sub')}</div>
          </div>
        </div>
      </div>

      <section className="bg-base-100 border-base-300 overflow-hidden rounded-2xl border">
        <div className="border-base-300 flex items-center justify-between border-b px-5 py-4">
          <div className="font-display text-xl font-light tracking-tight">{t('table.title')}</div>
          <div className="text-base-content/60 text-xs">
            {t('table.showing', { n: lines.length, total: 26 })} ·{' '}
            <a className="text-primary font-semibold">{t('table.view_all')} →</a>
          </div>
        </div>
        <div className="bg-base-200 border-base-300 text-base-content/60 grid grid-cols-[2fr_1.4fr_0.8fr_0.7fr_1fr_0.9fr_1fr_100px] gap-3 border-b px-5 py-3 font-mono text-[10px] font-bold uppercase tracking-wider">
          <span>{t('table.col_worker')}</span>
          <span>{t('table.col_role')}</span>
          <span>{t('table.col_hours')}</span>
          <span>{t('table.col_overtime')}</span>
          <span>{t('table.col_gross')}</span>
          <span>{t('table.col_bonus')}</span>
          <span>{t('table.col_net')}</span>
          <span className="text-right">{t('table.col_actions')}</span>
        </div>
        {lines.map((r, i) => (
          <div
            key={r.id}
            className={[
              'grid grid-cols-[2fr_1.4fr_0.8fr_0.7fr_1fr_0.9fr_1fr_100px] items-center gap-3 px-5 py-3 text-sm',
              i < lines.length - 1 ? 'border-base-300 border-b' : '',
            ].join(' ')}
          >
            <div className="flex items-center gap-2.5">
              <div className="bg-primary text-primary-content grid h-7 w-7 place-items-center rounded-full font-mono text-[10px] font-bold">
                {r.workerInitials}
              </div>
              <span className="font-semibold">{r.workerName}</span>
            </div>
            <span className="text-base-content/70">{r.role}</span>
            <span className="font-mono font-semibold">{r.hours}h</span>
            <span
              className={[
                'font-mono font-semibold',
                r.overtimeHours > 0 ? 'text-accent' : 'text-base-content/50',
              ].join(' ')}
            >
              {r.overtimeHours}h
            </span>
            <span className="font-mono">{fmtCents(r.grossCents)}</span>
            <span
              className={[
                'font-mono',
                r.bonusCents > 0 ? 'text-primary font-bold' : 'text-base-content/50',
              ].join(' ')}
            >
              {r.bonusCents > 0 ? `+${fmtCents(r.bonusCents)}` : '—'}
            </span>
            <span className="font-mono font-bold">{fmtCents(r.netCents)}</span>
            <div className="flex justify-end gap-1.5">
              <button
                type="button"
                className="border-base-300 rounded-md border bg-transparent px-2 py-1 text-[11px] font-medium"
              >
                {t('table.edit')}
              </button>
              <button
                type="button"
                className="bg-primary text-primary-content rounded-md px-2.5 py-1 text-[11px] font-bold"
              >
                ✓
              </button>
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}

function shortDate(iso: string, locale: string): string {
  return new Intl.DateTimeFormat(locale === 'es' ? 'es-MX' : 'en-US', {
    month: 'short',
    day: 'numeric',
  }).format(new Date(iso));
}
