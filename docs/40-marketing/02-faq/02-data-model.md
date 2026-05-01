# 02 — FAQ: Data Model

The FAQ is static config in v1. No database tables.

## Static config

```
apps/web/src/app/[locale]/(marketing)/_data/
  faq.ts          # 8 landing-shared entries (re-exported from landing)
  faq-extras.ts   # 4–6 standalone-only entries surfaced on /faq but not landing
```

Shape:

```ts
export interface FaqEntry {
  id: string;        // kebab-case slug — used as anchor (#id) and JSON-LD @id
  question: string;  // already locale-resolved by next-intl
  answer: string;    // already locale-resolved
}
```

## Source: landing-shared entries (8)

The 8 entries surfaced on both landing and `/faq` come from the existing `landing.faq.q1.question` / `landing.faq.q1.answer` keys (see [40-marketing/01-landing/05-i18n.md](../01-landing/05-i18n.md) section 15). Their slugs:

| id (slug) | landing key root |
|---|---|
| `how-find-work` | `landing.faq.q1` |
| `flc-verification` | `landing.faq.q2` |
| `phone-only-signup` | `landing.faq.q3` |
| `bilingual-policy` | `landing.faq.q4` |
| `pricing-employers` | `landing.faq.q5` |
| `cdfa-training-cost` | `landing.faq.q6` |
| `skills-wallet` | `landing.faq.q7` |
| `where-counties` | `landing.faq.q8` |

## Source: standalone-only extras

```ts
// apps/web/src/app/[locale]/(marketing)/_data/faq-extras.ts
export const FAQ_EXTRA_IDS = [
  'data-privacy',           // What does AgConn do with my phone number?
  'wage-disputes',          // What if my employer pays less than the posted wage?
  'training-cert-validity', // Does my CDFA cert work outside California?
  'employer-payouts',       // When does an employer get charged?
  'tenant-onboarding',      // Can a workforce board run their own AgConn instance?
  'platform-uptime',        // What's the SLA / uptime?
] as const;
```

i18n keys: `marketing.faq_extras.<id>.question` and `.answer`.

> **Inferred:** Six extras balances depth without overloading the page. Keep total under 14 entries — past that, search/categorization becomes necessary and the spec needs to grow.

## Static-config alternative considered

A DB-backed `faq_entries` table with an admin UI was considered and deferred. The decision will revisit at v2 if any of:

- Editorial cadence exceeds monthly
- Distinct EN/ES editors need separate workflows
- Categorization (worker/employer/training-org tabs) becomes necessary
- Total entry count exceeds 20

When migrating, schema would be:

```prisma
model FaqEntry {
  id           String   @id @default(uuid()) @db.Uuid
  tenantId     String?  @db.Uuid              // null = global, present = per-tenant override
  slug         String   @unique
  questionEn   String
  questionEs   String
  answerEn     String   @db.Text
  answerEs     String   @db.Text
  category     FaqCategory?  // workers | employers | training_orgs | platform
  position     Int      @default(0)
  publishedAt  DateTime?
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
}
```

## Reads

The `/faq` RSC reads both static configs at build time. No runtime DB query.

## Writes

None. (FAQ submission form is out of scope; user goes to `mailto:` instead.)

## Indexes

N/A — static config.

## RLS

N/A.
