# 12 — Audit Log: Overview

## Purpose

A tenant-scoped, append-only record of every consequential action in AGCONN — who did what, when, to which resource, with what outcome. The audit log is the source of truth for:

- **Security incident response** — "who logged in from this IP yesterday?", "did anyone access this worker's profile?"
- **Compliance** — CCPA right-to-know responses, WIOA grant placement event provenance, SOC-2 Type II attestation evidence (post-MVP), Stripe billing reconciliation.
- **Customer support** — "the worker says they applied; did the application actually submit?" "did the certificate email actually send?"
- **Admin transparency** — every admin action (impersonation, tenant edit, user deletion) is recorded against the operator.

The audit log is **not**:

- Application logging (errors, traces) — that goes to Sentry / structured logs.
- Analytics / product metrics (page views, search queries, funnel events) — that goes to PostHog/Plausible.
- A general-purpose event bus — async fan-out belongs in pg-boss queues or webhooks.

If an event answers "what happened in the system at the runtime level?" it is a log. If it answers "did a person or process **do** something we'd ever need to defend or reconstruct?" it is an audit event.

## Why a foundation, not a feature

Retrofitting an audit log requires:

- adding a new `audit_events` table after data exists,
- backfilling who-did-what for past actions (impossible — the data is gone),
- finding every API handler and adding emission calls,
- redesigning RLS to permit the new write path.

The marginal cost of building it now is one Prisma model, one server-side helper, one CI check, and a discipline of calling `audit.log(...)` in every mutation handler. The cost of not having it is a year-one auditor finding zero evidence trail.

ADR-006 (to be written) records this decision.

## Scope

In scope:

- `audit_events` table (append-only, RLS-protected, partitioned by month).
- `packages/audit` library: typed `audit.log(...)` helper, action taxonomy registry, redaction helpers.
- Server-side emission middleware: Hono middleware that auto-records auth, role, IP, user-agent, correlation id on every request, exposes `c.var.audit.log(...)` to handlers.
- Cross-cutting auto-emitted events:
    - `auth.login` / `auth.logout` / `auth.failed_login` / `auth.role_changed` (from auth middleware)
    - `error.unhandled` (from app-shell `onError` handler)
- Domain-emitted events (each feature emits its own):
    - `worker.profile.created/updated`, `worker.resume.uploaded`, `worker.application.submitted/withdrawn`
    - `employer.flc.submitted/verified/rejected`, `job.posting.created/published/closed`
    - `application.status.changed`, `application.hired`
    - `billing.subscription.created/canceled`, `billing.payment.succeeded/failed`
    - `training.enrollment.created`, `training.completion.recorded`
    - `cert.issued`, `cert.revoked`
    - `tenant.created/updated/disabled/restored`
    - `admin.impersonation.started/ended`, `admin.user.deleted`, `admin.data.exported`
- Admin viewer UI: read-only filterable timeline at `/admin/audit`.
- Retention job: nightly pg-boss worker hard-deletes events past their retention window.
- CCPA redaction job: a `redact-actor` operation that rewrites `actor_id` to NULL and clears actor PII fields in metadata while preserving the action and resource for legal continuity.

Out of scope (deferred):

- Streaming export to a SIEM (Splunk, Datadog, AWS Security Hub) — Tier 2 (the data shape is designed to support this when needed).
- Cryptographic signing / hash-chaining of events for tamper-evidence — Tier 2 (relies on Postgres + RLS + append-only constraints for now).
- Audit log replication to immutable cold storage (S3 Object Lock or equivalent) — Tier 2.
- A self-service "my activity" view for end users (workers/employers see their own audit trail) — not in MVP, may be a useful trust signal later.

## Roles & access

- **Worker / Employer / Training Org:** never reads audit data directly. May trigger events through any mutation. Events are tenant-scoped and never leave the tenant.
- **Admin:** reads all audit events for any tenant via `/admin/v1/audit/*`. Cannot edit or delete (RLS prevents UPDATE and DELETE for admin role too).
- **System / background jobs:** emit events with `actor_type = 'system'`, `actor_id = null`, and a job-specific identifier in `metadata.jobName`.

