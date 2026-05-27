'use client';

import { useTranslations } from 'next-intl';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faDownload } from '@fortawesome/free-solid-svg-icons';
import { useMyPay, type PaySummary } from '@/lib/api/hooks/pay';
import { buildPaystubsCsv, downloadBlob } from '@/lib/export/client-download';

type Props = { nextDeposit: PaySummary['nextDeposit']; locale: string };

export function NextDepositCard({ nextDeposit, locale }: Props) {
    const t = useTranslations('worker.pay.deposit');
    const fmtLocale = locale === 'es' ? 'es-MX' : 'en-US';
    const myPay = useMyPay();
    const downloadPaystubs = () => {
        const paystubs = myPay.data?.paystubs ?? [];
        downloadBlob('agconn-paystubs.csv', buildPaystubsCsv(paystubs), 'text/csv;charset=utf-8');
    };
    if (!nextDeposit) {
        return (
            <div className="bg-primary text-primary-content relative overflow-hidden rounded-2xl p-[22px]">
                <div className="font-mono text-xs font-semibold uppercase tracking-[0.18em] opacity-75">
                    {t('eyebrow', { date: '_none' })}
                </div>
                <div className="font-serif mt-3 text-[36px] leading-tight tracking-[-0.02em]">
                    —
                </div>
                <p className="mt-2 text-sm opacity-75">
                    {t('gross')}: $0
                </p>
            </div>
        );
    }
    const payDateLabel = new Intl.DateTimeFormat(fmtLocale, {
        weekday: 'long',
        month: 'short',
        day: 'numeric',
    }).format(new Date(nextDeposit.payDate));
    const dollars = (nextDeposit.netCents / 100).toFixed(2);
    const [whole, fraction] = dollars.split('.');
    return (
        <div className="bg-primary text-primary-content relative overflow-hidden rounded-2xl p-[22px]">
            <div
                aria-hidden
                className="absolute inset-0"
                style={{
                    background:
                        'radial-gradient(ellipse 80% 60% at 100% 0%, rgba(245,158,11,0.28), transparent 60%)',
                }}
            />
            <div className="relative">
                <div className="font-mono text-xs font-semibold uppercase tracking-[0.18em] opacity-75">
                    {t('eyebrow', { date: payDateLabel })}
                </div>
                <div className="font-serif mt-3 text-[56px] leading-none tracking-[-0.03em]">
                    ${whole}
                    <span className="text-[28px] opacity-60">.{fraction}</span>
                </div>
                <div className="mt-3.5 grid grid-cols-2 gap-3 border-t border-white/20 pt-3.5 text-sm">
                    <div>
                        <div className="opacity-70">{t('gross')}</div>
                        <div className="mt-0.5 font-mono font-bold">
                            ${(nextDeposit.grossCents / 100).toFixed(2)}
                        </div>
                    </div>
                    <div>
                        <div className="opacity-70">{t('hours')}</div>
                        <div className="mt-0.5 font-mono font-bold">
                            {nextDeposit.hours.toFixed(1)}h
                        </div>
                    </div>
                    <div>
                        <div className="opacity-70">{t('tax')}</div>
                        <div className="mt-0.5 font-mono font-bold">
                            −$
                            {((nextDeposit.grossCents - nextDeposit.netCents) / 100).toFixed(2)}
                        </div>
                    </div>
                    <div>
                        <div className="opacity-70">{t('method')}</div>
                        <div className="mt-0.5 font-mono font-bold">Direct</div>
                    </div>
                </div>
                <button
                    type="button"
                    onClick={downloadPaystubs}
                    className="mt-4 inline-flex w-full items-center justify-center gap-1.5 rounded-full border border-white/25 bg-white/15 px-4 py-2.5 text-[13px] font-semibold"
                >
                    <FontAwesomeIcon icon={faDownload} className="h-3 w-3" />
                    {t('download')}
                </button>
            </div>
        </div>
    );
}
