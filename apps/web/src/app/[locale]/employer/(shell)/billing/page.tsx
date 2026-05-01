import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheck, faXmark } from '@fortawesome/free-solid-svg-icons';
import { getEmployerProfile } from '@/lib/api/employer';
import { PLAN_FEATURES, type EmployerPlanTier } from '@agconn/schemas';
import { CheckoutButton } from '@/components/employer/CheckoutButton';

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'employer.billing' });
  return { title: `AgConn — ${t('title')}` };
}

export default async function BillingPage({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'employer.billing' });
  const profile = await getEmployerProfile();
  const plan: EmployerPlanTier = profile?.plan ?? 'free';

  return (
    <div className="px-8 pb-16 pt-8">
      <div className="mb-8">
        <h1 className="font-display text-4xl font-light leading-tight tracking-tight">
          {t('title')}
        </h1>
      </div>

      <section className="bg-base-100 border-base-300 mb-8 rounded-2xl border p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-base-content/60 font-mono text-[11px] uppercase tracking-wider">
              {t('current_plan')}
            </p>
            <h2 className="font-display mt-1 text-2xl font-light">{t(plan)}</h2>
            {profile?.planInterval && (
              <p className="text-base-content/60 mt-1 text-xs">{t(profile.planInterval)}</p>
            )}
          </div>
          {plan !== 'free' && (
            <CheckoutButton mode="portal" label={t('manage_billing')} />
          )}
        </div>
        {profile?.planCurrentPeriodEnd && (
          <p className="text-base-content/60 mt-3 text-xs">
            {profile.planCancelAtPeriodEnd
              ? t('ends_on', { date: new Date(profile.planCurrentPeriodEnd).toLocaleDateString(locale) })
              : t('renews_on', { date: new Date(profile.planCurrentPeriodEnd).toLocaleDateString(locale) })}
          </p>
        )}
      </section>

      <div className="grid gap-4 md:grid-cols-3">
        {(['free', 'pro', 'enterprise'] as const).map((tier) => (
          <PlanCard key={tier} tier={tier} current={plan} t={t} locale={locale} />
        ))}
      </div>
    </div>
  );
}

function PlanCard({
  tier,
  current,
  t,
  locale,
}: {
  tier: EmployerPlanTier;
  current: EmployerPlanTier;
  t: Awaited<ReturnType<typeof getTranslations>>;
  locale: string;
}) {
  const features = PLAN_FEATURES[tier];
  const isCurrent = tier === current;
  const isFree = tier === 'free';

  return (
    <article
      className={[
        'rounded-2xl border p-5',
        isCurrent ? 'border-primary bg-primary/5' : 'bg-base-100 border-base-300',
      ].join(' ')}
    >
      <h3 className="font-display text-2xl font-light">{t(tier)}</h3>
      <ul className="mt-4 flex flex-col gap-2 text-sm">
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
        <CheckoutButton
          mode="checkout"
          tier={tier as 'pro' | 'enterprise'}
          label={tier === 'pro' ? t('upgrade_pro') : t('upgrade_enterprise')}
        />
      )}
    </article>
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
      {value && <span className="ml-auto font-mono text-xs">{value}</span>}
    </li>
  );
}