## Key invariants

1. **Append-only at the database level.** RLS policy permits only INSERT on `audit_events`. UPDATE and DELETE are rejected even for the admin role. Hard deletion is performed by a special `app.role = 'audit_purge'` connection used exclusively by the retention job. Narrow UPDATE for CCPA redaction goes through `app.role = 'audit_redact'` on a column allowlist (see [02-data-model.md](02-data-model.md)).
2. **Every business mutation emits an event.** A linter checks that every Hono handler with method POST/PATCH/PUT/DELETE either calls `c.var.audit.log(...)` at least once or is allow-listed (with a comment documenting why).
3. **No PII in metadata.** `metadata` is a JSONB blob constrained by a server-side allowlist of safe keys per action. The redaction helper strips anything else.
4. **Tamper-evident at the row level.** Every event carries an `event_hmac` computed in the application layer using a key stored in Azure Key Vault. The retention/redact roles have no access to the key. A nightly verifier recomputes HMACs across recent partitions and pages on mismatch. Combined with append-only RLS, an operator who breaks into the DB cannot silently modify, insert, or replace rows without detection. See [02-data-model.md](02-data-model.md).
5. **Resilient to its own failures.** A failed audit write fails the parent business mutation by default — atomicity is the safer path. A built-in **circuit breaker** trips after 5 consecutive write failures within 30 seconds, opens for 60 seconds, and during that window degrades to "best-effort with replay-on-recovery" so the business stays available. The breaker is **enabled by default**; configuration knobs live in [03-api.md](03-api.md). Sentry pages on every breaker state change.
6. **Tenant scoping is mandatory.** Every event has `tenant_id` set, with one allowlisted exception: cross-tenant admin actions (`admin.tenant.created`, etc.) where `tenant_id` is the *target* tenant, not the operator's. Truly tenantless system events (`system.maintenance.started`) use a sentinel tenant `00000000-0000-0000-0000-000000000000` reserved as `system`.
7. **Action codes are stable.** Like API error codes, action strings (`worker.profile.updated`) are part of the contract. Renaming requires a migration that rewrites historic rows or a dual-write window.
8. **Outcomes are explicit.** Every event has `outcome ∈ ('success', 'failure')`. A failed login is `auth.failed_login` with `outcome: 'success'` (the *event* succeeded — we did record a failed login attempt). A 500 during job-posting create emits `job.posting.created` with `outcome: 'failure'` and the error code in `metadata.errorCode`.
9. **Time is server time.** `occurred_at` is `default now()`. The client clock is never trusted.

## Success criteria

- An admin investigating an incident can answer "what happened to worker X between 09:00 and 12:00 yesterday?" with one filtered query in `/admin/audit` returning < 100 ms.
- A CCPA right-to-know request can be fulfilled in under an hour by exporting filtered audit events for the requestor's `actor_id`.
- A nightly retention job purges expired events without affecting business reads (no lock contention).
- A regression that breaks a single `audit.log(...)` call surfaces in CI: every mutation handler has a unit test asserting "this call should produce these audit events."
- The audit log itself is the audit log — purges, redactions, and migrations against it are themselves audited.

## Dependencies

- [01-multi-tenancy](../01-multi-tenancy/) — every event carries `tenant_id`; RLS template extended to cover the audit table.
- [02-auth](../02-auth/) — `auth.*` events emitted from auth middleware; `actor_id`, `actor_role` come from the resolved session.
- [03-database](../03-database/) — Prisma model, partitioning strategy, indexes, the `audit_purge` role.
- [11-app-shell](../11-app-shell/) — `error.unhandled` events emitted from the top-level Hono `onError`.

## Non-dependencies

- Audit log writes do **not** depend on pg-boss. The write happens inside the same DB transaction as the business mutation (see [03-api.md](03-api.md)) so atomicity is free.
- Audit log does **not** depend on Sentry, but Sentry is the alert path for failed writes.
