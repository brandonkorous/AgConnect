import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSackDollar, faArrowRight } from '@fortawesome/free-solid-svg-icons';
import { fetchMyPay } from '@/lib/api/me';

type Props = { locale: string };

function formatPayday(iso: string, locale: string): { weekday: string; date: string } {
    const d = new Date(iso);
    const fmtLocale = locale === 'es' ? 'es-MX' : 'en-US';
    return {
        weekday: new Intl.DateTimeFormat(fmtLocale, { weekday: 'long' }).format(d),
        date: new Intl.DateTimeFormat(fmtLocale, { month: 'short', day: 'numeric' }).format(d),
    };
}

export async function PaycheckCard({ locale }: Props) {
    const t = await getTranslations({ locale, namespace: 'worker.dashboard.paycheck' });
    const { summary } = await fetchMyPay();
    const next = summary.nextDeposit;

    if (!next) {
        return (
            <section className="bg-primary text-primary-content relative overflow-hidden rounded-2xl p-5">
                <div
                    aria-hidden
                    className="absolute inset-0"
                    style={{
                        background:
                            'radial-gradient(ellipse 80% 60% at 100% 0%, oklch(83% 0.13 88 / 0.30), transparent 60%)',
                    }}
                />
                <div className="relative">
                    <div className="font-mono text-xs font-semibold uppercase tracking-[0.18em] opacity-80">
                        {t('empty_eyebrow')}
                    </div>
                    <p className="font-serif mt-2 text-xl font-medium leading-snug tracking-tight">
                        {t('empty_body')}
                    </p>
                    <Link
                        href={`/${locale}/worker/pay`}
                        className="mt-4 inline-flex items-center gap-1.5 border-b border-current pb-0.5 text-sm font-semibold no-underline"
                    >
                        {t('view_pay')}
                        <FontAwesomeIcon icon={faArrowRight} className="h-3 w-3" />
                    </Link>
                </div>
            </section>
        );
    }

    const dollars = (next.netCents / 100).toFixed(2).split('.');
    const intPart = `$${Number(dollars[0]).toLocaleString(locale === 'es' ? 'es-MX' : 'en-US')}`;
    const decPart = `.${dollars[1]}`;
    const { weekday, date } = formatPayday(next.payDate, locale);

    return (
        <section className="bg-primary text-primary-content relative overflow-hidden rounded-2xl p-5">
            <div
                aria-hidden
                className="absolute inset-0"
                style={{
                    background:
                        'radial-gradient(ellipse 80% 60% at 100% 0%, oklch(83% 0.13 88 / 0.30), transparent 60%)',
                }}
            />
            <div className="relative">
                <div className="font-mono text-xs font-semibold uppercase tracking-[0.18em] opacity-80">
                    {t('eyebrow')}
                </div>
                <div className="mt-2.5 flex items-end justify-between gap-3">
                    <div className="font-serif text-4xl font-medium leading-none tracking-tight">
                        {intPart}
                        <span className="text-lg opacity-70">{decPart}</span>
                    </div>
                    <div className="text-right">
                        <div className="text-xs capitalize opacity-75">{weekday}</div>
                        <div className="font-mono text-sm font-bold">{date}</div>
                    </div>
                </div>
                <dl className="mt-3.5 flex justify-between border-t border-white/20 pt-3.5 text-xs">
                    <div>
                        <dt className="opacity-75">{t('hours_logged_label')}</dt>
                        <dd className="mt-0.5 font-mono font-bold">{next.hours.toFixed(1)}h</dd>
                    </div>
                    <div>
                        <dt className="opacity-75">{t('piece_bonus_label')}</dt>
                        <dd className="mt-0.5 font-mono font-bold">
                            +${((next.grossCents - next.netCents) / 100).toFixed(0)}
                        </dd>
                    </div>
                    <div>
                        <dt className="opacity-75">{t('method_label')}</dt>
                        <dd className="mt-0.5 font-mono font-bold">{t('method_value')}</dd>
                    </div>
                </dl>
                <Link
                    href={`/${locale}/worker/pay`}
                    className="btn btn-sm mt-3.5 w-full border border-white/25 bg-white/10 text-primary-content hover:bg-white/20"
                >
                    <FontAwesomeIcon icon={faSackDollar} className="h-3 w-3" />
                    {t('view_timesheet')}
                </Link>
            </div>
        </section>
    );
}
