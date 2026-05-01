# 04 — i18n: Data Model

## Storage rules

User-facing content stored in the database uses paired `_en` / `_es` columns. Never a single translated blob. Never JSONB locale maps for the EN/ES set (JSONB only when locale set might grow — not the case for MVP).

### Examples

```prisma
// job_postings
titleEn         String   @map("title_en")
titleEs         String   @map("title_es")
descriptionEn   String   @map("description_en")
descriptionEs   String   @map("description_es")

// training_programs
titleEn         String   @map("title_en")
titleEs         String   @map("title_es")
summaryEn       String?  @map("summary_en")
summaryEs       String?  @map("summary_es")
```

## CHECK constraints

Both columns are required at the schema level when the field is required:

```sql
ALTER TABLE job_postings
  ADD CONSTRAINT title_en_not_empty CHECK (length(trim(title_en)) > 0),
  ADD CONSTRAINT title_es_not_empty CHECK (length(trim(title_es)) > 0);
```

For optional bilingual fields (`summary`), enforce all-or-nothing:

```sql
ALTER TABLE training_programs
  ADD CONSTRAINT summary_pair CHECK (
    (summary_en IS NULL AND summary_es IS NULL) OR
    (summary_en IS NOT NULL AND summary_es IS NOT NULL)
  );
```

## users.preferred_lang

Defined in [02-auth/02-data-model.md](../02-auth/02-data-model.md):

```prisma
preferredLang Lang @default(es) @map("preferred_lang")
enum Lang { en es }
```

Source of truth for which locale to use for SMS, email, and default landing.

## UI translations: `translation_keys` table (DB-backed since 2026-05-01)

The single source of truth for all UI copy is the `translation_keys` Postgres table. The previous file-based `apps/web/messages/{en,es}.json` pattern was migrated out 2026-05-01 (see migration `20260501130000_translation_keys`).

### Schema

```prisma
model TranslationKey {
  id          String            @id @default(uuid()) @db.Uuid
  tenantId    String?           @db.Uuid          @map("tenant_id")  // null = global default
  namespace   String                                                 // first segment, e.g. "marketing", "landing", "brand"
  key         String                                                 // dot-path within namespace, e.g. "faq_page.headline"
  locale      Lang
  value       String            @db.Text
  status      TranslationStatus @default(published)
  reviewedBy  String?                              @map("reviewed_by")
  reviewedAt  DateTime?                            @map("reviewed_at")
  publishedAt DateTime?                            @map("published_at")
  createdAt   DateTime          @default(now())    @map("created_at")
  updatedAt   DateTime          @updatedAt         @map("updated_at")

  tenant      Tenant?           @relation(fields: [tenantId], references: [id], onDelete: Cascade)

  @@index([tenantId, locale])
  @@index([namespace, locale])
  @@map("translation_keys")
}

enum TranslationStatus {
  draft
  needs_review
  reviewed
  published
}
```

### Uniqueness via partial indexes

Standard SQL unique constraints treat NULL as distinct, which would allow duplicate global rows. Two **partial unique indexes** in the migration enforce the right shape:

```sql
CREATE UNIQUE INDEX "translation_keys_global_unique"
    ON "translation_keys" ("namespace", "key", "locale")
    WHERE "tenant_id" IS NULL;

CREATE UNIQUE INDEX "translation_keys_tenant_unique"
    ON "translation_keys" ("tenant_id", "namespace", "key", "locale")
    WHERE "tenant_id" IS NOT NULL;
```

Prisma doesn't model partial indexes, so the `@@unique` decorator is intentionally omitted from the schema. Don't add it back — the SQL layer handles it.

### Tenant override resolution

Rows with `tenant_id IS NULL` are the global default. Rows with a specific `tenant_id` override the global default for that tenant only — same `(namespace, key, locale)` is allowed across the global and any number of tenant rows.

Resolution happens at load time in `apps/web/src/i18n/messages.ts`:

```ts
// Pseudocode of the resolution logic
const globals = rows.filter(r => r.tenantId === null);
const overrides = rows.filter(r => r.tenantId === currentTenantId);
// Merge: overrides win on the same (namespace, key)
return assemble([...globals, ...overrides]);
```

This lets a workforce-board tenant swap a piece of copy (e.g., `brand.product_name` for their own brand, or a tagline that names their region) without forking the codebase.

### RLS

```sql
-- admin: full access (used by seed scripts, admin app, ops tooling)
CREATE POLICY "translation_keys_admin"
  FOR ALL USING (current_setting('app.role', true) = 'admin')
  WITH CHECK (current_setting('app.role', true) = 'admin');

-- service: SELECT only on published rows scoped to (current tenant OR global default)
CREATE POLICY "translation_keys_service_read"
  FOR SELECT USING (
    current_setting('app.role', true) = 'service'
    AND status = 'published'
    AND (tenant_id IS NULL OR tenant_id = current_setting('app.tenant_id', true)::uuid)
  );
```

