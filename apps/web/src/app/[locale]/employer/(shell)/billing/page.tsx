import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheck, faXmark } from '@fortawesome/free-solid-svg-icons';
import { getEmployerProfile, getBilling } from '@/lib/api/employer';
import { getFounderSlots } from '@/lib/api/landing';
import { PLAN_FEATURES, PLAN_DISPLAY_PRICE, type EmployerPlanTier, type PriceCohort } from '@agconn/schemas';
import { CheckoutButton } from '@/components/employer/CheckoutButton';
import { PlanCheckoutControls } from '@/components/employer/BillingIntervalSwitch';
import { DarkHeroCard } from '@/components/employer/primitives';

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: 'employer.billing' });
    return { title: `AGCONN — ${t('title')}` };
}

export default async function BillingPage({ params }: Props) {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: 'employer.billing' });
    const [profile, billing, founderSlots] = await Promise.all([
        getEmployerProfile(),
        getBilling(),
        getFounderSlots(),
    ]);
    const plan: EmployerPlanTier = profile?.plan ?? 'free';
    const interval = profile?.planInterval;
    // Subscribed employers stay on whatever cohort they checked out at — once
    // you're on a Stripe price ID, the founder counter changing doesn't move you.
    // Free employers see what they'd pay if they upgraded today.
    const cohort: PriceCohort =
        billing?.priceCohort ?? (founderSlots.active ? 'founder' : 'standard');
    const renewsLabel = profile?.planCurrentPeriodEnd
        ? profile.planCancelAtPeriodEnd
            ? t('ends_on', {
                date: new Date(profile.planCurrentPeriodEnd).toLocaleDateString(locale, {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                }),
            })
            : t('renews_on', {
                date: new Date(profile.planCurrentPeriodEnd).toLocaleDateString(locale, {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                }),
            })
        : null;

    return (
        <div className=" px-5 pb-16 pt-8">
            <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
                <div>
                    <p className="text-base-content/60 font-mono text-xs uppercase tracking-wider">
                        {t('eyebrow')}
                    </p>
                    <h1 className="font-display mt-2 text-4xl font-light leading-tight tracking-tight md:text-5xl">
                        {t('title_a')} <em className="text-primary not-italic font-light">{t('title_b')}</em>
                    </h1>
                    {renewsLabel && (
                        <p className="text-base-content/70 mt-2 text-sm">{renewsLabel}</p>
                    )}
                </div>
                {plan !== 'free' && (
                    <CheckoutButton mode="portal" label={t('manage_billing')} />
                )}
            </div>

            <div className="mb-7">
                <DarkHeroCard glow="gold">
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-[1fr_auto] md:items-end">
                        <div>
                            <p className="text-accent font-mono text-xs uppercase tracking-wider">
                                {t('current_plan')}
                            </p>
                            <h2 className="font-display mt-2 text-5xl font-light leading-none tracking-tight">
                                {t(plan)}
                            </h2>
                            <p className="text-base-100/75 mt-2 text-sm">
                                {interval ? t(interval) : '—'}
                                {billing?.hasPaymentMethod ? ` · ${t('payment_saved')}` : ''}
                            </p>
                        </div>
                        {billing && (
                            <div className="grid grid-cols-3 gap-4 text-xs">
                                <div>
                                    <div className="text-base-100/60 font-mono uppercase tracking-wider">
                                        {t('feature.active_postings_limit')}
                                    </div>
                                    <div className="font-display mt-1 text-2xl font-light tabular-nums slashed-zero">
                                        {billing.features.activePostings === -1
                                            ? '∞'
                                            : billing.features.activePostings}
                                    </div>
                                </div>
                                <div>
                                    <div className="text-base-100/60 font-mono uppercase tracking-wider">
                                        {t('feature.worker_search')}
                                    </div>
                                    <div className="mt-1.5">
                                        <FontAwesomeIcon
                                            icon={billing.features.workerSearch ? faCheck : faXmark}
                                            className={billing.features.workerSearch ? 'text-accent' : 'text-base-100/40'}
                                        />
                                    </div>
                                </div>
                                <div>
                                    <div className="text-base-100/60 font-mono uppercase tracking-wider">
                                        {t('feature.priority_listing')}
                                    </div>
                                    <div className="mt-1.5">
                                        <FontAwesomeIcon
                                            icon={billing.features.priorityListing ? faCheck : faXmark}
                                            className={billing.features.priorityListing ? 'text-accent' : 'text-base-100/40'}
                                        />
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </DarkHeroCard>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                {(['free', 'pro', 'enterprise'] as const).map((tier) => (
                    <PlanTierCard
                        key={tier}
                        tier={tier}
                        current={plan}
                        cohort={cohort}
                        t={t}
                        stripeConfigured={billing?.stripeConfigured ?? false}
                    />
                ))}
            </div>

            {billing && !billing.stripeConfigured && (
                <div className="bg-warning/15 text-warning-content mt-6 rounded-xl p-4 text-sm">
                    {t('stripe_unavailable')}
                </div>
            )}
        </div>
    );
}

function PlanTierCard({
    tier,
    current,
    cohort,
    t,
    stripeConfigured,
}: {
    tier: EmployerPlanTier;
    current: EmployerPlanTier;
    cohort: PriceCohort;
    t: Awaited<ReturnType<typeof getTranslations>>;
    stripeConfigured: boolean;
}) {
    const features = PLAN_FEATURES[tier];
    const isCurrent = tier === current;
    const isFree = tier === 'free';

    const featureLines: string[] = [
        `${t('feature.active_postings')}: ${Number.isFinite(features.activePostings)
            ? String(features.activePostings)
            : t('feature.active_postings_unlimited')
        }`,
    ];
    if (features.workerSearch) featureLines.push(t('feature.worker_search'));
    if (features.priorityListing) featureLines.push(t('feature.priority_listing'));
    if (features.multiUser) featureLines.push(t('feature.multi_user'));
    if (features.customCounties) featureLines.push(t('feature.custom_counties'));
    if (features.brandedReports) featureLines.push(t('feature.branded_reports'));

    const price = PLAN_DISPLAY_PRICE[tier][cohort];
    const priceMonthly =
        price.monthly !== null ? `$${price.monthly}` : t('feature.active_postings_unlimited');
    const isEnterprise = tier === 'enterprise';

    return (
        <div
            data-tier={tier}
            className={[
                'card card-bordered card-compact bg-base-100 relative',
                isCurrent ? 'border-primary ring-primary/30 ring-2' : '',
            ].join(' ')}
        >
            <div className="card-body">
                {isCurrent && (
                    <div className="bg-primary text-primary-content absolute -top-2 right-4 rounded-full px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wider">
                        {t('current')}
                    </div>
                )}
                <h3 className="font-display text-2xl font-light tracking-tight">{t(tier)}</h3>
                <p className="text-base-content/60 mt-1 text-xs">{t(`pitch.${tier}`)}</p>
                {/* Static price only on the current paid plan (no interval toggle there).
                    For upgradeable tiers, PlanCheckoutControls owns the price so it
                    stays in sync with the monthly/yearly toggle. */}
                {!isFree && isCurrent && price.monthly !== null && (
                    <p className="text-base-content mt-3 flex items-baseline gap-2">
                        <span className="font-display text-3xl font-light tracking-tight tabular-nums slashed-zero">
                            {priceMonthly}
                        </span>
                        <span className="text-base-content/60 text-xs">{t('per_month')}</span>
                        {price.yearly !== null && (
                            <span className="text-base-content/55 ml-auto font-mono text-xs">
                                {t('or_yearly', { price: price.yearly })}
                            </span>
                        )}
                    </p>
                )}
                {isEnterprise && (
                    <p className="text-base-content/70 mt-4 text-xs font-semibold">
                        {t('enterprise_includes_pro')}
                    </p>
                )}
                <ul
                    className={[
                        'flex flex-col gap-2 text-sm',
                        isEnterprise ? 'mt-2' : 'mt-5',
                    ].join(' ')}
                >
                    {featureLines.map((line) => (
                        <li key={line} className="flex items-center gap-2">
                            <FontAwesomeIcon
                                icon={faCheck}
                                className="text-success h-3 w-3 shrink-0"
                            />
                            <span className="text-base-content">{line}</span>
                        </li>
                    ))}
                </ul>
                {!isFree && !isCurrent && (
                    <div className="mt-5">
                        <PlanCheckoutControls
                            tier={tier as 'pro' | 'enterprise'}
                            cohort={cohort}
                            disabled={!stripeConfigured}
                        />
                    </div>
                )}
            </div>
        </div>
    );
}
