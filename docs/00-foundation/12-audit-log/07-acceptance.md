# 12 — Audit Log: Acceptance Criteria

## Functional — write path

- [ ] Every Hono mutation handler (`POST` / `PATCH` / `PUT` / `DELETE`) calls `c.var.audit.log({...})` at least once OR carries an `audit-skip` comment with a reason. Verified by ESLint rule.
- [ ] Auto-emitted events fire automatically:
    - [ ] `auth.login` on Clerk session start.
    - [ ] `auth.logout` on Clerk session end.
    - [ ] `auth.failed_login` on rejected OTP / magic link.
    - [ ] `auth.role_changed` on Clerk `user.updated` with role diff.
    - [ ] `error.unhandled` on every top-level unhandled exception.
    - [ ] `job.<name>.completed` on every pg-boss job (success or failure).
- [ ] Audit writes happen inside the same Prisma transaction as the business write — failure of either rolls back both.
- [ ] Metadata keys outside the per-action allowlist are replaced with `"[unsanctioned]"` and a Sentry warning is logged.
- [ ] `actor_user_agent` is truncated to 256 chars at write time.
- [ ] Forwarded IP is parsed correctly when `x-forwarded-for` contains a chain (uses the first hop).
- [ ] System events (`actor_type = 'system'`) write with `actor_id = null` and `app.role = 'system'`.

## Functional — HMAC tamper-evidence

- [ ] Every `audit_events` row has a non-null `event_hmac` and a populated `event_hmac_v`.
- [ ] HMAC computed in the application layer using the canonical-string definition in [02-data-model.md](02-data-model.md).
- [ ] HMAC key fetched from Azure Key Vault on app boot; missing key fails app startup loudly (no silent fallback).
- [ ] Multiple key versions can co-exist; the verifier picks the version recorded on the row.
- [ ] `GET /admin/v1/audit/events/:id?verify=true` returns `verified: true` for an unmodified row and `verified: false` for any tampered row.
- [ ] `GET /admin/v1/audit/verify` over a filter set returns `mismatchCount: 0` for a clean partition; emits `system.audit.verified` regardless.
- [ ] Modifying any byte of `action`, `tenant_id`, `metadata`, `outcome`, `actor_id`, `actor_role`, `resource_type`, `resource_id`, `correlation_id`, or `occurred_at` flips `verified` to false.
- [ ] CCPA redaction recomputes the HMAC against the redacted canonical content and advances `event_hmac_v`; verifier still returns `verified: true` for the redacted row.
- [ ] Nightly verifier (`services/audit-verifier`) runs over the most recent two partitions, emits `system.audit.verified`, pages on-call on any mismatch via `system.audit.tamper_detected`.
- [ ] Key rotation (adding a new version in Key Vault and bumping the deploy) does not invalidate any existing rows.

## Functional — circuit breaker

- [ ] In closed state, audit write failure throws and rolls back the parent business transaction.
- [ ] Five consecutive write failures within 30 s opens the breaker.
- [ ] In open state, audit writes enqueue locally (max 1,000); business requests succeed.
- [ ] After 60 s in open state, the next write probes (half_open).
- [ ] Probe success transitions to closed and drains the queue.
- [ ] Probe failure re-opens for another 60 s.
- [ ] Every state transition emits a Sentry event at `level: fatal`.
- [ ] Recovery emits exactly one `system.audit.breaker.recovered` event per drain with `drainedCount` and `droppedCount`.
- [ ] Queue overflow at 1,000 events drops with a fatal Sentry log; the dropped event is not silently lost from the operator's perspective.
- [ ] An integration test forces 5 consecutive failures (via mock), verifies open transition, restores writes, verifies queue drain.

## Functional — bilingual-by-design admin viewer

- [ ] No English string literals exist in `apps/web/src/app/[locale]/admin/audit/**` or `packages/audit/**` (verified by an ESLint rule on JSX text content + known string-literal prop positions).
- [ ] Every label rendered in the viewer reads from `useTranslations('admin.audit.*')`.
- [ ] `messages/es.json` has the full `admin.audit.*` key shape with empty values; the parity check passes via the documented allowlist.
- [ ] Every action in `auditRegistry` has a corresponding `admin.audit.action.<key>.label` and `.description` in `en.json` (compile-time check).
- [ ] When ES strings are added later, removing a key from `EMPTY_ES_ALLOWLIST` and filling values in `es.json` is the only change required to ship Spanish.
- [ ] The viewer at `/es/admin/audit` renders in English (graceful fallback) until Spanish values land.

