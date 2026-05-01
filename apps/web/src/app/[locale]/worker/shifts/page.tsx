import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faDownload, faPlus } from '@fortawesome/free-solid-svg-icons';
import { WorkerPageHeader } from '@/components/worker/WorkerPageHeader';
import { ShiftsCalendar } from '@/components/worker/shifts/ShiftsCalendar';
import { UpNextList } from '@/components/worker/shifts/UpNextList';

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'worker.shifts' });
  return { title: t('meta.title') };
}

export default async function ShiftsPage({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'worker.shifts' });
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
        <ShiftsCalendar />
        <div className="grid gap-3.5">
          <MonthSummary locale={locale} />
          <UpNextList />
        </div>
      </div>
    </div>
  );
}

async function MonthSummary({ locale }: { locale: string }) {
  const t = await getTranslations({ locale, namespace: 'worker.shifts.summary' });
  const items: { value: string; sub: string; accent?: 'primary' | 'ink' }[] = [
    { value: '14', sub: t('shifts'), accent: 'ink' },
    { value: '112h', sub: t('hours'), accent: 'ink' },
    { value: '$2.6k', sub: t('pay'), accent: 'primary' },
    { value: '3', sub: t('employers'), accent: 'ink' },
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
