# 12 — Audit Log: Edge Cases & Risks

## Audit on the critical path → availability hit

The default behavior: a failed audit write fails the parent business request, because best-effort audits with silent drops have caused real audit findings at companies with much larger ops teams than ours. The audit log is load-bearing — we make availability the secondary goal, not the primary.

**The circuit breaker is built-in and enabled by default.** See [03-api.md](03-api.md) for full specification. Summary:

- Default state: **closed**. Audit writes fail the business request on error (atomicity preserved).
- After 5 consecutive failures within 30 s, the breaker opens. For the next 60 s, audit writes are queued locally; business requests succeed.
- After 60 s the breaker probes; success closes it and drains the queue. Failure re-opens.
- Every state transition pages on-call via Sentry `level: fatal`.
- Queue overflow at 1,000 events drops with a fatal Sentry log.
- Recovery emits `system.audit.breaker.recovered` with the drained count so the gap is itself auditable.

**Other mitigations:**

- **Audit table has its own connection pool slot reservation.** Configure Postgres so the audit write path is not starved by long-running business queries.
- **`audit_events` is the smallest, fastest write in the system** — single row, no joins, BIGSERIAL pk. It is rare for it to be the bottleneck.
- The HMAC computation runs in the app process (not Postgres), so a Postgres outage doesn't make us unable to *prepare* the row — only to *commit* it. The breaker queue holds prepared rows ready to flush on recovery.

## Forgotten emission in a new handler

A new feature engineer adds a mutation handler and forgets `c.var.audit.log(...)`.

**Mitigation:** the `@agconn/eslint-plugin/audit-required` ESLint rule (see [03-api.md](03-api.md)) catches this at PR time. Allowlist via `// audit-skip: <reason>` comment with a reason. PR review checks that skips are legitimate.

## Audit log itself becomes a PII repository

Sloppy metadata writes can accumulate PII over time, undoing the entire compliance benefit.

**Mitigations:**

- Per-action allowlist is enforced at write time (see [02-data-model.md](02-data-model.md)).
- A weekly CI scan over a sample of recent dev/staging events looks for PII patterns (SSN regex, well-formed email, full phone numbers) in `metadata` and fails the build.
- Quarterly manual review: a security engineer pulls a random sample of 1000 events and inspects `metadata` for leaks.
- The redaction tool exists as the cleanup hatch when something does leak.

## High-volume action drowns the table

A bug or attacker triggers 10k `auth.failed_login` events per second.

**Mitigations:**

- Per-action retention is short for noisy actions (`auth.failed_login` retains for 365 d, but partition drops trim quickly).
- Rate-limiting on the upstream endpoint (`/v1/auth/verify`) caps attempts per IP and per phone number well before audit volume becomes a problem.
- A read-only "noise dashboard" inside `/admin/audit` shows top actions by hourly volume so spikes are visible.

## Background job audit pollution

A pg-boss job retries 1000 times before giving up. Each retry emits `job.<name>.completed`.

**Mitigation:**

- The `auditedJob` wrapper emits only after `outcome` is determined per attempt — that's the intended behavior for incident analysis.
- For chronic retries (> 10 attempts), pg-boss already moves the job to a dead-letter queue; the wrapper emits a single `job.<name>.dead_lettered` event instead of 1000.

## Clock skew on multi-instance deploys

`occurred_at` defaults to Postgres `now()` so it is server-clock-anchored, but multiple replicas with skewed clocks could cause out-of-order events.

**Mitigation:**

- AKS / Azure VMs use chrony / systemd-timesyncd; clock skew across instances stays under 50 ms in practice.
- Pagination uses `(occurred_at, id)` so even ties on `occurred_at` are deterministic.
- The audit viewer renders timestamps to the second by default; sub-second is on hover.

## Correlation id collision across requests

Hono propagates `x-correlation-id` from the client. A misbehaving client sending the same id for every request would cluster unrelated events.

**Mitigation:**

- The middleware generates a new UUID v4 on every request and only uses the inbound header if it parses as a UUID and is from a trusted internal service (a server-to-server header signed with a shared secret). Untrusted client headers are ignored.

## Bulk imports

Importing 100k worker profiles emits 100k `worker.profile.created` events — slow and unreadable.

**Mitigation:**

- For known bulk paths (admin imports, data migrations), the API exposes `audit.bulk()`:

```ts
await c.var.audit.bulk({
    action: 'worker.profile.created',
    count: profiles.length,
    metadata: { source: 'admin_import', batchId },
});
```

This emits a single event with `metadata.count` and a per-batch `batchId`. Individual records are not audited; the import file itself is retained for traceability.

- An anti-pattern check: PR review flags any loop that calls `c.var.audit.log(...)` more than 50 times in a single request and asks for the bulk variant.

## Cross-tenant admin events

`tenant.created` for a brand-new tenant has no caller-tenant context — the operator is a super-admin, the target is the new tenant. Where does `tenant_id` go?

**Mitigation:** event's `tenant_id` is the **target** tenant (the one being acted on). A second `metadata.operatorTenantId` field captures the operator's primary tenant if any. For purely systemic events with no tenant target (`system.maintenance.started`), the sentinel `00000000-0000-0000-0000-000000000000` is used and the admin viewer renders this as "System."

## Soft-deleted tenant audit

When a tenant is soft-deleted, its audit events should remain visible to admins for incident response and compliance.

**Mitigation:**