### Read pattern (RSC)

```ts
// apps/web/src/i18n/messages.ts
export async function getMessages(locale: Locale, tenantId: string | null = null) {
    const cached = unstable_cache(
        async () => loadFromDb(locale, tenantId),
        ['messages', locale, tenantId ?? 'global'],
        {
            revalidate: 300,
            tags: ['messages', `messages:${tenantId ?? 'global'}`, `messages:${tenantId ?? 'global'}:${locale}`],
        },
    );
    return cached();
}
```

After admin writes, call `revalidateTag('messages:{tenant}')` to bust cache. Edit-to-live latency is sub-5-min (300s revalidate cap) without redeploys.

### Write pattern (seed)

The seed script at [packages/db/scripts/seed-translations.ts](../../../packages/db/scripts/seed-translations.ts) is the authoritative source for global-default content. It's idempotent — run any time to upsert the canonical values. As long as the admin CMS isn't built yet, the seed file is the source of truth for new copy:

```bash
pnpm --filter @agconn/db i18n:seed
```

Each agent owns the namespaces they ship: 10-worker writes `worker.*`, 20-employer writes `employer.*`, 40-marketing writes `marketing.*` and `landing.*`, etc. All of them edit the same seed file (or their own seed wedges merged into it).

Once the admin app's CMS UI ships (post-launch, per [PROJECT-PLAN.md](../../PROJECT-PLAN.md) Phase 5+), the seed becomes the bootstrap path for fresh deploys; ongoing edits happen through the admin UI directly into the table.

### Parity check

Validates EN/ES coverage and ICU token consistency across all global rows:

```bash
pnpm --filter @agconn/db i18n:check
```

CI must run this on every PR. Source: [packages/db/scripts/check-i18n-parity.ts](../../../packages/db/scripts/check-i18n-parity.ts).

### Edge runtime carve-out

Edge-runtime routes (`/og/landing` and any future `runtime: 'edge'` route) **cannot hit Prisma directly** and must use code-based fallbacks for the few brand primitives they render. Convention:

```ts
// apps/web/src/app/og/landing/route.tsx (edge runtime)
const brand = process.env.NEXT_PUBLIC_BRAND_NAME ?? 'AgConn';
const headline = locale === 'es' ? 'Del campo, a tu futuro.' : 'From the field, to your future.';
```

Rationale: edge ImageResponse needs literal strings synchronously at construction time. Adding a separate edge-compatible DB client (Prisma Accelerate, neon-http) is out of scope for v1. Document any new edge route the same way.

### What stays NOT in `translation_keys`

This table is for UI copy. Other content types live where they already do:

- **User-generated content** (job postings, training programs, employer profile bilingual fields): paired `_en` / `_es` columns on the owning model — see "Storage rules" above.
- **Email and SMS templates**: rendered server-side from React Email / template files in `packages/messaging/`. Could migrate to DB later but not part of this initial cutover.
- **Resume schema labels**: derived from `ResumeSchema` enums in `packages/schemas/`.
- **Validation messages**: keys live in code (Zod adapter), values resolved through `translation_keys` like everything else.
- **ICU plural patterns with code-coupled keys**: e.g., a `{count, plural, =0 {…} =1 {…} other {…}}` pattern where the keys are tied to a switch in code stays a single value in the DB; the formatting logic stays in code.

## Zod i18n adapter

Validation messages use stable keys, not literal strings:

```ts
// packages/shared-types/src/zod-i18n.ts
import { z } from 'zod';
export const requiredString = (key: string) =>
  z.string({ message: key }).min(1, { message: 'common.validation.required' });
```

The API layer translates keys to messages using the request's locale before returning the response:

```ts
// apps/api/src/middleware/zod-error.ts
export const zodErrorHandler = (err: ZodError, locale: Locale) => ({
  errors: err.issues.map((i) => ({
    path: i.path.join('.'),
    message: t(locale, i.message),     // i.message is a key like 'common.validation.required'
  })),
});
```

## Indexes

Bilingual columns don't typically need indexes — search uses Postgres FTS on a generated tsvector that combines both languages. Example:

```sql
ALTER TABLE job_postings
  ADD COLUMN search tsvector
  GENERATED ALWAYS AS (
    setweight(to_tsvector('english', coalesce(title_en, '')), 'A') ||
    setweight(to_tsvector('spanish', coalesce(title_es, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(description_en, '')), 'B') ||
    setweight(to_tsvector('spanish', coalesce(description_es, '')), 'B')
  ) STORED;

CREATE INDEX job_postings_search_idx ON job_postings USING gin(search);
```

This lets a single full-text query match in either language. See [10-worker/03-job-discovery](../../10-worker/03-job-discovery/).