## Functional — RLS / append-only

- [ ] A worker session cannot SELECT, UPDATE, or DELETE any row in `audit_events`. RLS rejects all three.
- [ ] An employer session cannot SELECT, UPDATE, or DELETE any row in `audit_events`. Same rejection.
- [ ] An admin session can SELECT events for any tenant they have access to.
- [ ] An admin session cannot UPDATE or DELETE events. Both fail with permission denied.
- [ ] The `audit_purge` role can DELETE but cannot SELECT or INSERT — verified by integration test.
- [ ] The `audit_redact` role can UPDATE only the columns `actor_id`, `actor_ip`, `actor_user_agent`, `metadata` — verified by integration test attempting to update `action`, which must fail.

## Functional — read API

- [ ] `GET /admin/v1/audit/events` filters correctly by `tenantId`, `actorId`, `action`, `actionPrefix`, `resourceType`, `resourceId`, `outcome`, `correlationId`, date range.
- [ ] Pagination via opaque cursor is deterministic (no duplicate or skipped events between pages).
- [ ] Default page size 50; max 200; over-200 requests rejected with `validation_failed`.
- [ ] `actionPrefix` and `action` are mutually exclusive — both supplied returns `validation_failed`.
- [ ] `GET /admin/v1/audit/correlations/:id` returns every event sharing the correlation id, ordered by `occurred_at`.
- [ ] `GET /admin/v1/audit/actor/:id/timeline` returns events for the actor, ordered most recent first.
- [ ] `GET /admin/v1/audit/resource/:type/:id/history` returns events for the resource, ordered oldest first.
- [ ] `GET /admin/v1/audit/export` streams a valid CSV with the documented columns.
- [ ] Export emits an `admin.data.exported` event with the filter digest.
- [ ] Export above 1M rows is rejected with `validation_failed` and a hint.

## Functional — retention & redaction

- [ ] Nightly retention job runs at 02:00 UTC and deletes events older than each action's `retentionDays`.
- [ ] Each retention purge emits `system.audit.retention.purged` with `{ action, deletedCount, cutoff }`.
- [ ] Retention job runs in a single transaction with `app.role = 'audit_purge'`; failure rolls back.
- [ ] CCPA redaction:
    - [ ] Requires `super_admin` role.
    - [ ] Requires `x-confirm` header from the second-factor flow; missing → `confirmation_required` (428).
    - [ ] Sets `actor_id`, `actor_ip`, `actor_user_agent` to NULL and stamps `metadata.redactedAt` + `metadata.redactedReason`.
    - [ ] Emits `admin.audit.redacted` with `{ targetActorId, eventCount, requestId }`.
    - [ ] Returns `{ redactedCount }`.
- [ ] Dry-run redaction returns the count without modifying rows.

## Functional — admin viewer

