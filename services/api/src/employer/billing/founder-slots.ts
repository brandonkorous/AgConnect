import { dbClients, runWithRlsContext } from '@agconn/db';
import { TOTAL_FOUNDER_SLOTS, type PriceCohort } from '@agconn/schemas';

export type FounderSlots = {
  remaining: number;
  total: number;
  active: boolean;
};

/**
 * Live count of paid Field/Farm subscriptions across all tenants. Founder
 * pricing is a platform-wide promotion (first 50 paid accounts), so this
 * deliberately bypasses tenant scoping. The `service` role's RLS policy on
 * `employer_profiles` already permits cross-tenant reads.
 *
 * No counter table — the count is derived live so a missed webhook self-heals
 * on the next read. The webhook handler resets `plan='free'` and
 * `stripeSubId=null` on `customer.subscription.deleted`, so this filter
 * naturally re-admits the freed slot.
 *
 * When the doc'd `planStatus` / `priceCohort` columns land alongside the
 * Stripe wire-up, tighten the filter to include `planStatus IN
 * ('active','trialing','past_due')` so a `past_due` sub keeps its slot through
 * Stripe Smart Retries.
 */
export async function getFounderSlots(): Promise<FounderSlots> {
  const used = await runWithRlsContext({ role: 'service' }, async () =>
    dbClients.shared.employerProfile.count({
      where: {
        plan: { not: 'free' },
        stripeSubId: { not: null },
      },
    }),
  );
  const remaining = Math.max(0, TOTAL_FOUNDER_SLOTS - used);
  return { remaining, total: TOTAL_FOUNDER_SLOTS, active: remaining > 0 };
}

export async function resolveCheckoutCohort(): Promise<PriceCohort> {
  const slots = await getFounderSlots();
  return slots.active ? 'founder' : 'standard';
}
