# 03 — Database: Edge Cases & Risks

## PgBouncer transaction mode + Prisma

Transaction-mode PgBouncer reuses connections across transactions. This breaks:

- Prepared statements (Prisma handles via `pgbouncer=true` flag — disables them).
- Session-level features (`SET app.tenant_id` without `LOCAL`).
- `LISTEN` / `NOTIFY` (we don't use these).

**Mitigation:** Every API request is wrapped in a transaction; `SET LOCAL` is scoped to the transaction. Background workers (`pg-boss`) connect via session-mode PgBouncer (separate pool) because they need `LISTEN/NOTIFY` and longer-lived connections.

## Long-running migrations

Adding `NOT NULL` to a 1M-row column takes minutes and locks the table. Behavior to avoid:

- `ALTER TABLE x ADD COLUMN y TYPE NOT NULL DEFAULT 'foo';` — locks the table.

**Pattern:** add the column nullable + default, backfill in batches, add a CHECK constraint, then `ALTER ... SET NOT NULL` after backfill. Migration files split into multiple steps if needed.

> **Inferred:** For MVP scale (< 100k rows), this isn't an issue. Add `pg_repack` and online-DDL workflows if any single table grows past 1M rows.

## Migration drift between environments

Engineer A's local DB has experimental columns from a branch; Engineer B's local DB has different ones. CI dev DB is shared and gets confused.

**Mitigation:**

- Each engineer runs an isolated local DB via Docker Compose.
- `prisma migrate dev` is local-only; never touches shared databases.
- The CI dev DB is reset on every PR run.
- Production has only `prisma migrate deploy`, which only applies committed migrations.

## Connection pool exhaustion

Default Prisma `connection_limit` is `num_cpus * 2 + 1`. On a 2-vCPU pod, that's 5. With 10 pods, that's 50 connections to PgBouncer, which fans out to whatever PgBouncer's upstream pool size is.

**Mitigation:**

- Pin `connection_limit=10` per pod for predictability.
- PgBouncer pool size = (pods × connection_limit) + headroom. Configure in Azure.
- Sentry alert on `connection_limit` errors.

## RLS bypass via service role

If an engineer accidentally runs Prisma without setting `app.tenant_id`, RLS still applies (queries return empty results). This is safer than the alternative (queries return ALL tenants), but can cause confusing "where did my data go?" bugs.

**Mitigation:**

- A startup check on the API: any handler that touches the DB without a tenant context throws in dev/CI.
- Dev banner shows the current `app.tenant_id` value when running locally.

## Prisma client stale after schema change

Engineer changes the schema, runs migrate, but forgets to regenerate the client. TypeScript shows old types; runtime errors.

**Mitigation:**

- `prisma migrate dev` regenerates the client automatically.
- `pnpm dev` script chains `prisma generate` before running.
- CI runs `prisma generate` then `tsc --noEmit` — type drift fails the build.

## Soft-delete leakage

Forgetting `where: { deletedAt: null }` is a common bug.

**Mitigation:**

- `notDeleted` helper used everywhere; ESLint custom rule warns on `findMany` without `notDeleted` or explicit `deletedAt` filter.
- Integration test: insert a row, soft-delete it, assert it does NOT appear in any list endpoint.

## Index bloat

GIN indexes on `worker_profiles.skills` accumulate dead tuples on heavy update workloads.

**Mitigation:**

- Auto-vacuum on; tune `autovacuum_vacuum_scale_factor` to 0.1 on large tables.
- Quarterly `REINDEX CONCURRENTLY` job for GIN indexes (out of scope for MVP).

## Time zones

All timestamps in `timestamptz`. Application code uses UTC; UI converts to America/Los_Angeles for display. SMS quiet hours computed against `America/Los_Angeles` regardless of server tz.

**Risk:** mixing `timestamp` (no tz) with `timestamptz` is a time-zone footgun. Schema check: zero `timestamp without time zone` columns allowed.

## Connection encryption

Azure Postgres Flexible Server defaults to TLS 1.2+. Prisma URL must include `sslmode=require`. Without it, the connection works but isn't encrypted — silent risk.

**Mitigation:** the `DATABASE_URL` template in env docs and Azure Key Vault includes `sslmode=require`. CI checks for it.

## Backup restore drills

Backups untested are backups that don't work.

**Plan:** quarterly drill — restore a backup to a staging DB, run integration tests against it. Out of scope for MVP code; add to ops runbook.

## Data retention

GDPR / CCPA / California Civil Code §1798: workers can request deletion.

**Implementation:**

- Hard-delete only the user's PII (phone, email, name, resume).
- Anonymize foreign keys: replace `worker_id` on historical applications with a one-way-hashed `participant_id` that survives for grant-reporting purposes.
- This deletion is admin-mediated, not self-serve, in MVP.

> **Inferred:** Anonymization vs. full deletion is a policy call. Defaulting to anonymization preserves grant-reporting integrity (which is the platform's grant-funded purpose). Confirm with counsel before launch.

## Open questions

1. Read replicas — when do KPI dashboards justify the operational complexity? Likely after 6 months in production.
2. Per-tenant connection pools — should each tenant have its own PgBouncer pool to limit blast radius? Out of scope for MVP, but pre-design for the option.
