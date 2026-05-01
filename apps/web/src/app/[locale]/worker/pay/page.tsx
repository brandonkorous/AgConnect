import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faDownload } from '@fortawesome/free-solid-svg-icons';
import { WorkerPageHeader } from '@/components/worker/WorkerPageHeader';
import { StatTile } from '@/components/worker/primitives/StatTile';
import { EarningsChart } from '@/components/worker/pay/EarningsChart';
import { NextDepositCard } from '@/components/worker/pay/NextDepositCard';
import { PaystubsTable } from '@/components/worker/pay/PaystubsTable';

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'worker.pay' });
  return { title: t('meta.title') };
}

export default async function PayPage({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'worker.pay' });
  const stats = [
    { label: t('stat.ytd_earnings.label'), value: '$28,420', sub: t('stat.ytd_earnings.sub'), accent: 'primary' as const },
    { label: t('stat.hours.label'), value: '1,284', sub: t('stat.hours.sub') },
    { label: t('stat.avg_hourly.label'), value: '$22.14', sub: t('stat.avg_hourly.sub') },
    { label: t('stat.next_deposit.label'), value: '$982.16', sub: t('stat.next_deposit.sub'), accent: 'accent' as const },
  ];
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
          <button type="button" className="btn btn-primary btn-sm rounded-full">
            <FontAwesomeIcon icon={faDownload} className="h-3 w-3" />
            {t('cta_export')}
          </button>
        }
      />

      <div className="mb-5 grid gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <StatTile key={s.label} {...s} />
        ))}
      </div>

      <div className="mb-5 grid gap-5 lg:grid-cols-[1.55fr_1fr]">
        <EarningsChart />
        <NextDepositCard />
      </div>

      <PaystubsTable />

      <div className="mt-5 grid gap-3.5 lg:grid-cols-3">
        <DirectDepositCard locale={locale} />
        <TaxDocsCard locale={locale} />
        <WageTransparencyCard locale={locale} />
      </div>
    </div>
  );
}

async function DirectDepositCard({ locale }: { locale: string }) {
  const t = await getTranslations({ locale, namespace: 'worker.pay.direct_deposit' });
  return (
    <div className="border-base-300 bg-base-100 rounded-2xl border p-[18px]">
      <div className="text-base-content/60 font-mono text-[10.5px] font-semibold uppercase tracking-[0.18em]">
        {t('eyebrow')}
      </div>
      <div className="mt-3 flex items-center gap-3">
        <div className="bg-base-200 grid h-11 w-11 place-items-center rounded-xl font-mono text-[11px] font-bold">
          BOA
        </div>
        <div className="flex-1">
          <div className="text-[13.5px] font-semibold">{t('account')}</div>
          <div className="text-base-content/60 text-[11.5px]">{t('bank')}</div>
        </div>
      </div>
      <button
        type="button"
        className="text-primary mt-3 bg-transparent text-[12px] font-bold"
      >
        {t('manage')}
      </button>
    </div>
  );
}

async function TaxDocsCard({ locale }: { locale: string }) {
  const t = await getTranslations({ locale, namespace: 'worker.pay.tax_docs' });
  const docs = [
    'W-2 · Westside Orchards',
    'W-2 · Río Verde Farms',
    '1099-MISC · Sunridge',
  ];
  return (
    <div className="border-base-300 bg-base-100 rounded-2xl border p-[18px]">
      <div className="text-base-content/60 font-mono text-[10.5px] font-semibold uppercase tracking-[0.18em]">
        {t('eyebrow')}
      </div>
      <div className="mt-3 grid gap-2">
        {docs.map((d, i) => (
          <div
            key={d}
            className={[
              'flex items-center justify-between py-2',
              i < docs.length - 1 ? 'border-base-300 border-b' : '',
            ].join(' ')}
          >
            <div className="text-[12.5px]">{d}</div>
            <FontAwesomeIcon icon={faDownload} className="text-base-content/50 h-3 w-3" />
          </div>
        ))}
      </div>
    </div>
  );
}

async function WageTransparencyCard({ locale }: { locale: string }) {
  const t = await getTranslations({ locale, namespace: 'worker.pay.wage' });
  return (
    <div className="border-base-300 bg-base-100 rounded-2xl border p-[18px]">
      <div className="text-base-content/60 font-mono text-[10.5px] font-semibold uppercase tracking-[0.18em]">
        {t('eyebrow')}
      </div>
      <p className="text-base-content/80 mt-3 text-[13px] leading-relaxed">
        {t.rich('body', {
          rate: (chunks) => <strong className="text-base-content">{chunks}</strong>,
        })}
      </p>
      <button
        type="button"
        className="text-primary mt-3 bg-transparent text-[12px] font-bold"
      >
        {t('cta')}
      </button>
    </div>
  );
}
