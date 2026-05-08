import { z } from 'zod';

/**
 * Plan-tier feature matrix — the single source of truth for what each tier
 * can do. Endpoints check this matrix; UIs gate on the same values.
 *
 * See docs/20-employer/05-subscription-billing/02-data-model.md.
 *
 * DB enum stays `free | pro | enterprise` for stability. The marketing names
 * Seed / Field / Farm (EN) and Semilla / Campo / Rancho (ES) are presentation
 * concerns — see `PLAN_BRAND_NAME` below.
 */
export const EmployerPlanTierEnum = z.enum(['free', 'pro', 'enterprise']);
export type EmployerPlanTier = z.infer<typeof EmployerPlanTierEnum>;

export const PlanIntervalEnum = z.enum(['monthly', 'yearly']);
export type PlanInterval = z.infer<typeof PlanIntervalEnum>;

export type Features = {
  /** Max active job postings. `Infinity` = unlimited. */
  activePostings: number;
  workerSearch: boolean;
  priorityListing: boolean;
  multiUser: boolean;
  customCounties: boolean;
  brandedReports: boolean;
  /**
   * Whether the employer can fire SMS to applicants from kanban actions
   * (received / interview / hired / rejected). When false, status changes
   * write only an in-app inbox row — no Twilio enqueue. Workers continue to
   * receive platform-triggered SMS (job alerts on saved searches, training
   * reminders, account auth) regardless of this flag, since those flows
   * aren't tied to any specific employer's plan.
   */
  applicantSms: boolean;
};

/**
 * Marketing names per tier. The DB enum names (`pro`, `enterprise`) are
 * stable; brand names can change without a migration.
 */
export const PLAN_BRAND_NAME: Record<EmployerPlanTier, { en: string; es: string }> = {
  free: { en: 'Seed', es: 'Semilla' },
  pro: { en: 'Field', es: 'Campo' },
  enterprise: { en: 'Farm', es: 'Rancho' },
};

export function planBrandName(tier: EmployerPlanTier, locale: 'en' | 'es' = 'en'): string {
  return PLAN_BRAND_NAME[tier][locale];
}

/**
 * Display-only prices shown in the UI (USD). Real charges come from Stripe
 * via `priceIdFor(tier, interval, { founder })` — these constants stay in
 * sync with Stripe products manually. Don't use these for billing decisions.
 *
 * `standard` is the post-launch price (account 51+).
 * `founder` is the discounted price for the first 50 paid accounts across
 * Field and Farm combined.
 */
export const PLAN_DISPLAY_PRICE: Record<
  EmployerPlanTier,
  {
    standard: { monthly: number | null; yearly: number | null };
    founder: { monthly: number | null; yearly: number | null };
  }
> = {
  free: {
    standard: { monthly: 0, yearly: 0 },
    founder: { monthly: 0, yearly: 0 },
  },
  pro: {
    standard: { monthly: 199, yearly: 1990 },
    founder: { monthly: 99, yearly: 990 },
  },
  enterprise: {
    standard: { monthly: 499, yearly: 4990 },
    founder: { monthly: 299, yearly: 2990 },
  },
};

/**
 * Total founder slots across Field + Farm combined. Locked at 50 for the
 * launch cohort. When `count(active paid subscriptions) >= TOTAL_FOUNDER_SLOTS`,
 * standard pricing kicks in for new checkouts.
 */
export const TOTAL_FOUNDER_SLOTS = 50;

export const PLAN_FEATURES: Record<EmployerPlanTier, Features> = {
  free: {
    activePostings: 2,
    workerSearch: false,
    priorityListing: false,
    multiUser: false,
    customCounties: false,
    brandedReports: false,
    applicantSms: false,
  },
  pro: {
    activePostings: Number.POSITIVE_INFINITY,
    workerSearch: true,
    priorityListing: true,
    multiUser: false,
    customCounties: false,
    brandedReports: false,
    applicantSms: true,
  },
  enterprise: {
    activePostings: Number.POSITIVE_INFINITY,
    workerSearch: true,
    priorityListing: true,
    multiUser: true,
    customCounties: true,
    brandedReports: true,
    applicantSms: true,
  },
};

export function planFeatures(plan: EmployerPlanTier): Features {
  return PLAN_FEATURES[plan];
}

export function activePostingLimit(plan: EmployerPlanTier): number {
  return PLAN_FEATURES[plan].activePostings;
}

export function canUseFeature(
  plan: EmployerPlanTier,
  feature: keyof Omit<Features, 'activePostings'>,
): boolean {
  return PLAN_FEATURES[plan][feature];
}

export function isPaidTier(plan: EmployerPlanTier): boolean {
  return plan !== 'free';
}

type PaidTier = Exclude<EmployerPlanTier, 'free'>;

export type PriceCohort = 'standard' | 'founder';

/**
 * Resolve a Stripe price ID for a (tier, interval, cohort) triple from
 * environment. Eight env vars total: tier × interval × cohort.
 * Throws if unset — callers should check `hasPriceId` first.
 */
export function priceIdFor(
  tier: PaidTier,
  interval: PlanInterval,
  cohort: PriceCohort = 'standard',
): string {
  const key = priceEnvKey(tier, interval, cohort);
  const value = process.env[key];
  if (!value) {
    throw new Error(`stripe_price_unset:${key}`);
  }
  return value;
}

export function hasPriceId(
  tier: PaidTier,
  interval: PlanInterval,
  cohort: PriceCohort = 'standard',
): boolean {
  return Boolean(process.env[priceEnvKey(tier, interval, cohort)]);
}

/**
 * Reverse-lookup the tier (and interval) Stripe charged for. Searches both
 * cohorts — once a customer's price ID is locked in at checkout, it stays on
 * that price ID for the life of their subscription regardless of the founder
 * counter changing.
 */
export function priceIdToTier(priceId: string): EmployerPlanTier | null {
  for (const tier of ['pro', 'enterprise'] as const) {
    for (const interval of ['monthly', 'yearly'] as const) {
      for (const cohort of ['standard', 'founder'] as const) {
        if (process.env[priceEnvKey(tier, interval, cohort)] === priceId) return tier;
      }
    }
  }
  return null;
}

export function priceIdToInterval(priceId: string): PlanInterval | null {
  for (const tier of ['pro', 'enterprise'] as const) {
    for (const interval of ['monthly', 'yearly'] as const) {
      for (const cohort of ['standard', 'founder'] as const) {
        if (process.env[priceEnvKey(tier, interval, cohort)] === priceId) return interval;
      }
    }
  }
  return null;
}

export function priceIdToCohort(priceId: string): PriceCohort | null {
  for (const tier of ['pro', 'enterprise'] as const) {
    for (const interval of ['monthly', 'yearly'] as const) {
      for (const cohort of ['standard', 'founder'] as const) {
        if (process.env[priceEnvKey(tier, interval, cohort)] === priceId) return cohort;
      }
    }
  }
  return null;
}

function priceEnvKey(
  tier: PaidTier,
  interval: PlanInterval,
  cohort: PriceCohort,
): string {
  const tierPart = tier === 'pro' ? 'PRO' : 'ENT';
  const intervalPart = interval === 'monthly' ? 'MONTHLY' : 'YEARLY';
  const cohortPart = cohort === 'founder' ? '_FOUNDER' : '';
  return `STRIPE_PRICE_${tierPart}${cohortPart}_${intervalPart}`;
}
