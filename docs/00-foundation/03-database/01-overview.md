# 03 — Database: Overview

## Purpose

The database layer provides a Postgres-backed data store with strict multi-tenant isolation, deterministic migrations, and consistent conventions across every feature. This doc captures the system-level decisions; per-feature schemas live in each feature's `02-data-model.md`.

## Stack

- **Postgres 16** on Azure Postgres Flexible Server
- **Prisma 7.8.0** as ORM and migration tool
- **PgBouncer** for connection pooling (transaction mode in front of the API; session mode for the queue worker)
- **Single primary** for MVP; read-replica deferred until KPI dashboards prove the need

## Design principles

1. **Multi-tenant by default.** Every business-data table has `tenant_id`. The only exempt tables are `tenants`, `migration_log`, and `auth_events` (which has nullable `tenant_id` for pre-tenant events).
2. **UUIDs everywhere.** All primary keys are UUID v4. No autoincrement integers — they leak business volume across tenants.
3. **Soft deletes.** All user-visible tables have `deletedAt` (`@map("deleted_at")`). Hard deletes are reserved for admin tools and the data-retention job.
4. **Bilingual columns.** User-facing text uses `_en` / `_es` paired columns. JSONB locale maps allowed only when the locale set might grow (currently never).
5. **Append-only audit.** `auth_events`, `application_events`, `sms_log`, `billing_events` are append-only. Never `UPDATE`; correct via new rows.
6. **No triggers for business logic.** Triggers are reserved for `updated_at` maintenance and for RLS support. All other behavior lives in the API.

## Naming conventions

- Table names: snake_case plural (`worker_profiles`, `job_postings`).
- Column names: snake_case (`first_name`, `created_at`).
- Prisma model names: PascalCase singular, `@@map` to the snake_case table name.
- Prisma field names: camelCase, `@map` to snake_case.
- Enums: PascalCase in Prisma, snake_case in Postgres (`enum role { worker employer ... }`).
- FKs: `<entity>_id` (`tenant_id`, `worker_id`, `program_id`).
- Booleans: `is_<adjective>` or unprefixed past participle (`is_verified`, `published`).
- Timestamps: `<verb>_at` (`created_at`, `hired_at`, `deleted_at`).

## Soft delete contract

Every soft-delete-capable model has:

```prisma
deletedAt DateTime? @map("deleted_at")
```

API queries always include `where: { deletedAt: null }`. Helper:

```ts
// packages/db/src/helpers.ts
export const notDeleted = { deletedAt: null };
// Usage: db.user.findMany({ where: { tenantId, ...notDeleted } });
```

Hard delete only via admin tooling (`DELETE FROM ... WHERE deleted_at IS NOT NULL AND deleted_at < now() - INTERVAL '90 days'`) — out of scope for MVP.

## updated_at maintenance

```sql
CREATE OR REPLACE FUNCTION set_updated_at() RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_set_updated_at BEFORE UPDATE ON <table>
FOR EACH ROW EXECUTE FUNCTION set_updated_at();
```

Applied to every table with `updated_at`. Prisma's `@updatedAt` works at the application layer; the trigger is a safety net for raw SQL writes.

## Scope

In scope:

- Prisma schema, migration tooling, seed scripts
- RLS policy template + per-feature application
- Index conventions
- Connection pooling configuration
- CI checks for `tenant_id` coverage and RLS coverage

Out of scope (for MVP):

- Read replicas
- Logical replication / CDC
- Per-tenant database sharding
- Encrypted columns at the application layer (Postgres TDE handles at-rest)

## Dependencies

- [01-multi-tenancy](../01-multi-tenancy/) — RLS template comes from here
- [10-infra-cicd](../10-infra-cicd/) — migration deploy step in CI/CD
