import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheck, faXmark } from '@fortawesome/free-solid-svg-icons';
import { getEmployerProfile, getBilling } from '@/lib/api/employer';
import { PLAN_FEATURES, PLAN_DISPLAY_PRICE, type EmployerPlanTier } from '@agconn/schemas';
import { CheckoutButton } from '@/components/employer/CheckoutButton';
import { PlanCheckoutControls } from '@/components/employer/BillingIntervalSwitch';

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'employer.billing' });
  return { title: `AgConn — ${t('title')}` };
}

export default async function BillingPage({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'employer.billing' });
  const [profile, billing] = await Promise.all([getEmployerProfile(), getBilling()]);
  const plan: EmployerPlanTier = profile?.plan ?? 'free';
  const interval = profile?.planInterval;
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
    <div className="px-5 md:px-8 lg:px-20 pb-16 pt-8">
      <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-base-content/60 font-mono text-[11px] uppercase tracking-wider">
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

      <section className="bg-base-content text-base-100 relative mb-7 overflow-hidden rounded-2xl p-7">
        <div
          aria-hidden
          className="absolute inset-0 bg-[radial-gradient(ellipse_70%_80%_at_100%_0%,rgba(245,158,11,0.25),transparent_60%)]"
        />
        <div className="relative grid gap-6 md:grid-cols-[1fr_auto] md:items-end">
          <div>
            <p className="text-accent font-mono text-[11px] uppercase tracking-wider">
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
            <div className="grid grid-cols-3 gap-4 text-[11px]">
              <div>
                <div className="text-base-100/60 font-mono uppercase tracking-wider">
                  {t('feature.active_postings')}
                </div>
                <div className="font-display mt-1 text-2xl font-light">
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
      </section>

      <div className="grid gap-4 md:grid-cols-3">
        {(['free', 'pro', 'enterprise'] as const).map((tier) => (
          <PlanCard
            key={tier}
            tier={tier}
            current={plan}
            t={t}
            locale={locale}
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

function PlanCard({
  tier,
  current,
  t,
  locale,
  stripeConfigured,
}: {
  tier: EmployerPlanTier;
  current: EmployerPlanTier;
  t: Awaited<ReturnType<typeof getTranslations>>;
  locale: string;
  stripeConfigured: boolean;
}) {
  const features = PLAN_FEATURES[tier];
  const isCurrent = tier === current;
  const isFree = tier === 'free';
  void locale;

  return (
    <article
      className={[
        'relative rounded-2xl border p-6',
        isCurrent
          ? 'border-primary bg-primary/5 ring-primary/30 ring-2'
          : 'bg-base-100 border-base-300',
      ].join(' ')}
    >
      {isCurrent && (
        <div className="bg-primary text-primary-content absolute -top-2 right-4 rounded-full px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wider">
          {t('current')}
        </div>
      )}
      <h3 className="font-display text-2xl font-light tracking-tight">{t(tier)}</h3>
      <p className="text-base-content/60 mt-1 text-xs">{t(`pitch.${tier}`)}</p>

      <PlanPrice tier={tier} t={t} />

      <ul className="mt-5 flex flex-col gap-2 text-sm">
        <FeatureLine
          on={true}
          label={t('feature.active_postings')}
          value={
            Number.isFinite(features.activePostings)
              ? String(features.activePostings)
              : t('feature.active_postings_unlimited')
          }
        />
        <FeatureLine on={features.workerSearch} label={t('feature.worker_search')} />
        <FeatureLine on={features.priorityListing} label={t('feature.priority_listing')} />
        <FeatureLine on={features.multiUser} label={t('feature.multi_user')} />
        <FeatureLine on={features.customCounties} label={t('feature.custom_counties')} />
        <FeatureLine on={features.brandedReports} label={t('feature.branded_reports')} />
      </ul>

      {!isFree && !isCurrent && (
        <div className="mt-5">
          <PlanCheckoutControls
            tier={tier as 'pro' | 'enterprise'}
            disabled={!stripeConfigured}
          />
          {!stripeConfigured && (
            <p className="text-base-content/55 mt-2 text-[11px]">
              {t('stripe_unavailable')}
            </p>
          )}
        </div>
      )}
    </article>
  );
}

function PlanPrice({
  tier,
  t,
}: {
  tier: EmployerPlanTier;
  t: Awaited<ReturnType<typeof getTranslations>>;
}) {
  const price = PLAN_DISPLAY_PRICE[tier];
  if (price.monthly === null) return null;
  if (tier === 'free') {
    return (
      <p className="text-base-content font-display mt-3 text-3xl font-light tracking-tight">
        {t('price_free')}
      </p>
    );
  }
  return (
    <p className="text-base-content mt-3 flex items-baseline gap-2">
      <span className="font-display text-3xl font-light tracking-tight">
        ${price.monthly}
      </span>
      <span className="text-base-content/60 text-xs">{t('per_month')}</span>
      {price.yearly !== null && (
        <span className="text-base-content/55 ml-auto font-mono text-[11px]">
          {t('or_yearly', { price: price.yearly })}
        </span>
      )}
    </p>
  );
}

function FeatureLine({
  on,
  label,
  value,
}: {
  on: boolean;
  label: string;
  value?: string;
}) {
  return (
    <li className="flex items-center gap-2">
      <FontAwesomeIcon
        icon={on ? faCheck : faXmark}
        className={['h-3 w-3 shrink-0', on ? 'text-success' : 'text-base-content/30'].join(' ')}
      />
      <span className={on ? 'text-base-content' : 'text-base-content/40'}>{label}</span>
      {value && <span className="ml-auto font-mono text-xs font-semibold">{value}</span>}
    </li>
  );
}
