# 03 — Database: Schema Conventions & Inventory

## Schema layout

Single Postgres database, single schema (`public`). Multi-tenancy via `tenant_id` column, NOT multi-schema.

> **Inferred:** Schema-per-tenant or DB-per-tenant were rejected because (a) connection pooling becomes painful, (b) cross-tenant admin queries get awkward, (c) migration fan-out is expensive. Reconsider only if a tenant requires data residency we can't satisfy at the row level.

## Standard column set

Every business-data table includes:

```prisma
id          String    @id @default(uuid()) @db.Uuid
tenantId    String    @db.Uuid              @map("tenant_id")
createdAt   DateTime  @default(now())       @map("created_at")
updatedAt   DateTime  @updatedAt            @map("updated_at")
deletedAt   DateTime?                       @map("deleted_at")

@@index([tenantId])
@@map("<snake_case_table_name>")
```

Append-only event tables omit `updatedAt` and `deletedAt`.

## Bilingual columns

User-facing text gets paired columns:

```prisma
titleEn       String   @map("title_en")
titleEs       String   @map("title_es")
descriptionEn String   @map("description_en")
descriptionEs String   @map("description_es")
```

When more than two locales might exist (none planned for MVP), use a JSONB locale map:

```prisma
title Json   // { en: "...", es: "...", pt: "..." }
```

Validation enforces the active locale set via Zod.

## JSONB conventions

- Always validate the JSONB shape at write time with a Zod schema.
- Validate at read time only at trust boundaries (not on every internal access).
- Index JSONB only when filtered/sorted (`CREATE INDEX ... USING gin(<column>)`).
- Avoid deeply nested JSONB; if depth > 3 levels, normalize to a child table.

## Inventory of tables (cross-feature)

| table | feature | notes |
|---|---|---|
| `tenants` | [01-multi-tenancy](../01-multi-tenancy/) | global; no `tenant_id` |
| `users` | [02-auth](../02-auth/) | mirrored from Clerk |
| `auth_events` | [02-auth](../02-auth/) | append-only |
| `worker_profiles` | [10-worker/01-onboarding](../../10-worker/01-onboarding/) | |
| `employer_profiles` | [20-employer/01-flc-verification](../../20-employer/01-flc-verification/) | |
| `job_postings` | [20-employer/02-job-postings](../../20-employer/02-job-postings/) | |
| `applications` | [10-worker/04-application-tracker](../../10-worker/04-application-tracker/) | |
| `application_events` | [10-worker/04-application-tracker](../../10-worker/04-application-tracker/) | append-only |
| `training_programs` | [10-worker/05-training-browser](../../10-worker/05-training-browser/) | |
| `enrollments` | [10-worker/05-training-browser](../../10-worker/05-training-browser/) | |
| `saved_searches` | [10-worker/03-job-discovery](../../10-worker/03-job-discovery/) | |
| `sms_log` | [05-sms-pipeline](../05-sms-pipeline/) | append-only |
| `email_log` | [06-email-pipeline](../06-email-pipeline/) | append-only |
| `billing_events` | [20-employer/05-subscription-billing](../../20-employer/05-subscription-billing/) | append-only |
| `waitlist` | [10-worker/01-onboarding](../../10-worker/01-onboarding/) | nullable `tenant_id` |
| `migration_log` | this feature | global; no `tenant_id` |

Per-feature schema details live in each feature's `02-data-model.md`.

## migration_log

```prisma
model MigrationLog {
  id             String   @id @default(uuid()) @db.Uuid
  prismaName     String   @unique @map("prisma_name")
  appliedAt      DateTime @default(now()) @map("applied_at")
  appliedBy      String                       @map("applied_by")    // CI run id or admin user
  rollbackSql    String?                      @map("rollback_sql")  // optional manual rollback hint
  notes          String?

  @@map("migration_log")
}
```

Prisma's own `_prisma_migrations` table is the source of truth; `migration_log` is for our human notes (who, why, manual rollback procedure).

## Index conventions

- Always index `tenant_id`.
- Composite indexes lead with `tenant_id` if the column is filtered by tenant + something else (which it always is).
- Indexes on `<entity>_id` FKs are added by Prisma automatically — verify with `\d <table>` after migration.
- GIN indexes on `text[]` columns used for tag search (`worker_profiles.skills`).
- Partial indexes for hot-path queries: `CREATE INDEX ON applications(tenant_id, worker_id) WHERE status IN ('applied', 'reviewed');`.

## Enum conventions

Enums are defined once in Prisma and reused. Don't replicate enum values as Zod literals — derive Zod from the Prisma enum:

```ts
// packages/shared-types/src/enums.ts
import { Role } from '@prisma/client';
export const RoleSchema = z.nativeEnum(Role);
```

Adding a value to an enum requires a migration:

```sql
ALTER TYPE "Role" ADD VALUE 'organizer';
```

Note: removing values or renaming requires creating a new enum, migrating data, and dropping the old one — an expensive operation. Treat enums as nearly-additive-only.