- `audit_events` does not have a `deletedAt` column. Tenant soft-delete does not cascade.
- The admin viewer's tenant filter dropdown includes a `[Show disabled tenants]` toggle.
- Hard-delete of a tenant (after 90 d in the soft-deleted state, post-MVP) hard-deletes its audit events too — a one-way operation that itself emits `tenant.purged` to the system tenant.

## Prevention of admin abuse

Admins can read every tenant's audit log. An admin abusing this access leaves no trace because reads are not audited.

**Mitigation (post-MVP, planned):**

- Add `admin.audit.viewed` events for every distinct query a super-admin runs (with the filter digest in metadata).
- Add `admin.audit.exported` (already exists).
- Out of scope for MVP because the admin pool is a small, trusted team. Revisit when the admin role is given to partner-org operators.

## Test environments and audit pollution

Integration tests emit audit events that pollute the test DB. A flaky test environment could spill into shared dev.

**Mitigation:**

- All integration tests run against per-suite tenant fixtures that are torn down after the suite.
- Tear-down hard-deletes the test tenant + cascades to its audit events via the `audit_purge` role grant in the test environment only.

## Schema migrations of `audit_events`

Renaming a column or adding a NOT NULL constraint on a multi-billion-row table is a multi-hour locking nightmare.

**Mitigation:**

- Treat the `audit_events` shape as quasi-frozen. New fields are added as nullable; values default in Prisma generators.
- Renaming an action requires either a code-side dual-write window (write both the old and new action for a release) or an offline migration job.
- Schema changes go through ADR review, not casual PRs.

## Disk pressure

A surge in audit volume (10× normal) for sustained hours can fill the Postgres volume.

**Mitigation:**

- Azure managed Postgres alarm at 75% disk usage pages on-call.
- Emergency lever: drop the oldest non-compliance partition (typically the 90 d `error.unhandled` partitions) without waiting for the nightly job.
- Long-term: monitor partition sizes weekly and set growth-trend alerts.

## Compliance: cross-border data transfer

Tenant in EU (post-MVP) → audit log must remain in EU per GDPR.

**Mitigation:**

- Tenant-per-cluster architecture (per [01-multi-tenancy/08-edge-cases.md](../01-multi-tenancy/08-edge-cases.md)) means each region has its own `audit_events` table.
- No cross-region `JOIN`s on audit. Federated reads (admin sees both regions in one UI) require a federation layer that does not yet exist.
- Out of scope for MVP.

## Append-only via Postgres triggers (alternative considered)

We could implement append-only via a `BEFORE UPDATE` and `BEFORE DELETE` trigger that raises an exception. This is more defense-in-depth than RLS (which can be bypassed by superuser sessions).

**Why we don't (yet):**

- The connection roles already enforce the boundary (only `audit_purge` and `audit_redact` have the relevant grants).
- The HMAC tamper-evidence layer (see [02-data-model.md](02-data-model.md)) detects any row modification after the fact, including by a superuser, because the HMAC key is in Azure Key Vault not the DB.
- A trigger adds 1–2 ms to every write. Not catastrophic, but unnecessary given the HMAC defense.
- Adopt triggers if/when SOC-2 attestation requires defense-in-depth tamper-prevention beyond tamper-detection.

## Redaction must recompute HMAC

CCPA redaction modifies `actor_id`, `actor_ip`, `actor_user_agent`, and `metadata`. All four are in the canonical content of the HMAC. A naive update would invalidate every redacted row's HMAC.

**Mitigation:** the `audit_redact` flow:

1. Reads the row.
2. Applies the redaction in memory.
3. Computes the new HMAC against the redacted canonical content using the **current** key version.
4. Writes the redacted row + new HMAC + new `event_hmac_v` in a single UPDATE.
5. Emits `admin.audit.redacted` with the affected ids and the previous HMAC values stashed in metadata so a forensic reconstruction is possible if a redaction is ever disputed.

The verifier never alarms on a redacted row because it always recomputes against the row's stored `event_hmac_v` — and redactions advance that version.

## Bulk imports must compute HMACs in batch

The `audit.bulk()` path emits a single event with `metadata.count`, so the HMAC is computed once per import — not per imported row. Cheap.

## Open questions

1. **Streaming to SIEM.** When AGCONN lands its first enterprise tenant, that tenant may want a real-time audit feed to their SIEM. Plan: a per-tenant Kafka topic or a polling export endpoint with a watermark cursor. Not built; design notes belong here when the requirement crystallizes.
2. **Self-service "my activity"** — should workers see their own audit log? It builds trust ("see, AGCONN shows you exactly what we recorded") and could be a competitive differentiator. Risk: rendering bilingual labels for every action is non-trivial. Defer past MVP.
3. **Action-level rate limiting.** A misbehaving worker app could spam `worker.profile.updated` 100×/sec. Should the audit logger debounce per `(actor_id, action)` window? Recommend a 1s same-action dedupe window if usage data shows this happening; not built yet.
4. **Linking `error.unhandled` to the request audit chain.** Today the correlation id ties them together, but the unhandled error happens at the very end of the request, after `c.var.audit.log` has run for the business event. We rely on the correlation id alone. If we add a request-start audit event later, the chain becomes explicit.
5. **Partition-level Merkle checkpoints.** HMAC self-signing detects modification of existing rows. Detection of *suppressed inserts* (rows that were never written) requires a higher-level structure. A nightly Merkle root over each partition, stored in a tamper-evident `audit_checkpoints` table (or off-site), would close the gap. Not built; recommended pre-SOC-2.
