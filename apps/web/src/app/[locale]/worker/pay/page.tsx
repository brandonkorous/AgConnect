import type { Metadata } from 'next';
import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faDownload } from '@fortawesome/free-solid-svg-icons';
import { WorkerPageHeader } from '@/components/worker/WorkerPageHeader';
import { StatTile } from '@/components/worker/primitives/StatTile';
import { EarningsChart } from '@/components/worker/pay/EarningsChart';
import { NextDepositCard } from '@/components/worker/pay/NextDepositCard';
import { PaystubsTable } from '@/components/worker/pay/PaystubsTable';
import { fetchMyPay } from '@/lib/api/me';

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: 'worker.pay' });
    return { title: t('meta.title') };
}

export default async function PayPage({ params }: Props) {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: 'worker.pay' });
    const { paystubs, summary } = await fetchMyPay();

    const ytdDollars = (summary.ytdGrossCents / 100).toLocaleString(locale, {
        maximumFractionDigits: 0,
    });
    const avgHourly = (summary.avgHourlyCents / 100).toFixed(2);
    const nextDeposit = summary.nextDeposit;

    const stats = [
        {
            label: t('stat.ytd_earnings.label'),
            value: summary.ytdGrossCents > 0 ? `$${ytdDollars}` : '—',
            sub: t('stat.ytd_earnings.sub', { employers: summary.employerCount ?? 0 }),
            accent: 'primary' as const,
        },
        {
            label: t('stat.hours.label'),
            value: summary.ytdHours > 0 ? summary.ytdHours.toLocaleString(locale) : '—',
            sub: t('stat.hours.sub', { weeks: summary.weeksLogged ?? 0 }),
        },
        {
            label: t('stat.avg_hourly.label'),
            value: summary.avgHourlyCents > 0 ? `$${avgHourly}` : '—',
            sub: summary.avgHourlyCents > 0 ? t('stat.avg_hourly.sub') : '',
        },
        {
            label: t('stat.next_deposit.label'),
            value: nextDeposit
                ? `$${(nextDeposit.netCents / 100).toFixed(2)}`
                : '—',
            sub: nextDeposit
                ? t('stat.next_deposit.sub', {
                    date: new Date(nextDeposit.payDate).toLocaleDateString(locale, {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                    }),
                })
                : t('stat.next_deposit.sub', { date: '_none' }),
            accent: 'accent' as const,
        },
    ];
    return (
        <div className=" px-5 pb-16 pt-8">
            <WorkerPageHeader
                eyebrow={t('eyebrow')}
                title={
                    <>
                        {t('title.lead')}{' '}
                        <em className="text-primary font-light italic">{t('title.em')}</em>
                        .
                    </>
                }
                sub={t('sub')}
                right={
                    <a
                        href="/api/me/paystubs/csv"
                        download="agconn-paystubs.csv"
                        className="btn btn-primary btn-sm rounded-full no-underline"
                    >
                        <FontAwesomeIcon icon={faDownload} className="h-3 w-3" />
                        {t('cta_export')}
                    </a>
                }
            />

            <div className="mb-5 grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
                {stats.map((s) => (
                    <StatTile key={s.label} {...s} />
                ))}
            </div>

            <div className="mb-5 grid grid-cols-1 gap-5 lg:grid-cols-[1.55fr_1fr]">
                <EarningsChart paystubs={paystubs} locale={locale} />
                <NextDepositCard nextDeposit={nextDeposit} />
            </div>

            <PaystubsTable rows={paystubs} locale={locale} />

            <div className="mt-5 grid grid-cols-1 gap-3.5 lg:grid-cols-3">
                <DirectDepositCard locale={locale} />
                <TaxDocsCard locale={locale} />
                <WageTransparencyCard locale={locale} avgHourly={`$${avgHourly}/hr`} />
            </div>
        </div>
    );
}

async function DirectDepositCard({ locale }: { locale: string }) {
    const t = await getTranslations({ locale, namespace: 'worker.pay.direct_deposit' });
    return (
        <div className="border-base-300 bg-base-100 rounded-2xl border p-[18px]">
            <div className="text-base-content/60 font-mono text-xs font-semibold uppercase tracking-[0.18em]">
                {t('eyebrow')}
            </div>
            <p className="text-base-content/70 mt-3 text-[13px]">{t('empty_body')}</p>
            <Link
                href={`/${locale}/worker/profile`}
                className="text-primary mt-3 inline-block bg-transparent text-[12px] font-bold no-underline"
            >
                {t('manage')}
            </Link>
        </div>
    );
}

async function TaxDocsCard({ locale }: { locale: string }) {
    const t = await getTranslations({ locale, namespace: 'worker.pay.tax_docs' });
    return (
        <div className="border-base-300 bg-base-100 rounded-2xl border p-[18px]">
            <div className="text-base-content/60 font-mono text-xs font-semibold uppercase tracking-[0.18em]">
                {t('eyebrow')}
            </div>
            <p className="text-base-content/70 mt-3 text-[13px]">{t('empty_body')}</p>
            <a
                href="/api/me/paystubs/csv"
                download="agconn-paystubs.csv"
                className="text-primary mt-3 inline-flex items-center gap-1.5 bg-transparent text-[12px] font-bold no-underline"
            >
                {t('export')}
            </a>
        </div>
    );
}

async function WageTransparencyCard({
    locale,
    avgHourly,
}: {
    locale: string;
    avgHourly: string;
}) {
    const t = await getTranslations({ locale, namespace: 'worker.pay.wage' });
    return (
        <div className="border-base-300 bg-base-100 rounded-2xl border p-[18px]">
            <div className="text-base-content/60 font-mono text-xs font-semibold uppercase tracking-[0.18em]">
                {t('eyebrow')}
            </div>
            <p className="text-base-content/80 mt-3 text-[13px] leading-relaxed">
                {avgHourly && avgHourly !== '$0.00/hr'
                    ? locale === 'es'
                        ? `Tu promedio de ${avgHourly} se compara con el rango del mercado en tu condado.`
                        : `Your average of ${avgHourly} stacks up against the county's market range.`
                    : locale === 'es'
                        ? 'Compararemos tu salario con el del condado cuando llegue tu primer recibo.'
                        : "We'll compare your wage to the county once your first paystub posts."}
            </p>
            <Link
                href={`/${locale}/worker/jobs?wageMin=22`}
                className="text-primary mt-3 inline-block bg-transparent text-[12px] font-bold no-underline"
            >
                {t('cta')}
            </Link>
        </div>
    );
}
