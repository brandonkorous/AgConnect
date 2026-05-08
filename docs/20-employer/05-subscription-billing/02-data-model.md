# 05 — Subscription Billing: Data Model

## employer_profiles (extension)

Already defined in [01-flc-verification/02-data-model.md](../01-flc-verification/02-data-model.md). Billing-relevant fields:

```prisma
stripeCustomer        String?           @map("stripe_customer")          // cus_...
stripeSubId           String?           @map("stripe_sub_id")            // sub_...
plan                  EmployerPlanTier  @default(free)
planInterval          PlanInterval?     @map("plan_interval")            // monthly | yearly
planCurrentPeriodEnd  DateTime?         @map("plan_current_period_end")
planCancelAtPeriodEnd Boolean           @default(false) @map("plan_cancel_at_period_end")
priceCohort           PriceCohort?      @map("price_cohort")             // founder | standard; null for free
planStatus            PlanStatus?       @map("plan_status")              // mirrors Stripe subscription.status

enum EmployerPlanTier { free pro enterprise }
enum PlanInterval     { monthly yearly }
enum PriceCohort      { founder standard }
enum PlanStatus       { trialing active past_due canceled unpaid incomplete }
```

The DB enum stays `free | pro | enterprise` for stability — marketing names (Seed / Field / Farm; Semilla / Campo / Rancho) are presentation-only and resolved by `planBrandName(tier, locale)` in `@agconn/schemas`.

`priceCohort` records which Stripe price ID the customer was actually charged at checkout. Used to:

1. Render the right historical price in the billing UI ("$99/mo founder pricing" vs "$199/mo").
2. Avoid drift if the founder cohort is exhausted: existing founder subscribers stay on their original price ID per Stripe semantics.

`planStatus` mirrors Stripe's `subscription.status` so the active-paid-count query (below) is one indexed scan instead of an external call.

## Founder-slot counter

No dedicated counter table. The remaining slots are derived live:

```sql
SELECT GREATEST(0, 50 - COUNT(*)) AS remaining
FROM employer_profiles
WHERE plan != 'free'
  AND stripe_sub_id IS NOT NULL
  AND plan_status IN ('active', 'trialing', 'past_due');
```

- Cheap (< 1ms with the supporting index below) and self-healing — if a webhook is ever missed, reconciling Stripe → DB fixes the count automatically.
- The same query is called from `GET /v1/landing/founder-slots` (cached 30s) and from `POST /v1/employer/billing/checkout` (no cache; recomputed at the moment of price-ID resolution).
- Cancellation frees the slot. If `customer.subscription.deleted` fires, `plan_status` flips to `canceled` and the slot returns to the pool for new sign-ups.

Supporting index:

```prisma
@@index([planStatus, plan], map: "idx_employer_profiles_plan_status_plan")
```

## billing_events (append-only)

```prisma
model BillingEvent {
  id              String   @id @default(uuid()) @db.Uuid
  tenantId        String   @db.Uuid              @map("tenant_id")
  employerId      String   @db.Uuid              @map("employer_id")
  eventType       String                          @map("event_type")     // stripe event name
  stripeEventId   String   @unique               @map("stripe_event_id") // dedupe
  payload         Json
  processedAt     DateTime?                       @map("processed_at")
  errorMsg        String?                         @map("error_msg")
  createdAt       DateTime @default(now())        @map("created_at")

  @@index([tenantId])
  @@index([employerId, createdAt])
  @@map("billing_events")
}
```

## RLS

`billing_events`:

```sql
CREATE POLICY billing_self ON billing_events FOR SELECT
  USING (employer_id = current_setting('app.user_id', true)::uuid);
CREATE POLICY billing_admin ON billing_events
  USING (current_setting('app.role', true) = 'admin');
```

The founder-slots count query runs as the public landing role — it returns only an aggregate count, no row data, so no RLS exposure concern.

## Plan-tier matrix

