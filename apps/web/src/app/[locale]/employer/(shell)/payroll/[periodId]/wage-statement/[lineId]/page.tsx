import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft } from '@fortawesome/free-solid-svg-icons';
import { fetchWageStatement } from '@/lib/api/employer-ops';
import { PrintTrigger } from '@/components/employer/compliance/PrintTrigger';

export const dynamic = 'force-dynamic';

type Props = { params: Promise<{ locale: string; periodId: string; lineId: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'employer.payroll.wage_statement' });
  return { title: `AgConn — ${t('title')}` };
}

function fmtCents(cents: number, locale: string): string {
  return new Intl.NumberFormat(locale === 'es' ? 'es-MX' : 'en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(cents / 100);
}

function fmtHours(h: number, locale: string): string {
  return new Intl.NumberFormat(locale === 'es' ? 'es-MX' : 'en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(h);
}

function fmtDate(iso: string, locale: string): string {
  return new Intl.DateTimeFormat(locale === 'es' ? 'es-MX' : 'en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(iso));
}

export default async function WageStatementPage({ params }: Props) {
  const { locale, periodId, lineId } = await params;
  const t = await getTranslations({ locale, namespace: 'employer.payroll.wage_statement' });

  const data = await fetchWageStatement(periodId, lineId);
  if (!data) notFound();

  const { line, period, worker, employer } = data;
  const employerLocation = [employer.city, employer.stateCode, employer.postalCode]
    .filter(Boolean)
    .join(', ');

  return (
    <div className="bg-white text-black min-h-screen">
      <div className="screen-only mx-auto flex max-w-[7in] items-center justify-between px-6 pb-4 pt-6">
        <Link
          href={`/${locale}/employer/payroll`}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-base-content/70 hover:text-base-content"
        >
          <FontAwesomeIcon icon={faArrowLeft} className="h-3 w-3" />
          {t('back')}
        </Link>
        <PrintTrigger label={t('print')} />
      </div>

      <article className="doc-binder mx-auto max-w-[7in] px-6 pb-12 print:px-0">
        <header className="border-b-2 border-black pb-4">
          <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-black/70">
            {t('header_eyebrow')}
          </div>
          <h1 className="font-serif mt-1 text-2xl font-semibold leading-tight tracking-tight">
            {t('header_title')}
          </h1>
          <div className="mt-3 grid grid-cols-2 gap-4 text-[12px] leading-snug">
            <div>
              <div className="text-black/60">{t('employer_label')}</div>
              <div className="font-semibold">{employer.legalName || '—'}</div>
              {employer.dbaName ? <div>{t('dba_prefix')} {employer.dbaName}</div> : null}
              {employer.streetAddress ? <div>{employer.streetAddress}</div> : null}
              {employerLocation ? <div>{employerLocation}</div> : null}
              {employer.flcLicenseNum ? (
                <div className="font-mono text-[11px] text-black/70">
                  {t('flc_label')}: {employer.flcLicenseNum}
                </div>
              ) : null}
            </div>
            <div>
              <div className="text-black/60">{t('worker_label')}</div>
              <div className="font-semibold">
                {worker.firstName} {worker.lastName}
              </div>
              <div className="mt-2 text-black/60">{t('period_label')}</div>
              <div>
                {fmtDate(period.startDate, locale)} — {fmtDate(period.endDate, locale)}
              </div>
              <div className="mt-2 text-black/60">{t('pay_date_label')}</div>
              <div>{fmtDate(period.payDate, locale)}</div>
            </div>
          </div>
        </header>

        <section className="mt-6">
          <h2 className="font-serif text-lg font-semibold tracking-tight">
            {t('earnings_heading')}
          </h2>
          <table className="mt-3 w-full border-collapse text-[12px]">
            <thead>
              <tr className="border-b border-black/40">
                <th className="py-2 text-left font-semibold">{t('col_description')}</th>
                <th className="py-2 text-right font-semibold tabular-nums">{t('col_hours')}</th>
                <th className="py-2 text-right font-semibold tabular-nums">{t('col_rate')}</th>
                <th className="py-2 text-right font-semibold tabular-nums">{t('col_amount')}</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-black/15">
                <td className="py-2">{t('row_regular')}</td>
                <td className="py-2 text-right tabular-nums">
                  {fmtHours(Math.max(0, line.hours - line.overtimeHours), locale)}
                </td>
                <td className="py-2 text-right tabular-nums text-black/60">—</td>
                <td className="py-2 text-right tabular-nums">
                  {fmtCents(line.regularPayCents, locale)}
                </td>
              </tr>
              {line.pieceRatePayCents > 0 ? (
                <tr className="border-b border-black/15">
                  <td className="py-2">{t('row_piece_rate')}</td>
                  <td className="py-2 text-right tabular-nums text-black/60">—</td>
                  <td className="py-2 text-right tabular-nums text-black/60">—</td>
                  <td className="py-2 text-right tabular-nums">
                    {fmtCents(line.pieceRatePayCents, locale)}
                  </td>
                </tr>
              ) : null}
              {line.overtimeHours > 0 ? (
                <tr className="border-b border-black/15">
                  <td className="py-2">{t('row_overtime')}</td>
                  <td className="py-2 text-right tabular-nums">
                    {fmtHours(line.overtimeHours, locale)}
                  </td>
                  <td className="py-2 text-right tabular-nums text-black/60">×0.5</td>
                  <td className="py-2 text-right tabular-nums">
                    {fmtCents(line.overtimePayCents, locale)}
                  </td>
                </tr>
              ) : null}
              {line.nonProductiveHours > 0 ? (
                <tr className="border-b border-black/15">
                  <td className="py-2">
                    {t('row_non_productive')}
                    <div className="text-[10px] text-black/50">{t('row_non_productive_hint')}</div>
                  </td>
                  <td className="py-2 text-right tabular-nums">
                    {fmtHours(line.nonProductiveHours, locale)}
                  </td>
                  <td className="py-2 text-right tabular-nums text-black/60">—</td>
                  <td className="py-2 text-right tabular-nums">
                    {fmtCents(line.nonProductivePayCents, locale)}
                  </td>
                </tr>
              ) : null}
              {line.restPeriodHours > 0 ? (
                <tr className="border-b border-black/15">
                  <td className="py-2">
                    {t('row_rest_period')}
                    <div className="text-[10px] text-black/50">{t('row_rest_period_hint')}</div>
                  </td>
                  <td className="py-2 text-right tabular-nums">
                    {fmtHours(line.restPeriodHours, locale)}
                  </td>
                  <td className="py-2 text-right tabular-nums text-black/60">—</td>
                  <td className="py-2 text-right tabular-nums">
                    {fmtCents(line.restPeriodPayCents, locale)}
                  </td>
                </tr>
              ) : null}
              {line.aewrTopUpCents > 0 ? (
                <tr className="border-b border-black/15">
                  <td className="py-2">
                    {t('row_aewr_top_up')}
                    <div className="text-[10px] text-black/50">{t('row_aewr_top_up_hint')}</div>
                  </td>
                  <td className="py-2 text-right tabular-nums text-black/60">—</td>
                  <td className="py-2 text-right tabular-nums text-black/60">—</td>
                  <td className="py-2 text-right tabular-nums">
                    {fmtCents(line.aewrTopUpCents, locale)}
                  </td>
                </tr>
              ) : null}
              <tr className="border-t-2 border-black">
                <td className="py-2 font-semibold">{t('row_gross')}</td>
                <td colSpan={2} />
                <td className="py-2 text-right font-semibold tabular-nums">
                  {fmtCents(line.grossCents, locale)}
                </td>
              </tr>
              <tr className="border-b border-black/15">
                <td className="py-2 text-black/70">{t('row_taxes')}</td>
                <td colSpan={2} />
                <td className="py-2 text-right tabular-nums text-black/70">
                  − {fmtCents(line.taxesCents, locale)}
                </td>
              </tr>
              <tr className="border-t border-black bg-black/5">
                <td className="py-2 font-semibold">{t('row_net')}</td>
                <td colSpan={2} />
                <td className="py-2 text-right font-bold tabular-nums">
                  {fmtCents(line.netCents, locale)}
                </td>
              </tr>
            </tbody>
          </table>
        </section>

        <section className="mt-6 grid grid-cols-2 gap-4 text-[11px] leading-relaxed">
          <div>
            <div className="font-mono text-[9.5px] uppercase tracking-[0.16em] text-black/60">
              {t('floor_label')}
            </div>
            <div className="font-semibold">
              {fmtCents(line.appliedFloorCents, locale)}/{t('hour_unit')}
            </div>
            {line.isH2a ? (
              <div className="mt-1 text-black/70">{t('floor_h2a_note')}</div>
            ) : (
              <div className="mt-1 text-black/70">{t('floor_state_note')}</div>
            )}
          </div>
          <div>
            <div className="font-mono text-[9.5px] uppercase tracking-[0.16em] text-black/60">
              {t('compliance_label')}
            </div>
            <div className="text-black/80">{t('compliance_note')}</div>
          </div>
        </section>

        <footer className="mt-8 border-t border-black/30 pt-3 text-[10px] text-black/60">
          {t('footer_note')}
        </footer>
      </article>
    </div>
  );
}
