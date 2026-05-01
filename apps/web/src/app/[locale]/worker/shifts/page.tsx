import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faDownload, faPlus } from '@fortawesome/free-solid-svg-icons';
import { WorkerPageHeader } from '@/components/worker/WorkerPageHeader';
import { ShiftsCalendar } from '@/components/worker/shifts/ShiftsCalendar';
import { UpNextList } from '@/components/worker/shifts/UpNextList';
import { fetchMyShifts } from '@/lib/api/me';

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'worker.shifts' });
  return { title: t('meta.title') };
}

export default async function ShiftsPage({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'worker.shifts' });

  const start = new Date();
  start.setUTCDate(1);
  const end = new Date(start);
  end.setUTCMonth(end.getUTCMonth() + 1);
  const rows = await fetchMyShifts({
    from: start.toISOString().slice(0, 10),
    to: end.toISOString().slice(0, 10),
  });

  const totalHours = rows.reduce(
    (acc, r) => acc + (r.hoursWorked ?? 0),
    0,
  );
  const employerCount = new Set(rows.map((r) => r.shift.employer)).size;
  const projectedPayCents = rows.reduce(
    (acc, r) => acc + Math.round((r.hoursWorked ?? 0) * 22 * 100), // approx; real calc in pay endpoint
    0,
  );

  return (
    <div className="px-8 pb-16 pt-8">
      <WorkerPageHeader
        eyebrow={t('eyebrow')}
        title={
          <>
            {t('title.lead')}{' '}
            <em className="text-primary font-light not-italic">{t('title.em')}</em>
            .
          </>
        }
        sub={t('sub')}
        right={
          <>
            <button
              type="button"
              className="border-base-300 inline-flex items-center gap-1.5 rounded-full border bg-white px-3.5 py-2 text-[13px] font-semibold"
            >
              <FontAwesomeIcon icon={faDownload} className="h-3 w-3" />
              {t('cta_sync')}
            </button>
            <button type="button" className="btn btn-primary btn-sm rounded-full">
              <FontAwesomeIcon icon={faPlus} className="h-3 w-3" />
              {t('cta_availability')}
            </button>
          </>
        }
      />
      <div className="grid gap-5 lg:grid-cols-[1.7fr_1fr]">
        <ShiftsCalendar shifts={rows} locale={locale} />
        <div className="grid gap-3.5">
          <MonthSummary
            locale={locale}
            counts={{
              shifts: rows.length,
              hours: totalHours,
              payCents: projectedPayCents,
              employers: employerCount,
            }}
          />
          <UpNextList shifts={rows.slice(0, 4)} locale={locale} />
        </div>
      </div>
    </div>
  );
}

async function MonthSummary({
  locale,
  counts,
}: {
  locale: string;
  counts: { shifts: number; hours: number; payCents: number; employers: number };
}) {
  const t = await getTranslations({ locale, namespace: 'worker.shifts.summary' });
  const items: { value: string; sub: string; accent?: 'primary' | 'ink' }[] = [
    { value: String(counts.shifts), sub: t('shifts'), accent: 'ink' },
    { value: `${counts.hours.toFixed(0)}h`, sub: t('hours'), accent: 'ink' },
    {
      value: `$${(counts.payCents / 100000).toFixed(1)}k`,
      sub: t('pay'),
      accent: 'primary',
    },
    { value: String(counts.employers), sub: t('employers'), accent: 'ink' },
  ];
  return (
    <div className="border-base-300 bg-base-100 rounded-2xl border p-[18px]">
      <div className="text-base-content/60 font-mono text-[10.5px] font-semibold uppercase tracking-[0.18em]">
        {t('eyebrow')}
      </div>
      <div className="mt-3 grid grid-cols-2 gap-3">
        {items.map((it) => (
          <div key={it.sub}>
            <div
              className={[
                'font-serif text-[28px] leading-none tracking-[-0.025em]',
                it.accent === 'primary' ? 'text-primary' : 'text-base-content',
              ].join(' ')}
            >
              {it.value}
            </div>
            <div className="text-base-content/60 mt-1 text-[11.5px]">{it.sub}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