| feature | Seed (free) | Field (pro) | Farm (enterprise) |
|---|---|---|---|
| Active postings | 2 | unlimited | unlimited |
| SEO-indexed public job board | ✓ | ✓ | ✓ |
| Applicant kanban pipeline | ✓ | ✓ | ✓ |
| In-app inbox to applicants | ✓ | ✓ | ✓ |
| **SMS to applicants from kanban actions** | — | ✓ | ✓ |
| Worker search & invite-to-apply | — | ✓ | ✓ |
| Priority listing | — | ✓ | ✓ |
| Auto-match + renotify campaigns | — | ✓ | ✓ |
| Crew & shift scheduling | — | ✓ | ✓ |
| Crew SMS confirms / no-show tracking | — | ✓ | ✓ |
| Broadcast SMS / WhatsApp / in-app | — | ✓ | ✓ |
| Compliance checklist (H-2A / MSPA / DOL) | — | ✓ | ✓ |
| Audit log retention | 90 days | 7 years | 7 years |
| WIOA exports (CSV + XLSX) | — | ✓ | ✓ |
| Multi-user accounts & roles | — | — | ✓ |
| Custom county coverage | — | — | ✓ |
| Branded grant exports + PIRL | — | — | ✓ |
| Hire metrics dashboard (WIOA KPIs) | — | — | ✓ |
| Tenant-isolated participant data | — | — | ✓ |
| Dedicated success contact + SLA | — | — | ✓ |
| Billing portal | n/a | ✓ | ✓ |

**Workers always receive platform-triggered SMS** — new job alerts matching their saved searches, training reminders, account auth — regardless of which employer's posting matched. Those flows aren't tied to any employer's plan. The gate above only covers SMS *triggered by an employer's kanban action* (status updates from the employer's hiring funnel).

Implemented as a feature-flag matrix in `packages/schemas/src/plans.ts`:

```ts
export const PLAN_FEATURES: Record<EmployerPlanTier, Features> = {
  free:       { activePostings: 2,        workerSearch: false, priorityListing: false, multiUser: false, customCounties: false, brandedReports: false, applicantSms: false },
  pro:        { activePostings: Infinity, workerSearch: true,  priorityListing: true,  multiUser: false, customCounties: false, brandedReports: false, applicantSms: true  },
  enterprise: { activePostings: Infinity, workerSearch: true,  priorityListing: true,  multiUser: true,  customCounties: true,  brandedReports: true,  applicantSms: true  },
};
```

API endpoints check this matrix consistently. Single source of truth.

**Enforcement point for `applicantSms`:** the kanban-action → notification fan-out (in `services/api/src/employer/applications/*` or wherever status-change emits) must consult the employer's plan and **skip the SMS enqueue when `applicantSms === false`**, falling back to writing an in-app inbox row only. This gate must live at the enqueue site (not at the SMS worker) so a missed gate doesn't burn Twilio cost. The check is a single object lookup — same pattern as `canUseFeature(plan, 'workerSearch')`.

## Display prices

Display-only, drives the marketing UI. Real charges resolve via `priceIdFor(tier, interval, cohort)`.

```ts
export const PLAN_DISPLAY_PRICE: Record<EmployerPlanTier, {
  standard: { monthly: number | null; yearly: number | null };
  founder:  { monthly: number | null; yearly: number | null };
}> = {
  free:       { standard: { monthly: 0,   yearly: 0    }, founder: { monthly: 0,   yearly: 0    } },
  pro:        { standard: { monthly: 199, yearly: 1990 }, founder: { monthly: 99,  yearly: 990  } },
  enterprise: { standard: { monthly: 499, yearly: 4990 }, founder: { monthly: 299, yearly: 2990 } },
};

export const TOTAL_FOUNDER_SLOTS = 50;
```

## Indexes

- `employer_profiles(stripeCustomer)` — webhook → employer lookup
- `employer_profiles(planStatus, plan)` — founder-counter scan
- `billing_events(stripeEventId)` unique — webhook idempotency
- `billing_events(employerId, createdAt)` — billing history view
