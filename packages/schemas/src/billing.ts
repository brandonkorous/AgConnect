import { z } from 'zod';
import { EmployerPlanTierEnum, PlanIntervalEnum } from './plans';

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
});

export const BillingResponse = z.object({
  plan: EmployerPlanTierEnum,
  interval: PlanIntervalEnum.nullable(),
  currentPeriodEnd: z.string().datetime().nullable(),
  cancelAtPeriodEnd: z.boolean(),
  features: FeaturesSchema,
  hasPaymentMethod: z.boolean(),
  stripeConfigured: z.boolean(),              // false → checkout/portal disabled until Stripe wired
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
