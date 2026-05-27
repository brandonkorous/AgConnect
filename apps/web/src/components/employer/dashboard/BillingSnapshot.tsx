import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheck, faCreditCard } from '@fortawesome/free-solid-svg-icons';
import type { BillingView } from '@/lib/api/hooks/employer';

type Props = {
    locale: string;
    billing: BillingView;
    hidePaymentCta?: boolean;
};

export async function BillingSnapshot({ locale, billing, hidePaymentCta = false }: Props) {
    const t = await getTranslations({ locale, namespace: 'employer.dashboard.billing_card' });

    const renewsLine = billing.currentPeriodEnd
        ? t('renews_on', { date: formatDate(billing.currentPeriodEnd, locale) })
        : t('no_subscription');

    const planLabel = t(`plan.${billing.plan}`);
    const intervalLabel = billing.interval ? t(`interval.${billing.interval}`) : '';
    const headline = `${planLabel}${intervalLabel ? ` · ${intervalLabel}` : ''}`;

    return (
        <div className="bg-primary text-primary-content relative overflow-hidden rounded-2xl p-5">
            <div
                aria-hidden
                className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_100%_0%,rgba(245,158,11,0.3),transparent_60%)]"
            />
            <div className="relative">
                <div className="opacity-75 font-mono text-xs font-semibold uppercase tracking-wider">
                    {renewsLine}
                </div>
                <h2 className="font-display mt-2 text-3xl font-light leading-none tracking-tight">
                    {headline}
                </h2>
                <div className="mt-1 text-xs opacity-85">
                    {billing.features.activePostings === -1
                        ? t('postings_unlimited')
                        : t('postings_capped', { n: billing.features.activePostings })}
                    {billing.features.workerSearch ? ` · ${t('worker_search_on')}` : ''}
                </div>
                <div className="mt-3 grid grid-cols-3 gap-2 border-t border-white/20 pt-3 text-xs">
                    <div>
                        <div className="opacity-70">{t('worker_search')}</div>
                        <div className="mt-0.5 font-mono font-bold">
                            {billing.features.workerSearch ? t('on') : t('off')}
                        </div>
                    </div>
                    <div>
                        <div className="opacity-70">{t('priority')}</div>
                        <div className="mt-0.5 font-mono font-bold">
                            {billing.features.priorityListing ? t('on') : t('off')}
                        </div>
                    </div>
                    <div>
                        <div className="opacity-70">{t('payment')}</div>
                        <div className="mt-0.5 font-mono font-bold">
                            {billing.hasPaymentMethod ? t('saved') : t('none')}
                        </div>
                    </div>
                </div>
                {!(hidePaymentCta && !billing.hasPaymentMethod) && (
                    <Link
                        href={`/${locale}/employer/billing`}
                        className="mt-4 inline-flex w-full items-center justify-center gap-1.5 rounded-full border border-white/25 bg-white/15 px-3 py-2 text-xs font-semibold"
                    >
                        <FontAwesomeIcon
                            icon={billing.hasPaymentMethod ? faCheck : faCreditCard}
                            className="h-3 w-3"
                        />
                        {billing.hasPaymentMethod ? t('manage') : t('add_payment')}
                    </Link>
                )}
            </div>
        </div>
    );
}

function formatDate(iso: string, locale: string): string {
    return new Intl.DateTimeFormat(locale === 'es' ? 'es-MX' : 'en-US', {
        month: 'short',
        day: 'numeric',
    }).format(new Date(iso));
}
