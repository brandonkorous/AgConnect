import { useTranslations } from 'next-intl';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faDownload } from '@fortawesome/free-solid-svg-icons';

export function PaycheckCard() {
    const t = useTranslations('worker.dashboard.paycheck');

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
                <div className="font-mono text-[11px] font-semibold uppercase tracking-[0.18em] opacity-80">
                    {t('eyebrow')}
                </div>
                <div className="mt-2.5 flex items-end justify-between">
                    <div className="font-serif text-4xl font-medium leading-none tracking-tight">
                        {t('amount_int')}
                        <span className="text-lg opacity-70">{t('amount_dec')}</span>
                    </div>
                    <div className="text-right">
                        <div className="text-[11px] opacity-75">{t('weekday')}</div>
                        <div className="font-mono text-sm font-bold">{t('date')}</div>
                    </div>
                </div>
                <dl className="mt-3.5 flex justify-between border-t border-white/20 pt-3.5 text-xs">
                    <div>
                        <dt className="opacity-75">{t('hours_logged_label')}</dt>
                        <dd className="mt-0.5 font-mono font-bold">{t('hours_logged_value')}</dd>
                    </div>
                    <div>
                        <dt className="opacity-75">{t('piece_bonus_label')}</dt>
                        <dd className="mt-0.5 font-mono font-bold">{t('piece_bonus_value')}</dd>
                    </div>
                    <div>
                        <dt className="opacity-75">{t('method_label')}</dt>
                        <dd className="mt-0.5 font-mono font-bold">{t('method_value')}</dd>
                    </div>
                </dl>
                <button
                    type="button"
                    className="btn btn-sm mt-3.5 w-full border border-white/25 bg-white/10 text-primary-content hover:bg-white/20"
                >
                    <FontAwesomeIcon icon={faDownload} className="h-3 w-3" />
                    {t('view_timesheet')}
                </button>
            </div>
        </section>
    );
}
