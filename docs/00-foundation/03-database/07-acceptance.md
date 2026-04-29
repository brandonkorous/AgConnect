# 03 — Database: Acceptance Criteria

## Functional

- [ ] Every business-data Prisma model has `tenantId String @db.Uuid` and `@@index([tenantId])`.
- [ ] Every business-data table has RLS enabled and the standard policy set (`tenant_select`, `tenant_insert`, `tenant_update`, `tenant_delete`, `admin_bypass`).
- [ ] Every model with `updatedAt` has the `set_updated_at` trigger applied.
- [ ] `prisma migrate deploy` is idempotent — running it twice in a row produces no changes on the second run.
- [ ] Seed script runs cleanly against an empty database and produces dev data for at least 3 workers, 2 employers, 1 training org, 5 job postings.

## Non-functional

- [ ] Adding a new model + standard columns + RLS takes < 30 minutes (measured by an engineer following the convention checklist).
- [ ] The `check-tenant-id` and `check-rls` CI scripts run in < 30 seconds.
- [ ] Production migration deploy does not block API pod readiness for more than 60 seconds for any individual migration in MVP.

## Test scenarios

### Unit

1. Helper `notDeleted` excludes soft-deleted rows.
2. Bilingual column validation (Zod): a row missing `title_es` while having `title_en` fails validation in API layer.

### Integration

1. **RLS enforcement:** with `app.tenant_id` set, queries see only that tenant's rows; without it, queries return zero rows.
2. **Cross-tenant write rejection:** a transaction with `app.tenant_id = T_A` inserting `tenant_id = T_B` fails with `new row violates row-level security policy`.
3. **`migrate deploy` on empty DB:** runs all migrations, ends with the schema in [02-data-model.md](02-data-model.md) inventory.
4. **Migration idempotence:** running `migrate deploy` twice on a fresh DB does not error and produces the same schema.

### Manual

1. Pull the production schema with `prisma db pull` and confirm it matches the local schema.
2. Take a PITR backup, restore to a temp DB, and run the test suite — confirms backup integrity.

## Definition of done

- All standard convention items in [02-data-model.md](02-data-model.md) verified by CI scripts:
  - `check-tenant-id.ts`: every model except allowlist has `tenantId`.
  - `check-rls.ts`: every table has RLS enabled and required policies.
  - `check-soft-delete.ts`: every user-visible model has `deletedAt`.
  - `check-bilingual.ts`: every `*Es` column has a paired `*En`.
- A new engineer can clone the repo, run `pnpm install && pnpm dev`, and have a working DB with seed data in under 5 minutes.