- [ ] `/admin/audit` loads with default filters (caller's tenant, last 7 days) and shows the timeline.
- [ ] All filter changes update the URL (`pushState`) and are bookmarkable.
- [ ] Detail drawer opens on row click and renders all event fields including pretty-printed JSON metadata.
- [ ] Correlation timeline view groups events correctly and highlights failures.
- [ ] Actor timeline view groups events by date (Today, Yesterday, etc.).
- [ ] Resource history shows the events oldest first with a state-snapshot header for known resource types.
- [ ] Export form's row-count estimate is within 10% of the actual returned count for tenant-filtered queries.
- [ ] Redaction page is gated behind `super_admin` and rejects access otherwise.
- [ ] Failure rows render with both an icon and a color so color-blind users can distinguish them.
- [ ] Keyboard navigation (arrows, Enter, Esc) works in the timeline.

## Non-functional

- [ ] `tenant_id + 7d` filtered listing returns < 100 ms p95 against a 100M-row table (verified with synthetic load test).
- [ ] Audit write adds < 5 ms p95 to the parent business mutation.
- [ ] Single-event fetch by id returns < 20 ms p95.
- [ ] CSV export streams without buffering — first byte arrives < 500 ms after request.
- [ ] The retention job completes within its nightly window (target < 30 min).
- [ ] Audit volume sustains 1k inserts/sec without saturating the DB connection pool.
- [ ] No PII present in `metadata` for any event under any action — verified by a CI script that scans recent dev events for known PII patterns (SSN, full email, full phone).

## Test scenarios

### Unit

1. **Allowlist enforcement** — `c.var.audit.log({ action: 'auth.login', metadata: { method: 'sms_otp', extra: 'leaked' } })` writes `{ method: 'sms_otp', extra: '[unsanctioned]' }` and emits a Sentry warning.
2. **Action description coverage** — every action in `auditRegistry` has a description in `auditActionDescriptions` (compile-time check).
3. **UA / IP truncation** — a 4 KB UA is truncated to 256 chars; `x-forwarded-for: a, b, c` parses to `a`.
4. **Outcome derivation** — a thrown error in a handler that has already called `c.var.audit.log({...})` does NOT write a duplicate; the unhandled error path adds `error.unhandled` separately.

### Integration

1. **Atomicity** — force the audit insert to fail (simulated DB error) inside a job-posting create transaction → the job posting is also rolled back; no orphan in either table.
2. **Cross-tenant read isolation** — admin authenticated as Tenant A explicitly requests Tenant B → returns events for Tenant B only because admin role bypasses RLS. Worker authenticated under Tenant A → cannot read any audit events at all.
3. **Append-only** — admin attempts `UPDATE audit_events SET action = 'tampered'` — fails with permission denied.
4. **Retention** — seed 1000 `auth.login` events at varying ages; run retention with cutoff = 365d; verify only events older than 365d are deleted; verify the `system.audit.retention.purged` event has the correct count.
5. **Redaction roundtrip** — write 5 events for `actor_id = 'X'`. Run dry-run redact → returns 5. Run real redact → returns 5. Verify `actor_id IS NULL` for all 5 and that `action`, `resource_type`, `resource_id`, `metadata.redactedAt`, `metadata.redactedReason` are intact.
6. **Correlation propagation** — single inbound request triggers 3 audit events (1 from middleware, 2 from handler) — all 3 share the same correlation id.
7. **ESLint rule** — add a Hono `POST` handler without an `audit.log` call → CI fails. Add `// audit-skip: idempotent health check` → CI passes.

### Manual

1. Trigger every action class in dev (login, fail login, create job, hire, billing event, cert, admin redact). Verify all show in `/admin/audit` with correct metadata.
2. Take a worker through onboarding while watching `/admin/audit` in another tab → verify the lifecycle reads naturally as a story.
3. Run the retention job manually in staging on a snapshot of production data → verify counts match expectations and runtime is within budget.
4. Spanish reviewer (post-MVP, when admin is bilingual) signs off on translated action descriptions.
5. Security review: an external pentester attempts to forge / suppress audit events via API misuse — none should succeed.

## Definition of done

- `packages/audit` ships with: `auditRegistry`, `auditActionDescriptions`, `redact()` helpers, ESLint plugin (`audit-required`), TypeScript typing for action → metadata.
- `apps/api/src/middleware/audit.ts` mounts before every tenant-scoped route and exposes `c.var.audit.log()`.
- `apps/api/src/domains/admin/audit/` implements all read endpoints, the export, and the redaction operations.
- `apps/web/src/app/[locale]/admin/audit/` implements the UI documented in [04-ui.md](04-ui.md).
- `services/audit-retention/` implements the nightly retention job.
- The `audit_events` table has RLS enabled and policies verified by `packages/db/scripts/check-rls.ts`.
- `audit_purge` and `audit_redact` Postgres roles exist with the documented narrow grants.
- A CI gate runs the synthetic load test on every PR that touches `packages/audit/**` or `apps/api/src/middleware/audit.ts`.
- Sentry receives every failed audit write tagged `severity: critical`.
- ADR-006 is written and merged, capturing the "audit on the critical path" decision.
