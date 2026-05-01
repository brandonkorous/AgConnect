import { z } from 'zod';

/**
 * Plan-tier feature matrix — the single source of truth for what each tier
 * can do. Endpoints check this matrix; UIs gate on the same values.
 *
 * See docs/20-employer/05-subscription-billing/02-data-model.md.
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
};

export const PLAN_FEATURES: Record<EmployerPlanTier, Features> = {
  free: {
    activePostings: 2,
    workerSearch: false,
    priorityListing: false,
    multiUser: false,
    customCounties: false,
    brandedReports: false,
  },
  pro: {
    activePostings: Number.POSITIVE_INFINITY,
    workerSearch: true,
    priorityListing: true,
    multiUser: false,
    customCounties: false,
    brandedReports: false,
  },
  enterprise: {
    activePostings: Number.POSITIVE_INFINITY,
    workerSearch: true,
    priorityListing: true,
    multiUser: true,
    customCounties: true,
    brandedReports: true,
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

/**
 * Resolve a Stripe price ID for a (tier, interval) pair from environment.
 * The four env vars are populated by the founder when Stripe products exist.
 * Throws if unset — callers should check `hasPriceId` first.
 */
export function priceIdFor(
  tier: Exclude<EmployerPlanTier, 'free'>,
  interval: PlanInterval,
): string {
  const key = priceEnvKey(tier, interval);
  const value = process.env[key];
  if (!value) {
    throw new Error(`stripe_price_unset:${key}`);
  }
  return value;
}

export function hasPriceId(
  tier: Exclude<EmployerPlanTier, 'free'>,
  interval: PlanInterval,
): boolean {
  return Boolean(process.env[priceEnvKey(tier, interval)]);
}

export function priceIdToTier(priceId: string): EmployerPlanTier | null {
  for (const tier of ['pro', 'enterprise'] as const) {
    for (const interval of ['monthly', 'yearly'] as const) {
      if (process.env[priceEnvKey(tier, interval)] === priceId) return tier;
    }
  }
  return null;
}

export function priceIdToInterval(priceId: string): PlanInterval | null {
  for (const tier of ['pro', 'enterprise'] as const) {
    for (const interval of ['monthly', 'yearly'] as const) {
      if (process.env[priceEnvKey(tier, interval)] === priceId) return interval;
    }
  }
  return null;
}

function priceEnvKey(
  tier: Exclude<EmployerPlanTier, 'free'>,
  interval: PlanInterval,
): string {
  const tierPart = tier === 'pro' ? 'PRO' : 'ENT';
  const intervalPart = interval === 'monthly' ? 'MONTHLY' : 'YEARLY';
  return `STRIPE_PRICE_${tierPart}_${intervalPart}`;
}
