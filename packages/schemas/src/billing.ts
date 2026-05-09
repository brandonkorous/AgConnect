import { z } from 'zod';
import { EmployerPlanTierEnum, PlanIntervalEnum } from './plans.js';

export const CheckoutBody = z
  .object({
    tier: z.enum(['pro', 'enterprise']),
    interval: PlanIntervalEnum,
    locale: z.enum(['en', 'es']).optional(),
  })
  .strict();
export type CheckoutBody = z.infer<typeof CheckoutBody>;

export const PortalBody = z
  .object({
    locale: z.enum(['en', 'es']).optional(),
  })
  .strict();
export type PortalBody = z.infer<typeof PortalBody>;

export const CheckoutResponse = z.object({
  url: z.string().url(),
});

export const PortalResponse = z.object({
  url: z.string().url(),
});

export const FeaturesSchema = z.object({
  activePostings: z.number(),                 // Infinity → JSON encodes as null; coerce client-side
  workerSearch: z.boolean(),
  priorityListing: z.boolean(),
  multiUser: z.boolean(),
  customCounties: z.boolean(),
  brandedReports: z.boolean(),
  applicantSms: z.boolean(),
});

export const BillingResponse = z.object({
  plan: EmployerPlanTierEnum,
  interval: PlanIntervalEnum.nullable(),
  currentPeriodEnd: z.string().datetime().nullable(),
  cancelAtPeriodEnd: z.boolean(),
  features: FeaturesSchema,
  hasPaymentMethod: z.boolean(),
  stripeConfigured: z.boolean(),              // false → checkout/portal disabled until Stripe wired
  priceCohort: z.enum(['standard', 'founder']).nullable(),  // which cohort this employer pays at; null for free
});

/**
 * Public response for the founder-slots counter. Drives the "X founder spots
 * remaining" badge on the pricing page and the price-ID picker in checkout.
 *
 * `remaining` is computed live from active paid subscriptions; safe to cache
 * for ~30s on the edge since the badge tolerates short staleness.
 */
export const FounderSlotsResponse = z.object({
  remaining: z.number().int().min(0),
  total: z.number().int(),
  active: z.boolean(),                                       // true when remaining > 0
});

export const BillingHistoryResponse = z.object({
  events: z.array(
    z.object({
      id: z.string().uuid(),
      eventType: z.string(),
      processedAt: z.string().datetime().nullable(),
      createdAt: z.string().datetime(),
    }),
  ),
});
