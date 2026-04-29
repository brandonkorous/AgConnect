# 01 — Multi-tenancy: Overview

## Purpose

Every AgConn deployment serves multiple isolated organizational tenants. A tenant is an organizational deployment of AgConn — for example, a regional workforce board, a state agency partner, or a white-label licensee. For MVP, there is one tenant (`AgConn Central Valley`); the architecture supports adding more without schema migration.

## Why multi-tenant from day one

Retrofitting tenancy after data exists requires:

- backfilling `tenant_id` on every row in every table,
- rewriting every RLS policy,
- refactoring every API handler.

The marginal cost of building it in now is a `tenant_id` FK column per table and one middleware function. Kickoff ADR-002 records this decision.

## Scope

In scope:

- `tenants` table + `tenant_id` FK pattern on every business-data table
- API middleware that resolves the tenant from the authenticated Clerk org/user
- RLS policies that enforce `tenant_id` matching at the Postgres layer
- Tenant settings (feature flags, branding overrides) in `tenants.settings` JSONB
- Admin-only API endpoints to create/update tenants

Out of scope (post-MVP):

- Tenant-aware billing aggregation — each tenant has its own Stripe account
- Cross-tenant analytics
- White-label custom domains
- Tenant migration tooling (split / merge / move user)

## Roles & access

- **Worker / Employer / Training Org:** scoped to their `tenant_id` via Clerk org metadata. Cannot see or query data outside their tenant.
- **Admin:** bypasses tenant scoping. All cross-tenant queries go through the admin API surface only (`/admin/v1/*`).
- **System:** background jobs (pg-boss workers) run as service-role with explicit `tenant_id` parameter — never inferred.

## Key invariants

1. Every business-data table has `tenant_id uuid not null references tenants(id)`.
2. The client never sends `tenant_id` in a request body or query string. It is resolved server-side from the authenticated session.
3. RLS is enabled on every table. The default policy is `USING (tenant_id = current_setting('app.tenant_id')::uuid)`.
4. The Hono API sets `app.tenant_id` on the connection at the start of every request transaction.
5. There is no global lookup endpoint. Even "list all counties" returns tenant-filtered data.

## Success criteria

- A worker authenticated under Tenant A cannot read or modify any row owned by Tenant B via any API endpoint or via direct DB access using the API service role.
- Adding a new tenant requires zero schema changes and zero code changes — only a row in `tenants` and a Clerk Organization mapping.
- Cross-tenant query latency is indistinguishable from single-tenant: `tenant_id` filter adds < 2ms.

## Dependencies

- [02-auth](../02-auth/) — Clerk org → tenant mapping, JWT claims
- [03-database](../03-database/) — Prisma schema, migration tooling, RLS template
