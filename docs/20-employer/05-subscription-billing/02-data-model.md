# 05 — Subscription Billing: Data Model

## employer_profiles (extension)

Already defined in [01-flc-verification/02-data-model.md](../01-flc-verification/02-data-model.md). Billing-relevant fields:

```prisma
stripeCustomer    String?    @map("stripe_customer")     // cus_...
stripeSubId       String?    @map("stripe_sub_id")       // sub_...
plan              EmployerPlan @default(free)
planInterval      PlanInterval? @map("plan_interval")    // monthly | yearly
planCurrentPeriodEnd DateTime?  @map("plan_current_period_end")
planCancelAtPeriodEnd Boolean  @default(false) @map("plan_cancel_at_period_end")

enum EmployerPlan { free monthly annual }   // legacy field; deprecated — use plan + planInterval
enum PlanInterval { monthly yearly }
```

> **Inferred:** The original `EmployerPlan { free monthly annual }` enum conflates plan tier (Free/Pro/Enterprise) with billing interval. Refactor to two columns for clarity:
> - `plan: EmployerPlanTier { free pro enterprise }`
> - `planInterval: PlanInterval { monthly yearly }`
> The legacy `EmployerPlan` stays in DB for backward compat during migration. Implementation uses the new columns.

## Refactored plan columns

```prisma
plan          EmployerPlanTier @default(free)
planInterval  PlanInterval?

enum EmployerPlanTier { free pro enterprise }
enum PlanInterval { monthly yearly }
```

## billing_events (append-only)

```prisma
model BillingEvent {
  id              String   @id @default(uuid()) @db.Uuid
  tenantId        String   @db.Uuid              @map("tenant_id")
  employerId      String   @db.Uuid              @map("employer_id")
  eventType       String                          @map("event_type")    // stripe event name
  stripeEventId   String   @unique               @map("stripe_event_id")  // dedupe
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

## Plan-tier matrix

| feature | free | pro | enterprise |
|---|---|---|---|
| Active postings | 2 | unlimited | unlimited |
| Worker search | ❌ | ✅ | ✅ |
| Priority listing | ❌ | ✅ | ✅ |
| Multi-user account | ❌ | ❌ | ✅ |
| Custom county coverage | ❌ | ❌ | ✅ |
| Branded grant reports | ❌ | ❌ | ✅ |
| Billing portal | n/a | ✅ | ✅ |

Implemented as a feature-flag matrix in `packages/shared-types/src/plans.ts`:

```ts
export const PLAN_FEATURES: Record<EmployerPlanTier, Features> = {
  free:       { activePostings: 2,        workerSearch: false, priorityListing: false, multiUser: false, customCounties: false, brandedReports: false },
  pro:        { activePostings: Infinity, workerSearch: true,  priorityListing: true,  multiUser: false, customCounties: false, brandedReports: false },
  enterprise: { activePostings: Infinity, workerSearch: true,  priorityListing: true,  multiUser: true,  customCounties: true,  brandedReports: true  },
};
```

API endpoints check this matrix consistently. Single source of truth.

## Indexes

- `employer_profiles(stripeCustomer)` — webhook → employer lookup
- `billing_events(stripeEventId)` unique — webhook idempotency
- `billing_events(employerId, createdAt)` — billing history view
