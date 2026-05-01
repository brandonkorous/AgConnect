# 12 — Audit Log: Data Model

## audit_events table

```prisma
model AuditEvent {
    id             BigInt        @id @default(autoincrement())
    tenantId       String        @db.Uuid @map("tenant_id")
    occurredAt     DateTime      @default(now()) @map("occurred_at") @db.Timestamptz
    actorType      ActorType     @map("actor_type")
    actorId        String?       @map("actor_id")            // Clerk userId or system process
    actorRole      String?       @map("actor_role")          // 'worker' | 'employer' | 'training_org' | 'admin' | 'system'
    actorIp        String?       @map("actor_ip") @db.Inet
    actorUserAgent String?       @map("actor_user_agent")
    action         String                                    // e.g., 'worker.application.submitted'
    resourceType   String?       @map("resource_type")       // e.g., 'application'
    resourceId     String?       @map("resource_id")
    outcome        AuditOutcome  @default(success)
    correlationId  String?       @map("correlation_id") @db.Uuid
    metadata       Json          @default("{}")
    eventHmac      Bytes         @map("event_hmac")          // HMAC-SHA256 of canonical row
    eventHmacV     Int           @default(1) @map("event_hmac_v") @db.SmallInt

    tenant         Tenant        @relation(fields: [tenantId], references: [id])

    @@index([tenantId, occurredAt(sort: Desc)])
    @@index([tenantId, actorId, occurredAt(sort: Desc)])
    @@index([tenantId, resourceType, resourceId])
    @@index([tenantId, action, occurredAt(sort: Desc)])
    @@index([correlationId])
    @@map("audit_events")
}

enum ActorType {
    worker
    employer
    training_org
    admin
    system
}

enum AuditOutcome {
    success
    failure
}
```

**Why `BigInt`, not UUID:** audit volume grows into the billions over the retention window. BIGINT is half the storage of UUID and faster to index. The `id` is internal; cross-system correlation uses `correlation_id` (UUID).

**Why truncate `actor_user_agent` to 256 chars at write time:** UAs are unbounded in practice (browser extensions append metadata, fingerprint libraries balloon them). Truncation in the helper is the first line; a Postgres `CHECK (length(actor_user_agent) <= 4096)` constraint is the defensive backstop.

## Tamper-evidence (`event_hmac`)

Every row carries an HMAC-SHA256 over its canonical content, computed in the application layer using a key stored in Azure Key Vault. The retention and redact roles do not have access to the HMAC key; an operator who breaches the DB cannot silently alter, insert, or substitute rows without breaking the HMAC.

### Canonical string

```ts
// packages/audit/src/hmac.ts
export const canonicalize = (e: AuditEventInput): string =>
    [
        e.tenantId,
        e.occurredAtMs.toString(),                       // integer ms since epoch — locale/precision-stable
        e.actorType,
        e.actorId ?? '',
        e.actorRole ?? '',
        e.action,
        e.resourceType ?? '',
        e.resourceId ?? '',
        e.outcome,
        e.correlationId ?? '',
        canonicalJSON(e.metadata),                       // RFC 8785 — sorted keys, strict numbers
    ].join('');                                    // ASCII Unit Separator — disallowed in any field
```

`canonicalJSON` follows [RFC 8785](https://datatracker.ietf.org/doc/html/rfc8785) so the same metadata always serializes identically. The Unit Separator (0x1F) is rejected from any field at write time so the canonical form is unambiguous.

### Computation

```ts
// packages/audit/src/hmac.ts
import { createHmac } from 'node:crypto';

export const computeHmac = (canonical: string, key: Buffer): Buffer =>
    createHmac('sha256', key).update(canonical, 'utf8').digest();
```

The audit middleware fetches the current HMAC key on app boot from Azure Key Vault (secret name: `audit-hmac-key`) and caches it in process memory. Versioned: every key has a `version` integer; `event_hmac_v` records which version signed each row.

### Key rotation

1. Add a new key version in Key Vault (`audit-hmac-key/v2`).
2. Deploy code that prefers the new version when signing.
3. Old versions remain readable indefinitely (they're tiny — 32 bytes each) so the verifier can validate historic events.
4. Verifier loads all known versions on startup and picks the one matching the row's `event_hmac_v`.

### Verification

Two layers:

- **Read-time spot check** — `GET /admin/v1/audit/events/:id?verify=true` recomputes the HMAC against the stored row and returns `verified: true | false`. Used by support during incident response.
- **Nightly verifier job** (`services/audit-verifier`) walks the most recent two partitions, recomputes every HMAC, and emits `system.audit.verified` with `{ rowCount, mismatchCount }`. Any mismatch pages on-call and writes a `system.audit.tamper_detected` event with the mismatched ids.

### What this defends against

- An operator with `audit_redact` role modifying anything outside the column allowlist (the canonical includes `action`, `resourceType`, `resourceId`, `metadata`, `outcome` — all outside the redact grant).
- A direct DB user editing rows without the HMAC key.
- A backup-and-restore swap that brings in forged rows.

### What this does NOT defend against

- An attacker who compromises both the DB and the Key Vault. (Mitigation: separate principal/identity for app vs. ops; Key Vault audit logging on its own.)
- An attacker who suppresses inserts before they happen. (Mitigation: append-only RLS + retention purge events provide a partial accounting; future work: hash-chain partition checkpoints in [08-edge-cases.md](08-edge-cases.md).)

> The HMAC approach (vs. a full sequential hash chain) is a deliberate trade. Sequential chains require reading the previous row inside every insert, which serializes writes and caps audit throughput. HMAC self-signing detects every form of post-write tampering at full insert parallelism. If we later need detection of *suppressed* writes, partition-level Merkle checkpoints layer on top without changing this contract.

## Partitioning

`audit_events` is **range-partitioned by month** on `occurred_at`. Each month is its own partition:

```sql
CREATE TABLE audit_events (
    id              BIGSERIAL,
    tenant_id       UUID NOT NULL,
    occurred_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
    actor_type      audit_actor_type NOT NULL,
    actor_id        TEXT,
    actor_role      TEXT,
    actor_ip        INET,
    actor_user_agent TEXT,
    action          TEXT NOT NULL,
    resource_type   TEXT,
    resource_id     TEXT,
    outcome         audit_outcome NOT NULL DEFAULT 'success',
    correlation_id  UUID,
    metadata        JSONB NOT NULL DEFAULT '{}'::jsonb,
    PRIMARY KEY (id, occurred_at)
) PARTITION BY RANGE (occurred_at);

-- monthly partitions created by a pg_partman cron job
CREATE TABLE audit_events_2026_05 PARTITION OF audit_events
    FOR VALUES FROM ('2026-05-01') TO ('2026-06-01');
```

Why partition:

1. **Retention.** Dropping a partition is O(1); deleting rows from a billion-row table is hours of vacuum thrashing.
2. **Query locality.** Most queries filter `occurred_at` to the last 7/30/90 days. The planner skips irrelevant partitions.
3. **Cold storage.** Partitions older than the retention edge can be exported to a cheaper tablespace before drop.

Use `pg_partman` (or a hand-rolled cron) to pre-create the next 3 partitions monthly.

> **Inferred:** Defaulting to monthly partitions. Daily partitions become unwieldy quickly; quarterly partitions tie too much data to retention drops. Monthly is the standard SOC-2-friendly cadence and matches typical "logs from the last 30 days" queries.

## RLS — append-only

```sql
ALTER TABLE audit_events ENABLE ROW LEVEL SECURITY;

-- Insert: everyone with a tenant context can write events for their tenant
CREATE POLICY audit_insert_tenant ON audit_events
    FOR INSERT
    WITH CHECK (
        tenant_id = current_setting('app.tenant_id', true)::uuid
        OR current_setting('app.role', true) IN ('admin', 'system')
    );

-- Select: admin reads everything; others read nothing.
-- Workers/employers do NOT read the audit log directly.
CREATE POLICY audit_select_admin ON audit_events
    FOR SELECT
    USING (current_setting('app.role', true) = 'admin');

-- No UPDATE policy at all → all updates rejected.
-- No DELETE policy at all → all deletes rejected (except via the dedicated purge role).

-- The retention job uses a separate role that bypasses RLS for delete only:
CREATE POLICY audit_purge_delete ON audit_events
    FOR DELETE
    USING (current_setting('app.role', true) = 'audit_purge');
```

The `audit_purge` role is granted only to the retention worker. Connection setup:

```ts
// services/audit-retention/src/index.ts
await tx.$executeRawUnsafe(`SET LOCAL app.role = 'audit_purge'`);
```

The retention service has its own pg user with limited grants (DELETE on `audit_events` only — no SELECT, no INSERT) so even a compromise of that worker can't read or forge events.

## Allowed metadata keys per action

Metadata is constrained by a server-side allowlist. The library refuses to write keys outside the allowlist for an action, replacing them with `"[unsanctioned]"` and emitting a Sentry warning.

```ts
// packages/audit/src/registry.ts
//
// Retention durations are derived from binding obligations, not preference. See the
// "Retention rationale" table below this block for the citation per action class.

export const auditRegistry = {
    'auth.login': {
        resourceType: 'session',
        retentionDays: 395,                       // 13 months (SOC-2 CC7.2 YoY window)
        metadata: ['method'] as const,            // 'sms_otp' | 'magic_link'
    },
    'auth.logout': {
        resourceType: 'session',
        retentionDays: 395,
        metadata: [] as const,
    },
    'auth.failed_login': {
        resourceType: 'session',
        retentionDays: 395,
        metadata: ['method', 'reason'] as const,  // reason ∈ 'bad_otp' | 'expired_otp' | 'rate_limited'
    },
    'auth.role_changed': {
        resourceType: 'user',
        retentionDays: 2555,                      // 7 years (security-significant)
        metadata: ['fromRole', 'toRole'] as const,
    },
    'worker.profile.updated': {
        resourceType: 'worker_profile',
        retentionDays: 1460,                      // 4 years (CA Labor Code §1174(d))
        metadata: ['fields'] as const,            // string[] of changed field names
    },
    'worker.resume.uploaded': {
        resourceType: 'resume',
        retentionDays: 1460,
        metadata: ['fileBytes', 'mimeType', 'parserVersion'] as const,
    },
    'worker.application.submitted': {
        resourceType: 'application',
        retentionDays: 2555,                      // 7 years (WIOA placement + IRS)
        metadata: ['jobId', 'employerId'] as const,
    },
    'worker.application.withdrawn': {
        resourceType: 'application',
        retentionDays: 2555,
        metadata: ['jobId', 'reason'] as const,
    },
    'employer.flc.submitted': {
        resourceType: 'flc_license',
        retentionDays: 2555,
        metadata: ['licenseNumber'] as const,
    },
    'employer.flc.verified': {
        resourceType: 'flc_license',
        retentionDays: 2555,                      // 7 years (compliance posture)
        metadata: ['licenseNumber', 'verifiedBy'] as const,
    },
    'employer.flc.rejected': {
        resourceType: 'flc_license',
        retentionDays: 2555,
        metadata: ['licenseNumber', 'reason'] as const,
    },
    'job.posting.created': {
        resourceType: 'job_posting',
        retentionDays: 1460,                      // 4 years (CA Labor Code recruitment records)
        metadata: ['title', 'county', 'wage', 'wageUnit'] as const,
    },
    'job.posting.published': {
        resourceType: 'job_posting',
        retentionDays: 1460,
        metadata: [] as const,
    },
    'job.posting.closed': {
        resourceType: 'job_posting',
        retentionDays: 1460,
        metadata: ['reason'] as const,
    },
    'application.status.changed': {
        resourceType: 'application',
        retentionDays: 2555,
        metadata: ['fromStatus', 'toStatus', 'jobId'] as const,
    },
    'application.hired': {
        resourceType: 'application',
        retentionDays: 2555,
        metadata: ['jobId', 'employerId', 'startDate'] as const,
    },
    'billing.subscription.created': {
        resourceType: 'stripe_subscription',
        retentionDays: 2555,                      // 7 years (IRS §6001)
        metadata: ['plan', 'stripeSubscriptionId', 'priceId'] as const,
    },
    'billing.subscription.canceled': {
        resourceType: 'stripe_subscription',
        retentionDays: 2555,
        metadata: ['plan', 'stripeSubscriptionId', 'reason'] as const,
    },
    'billing.payment.succeeded': {
        resourceType: 'stripe_invoice',
        retentionDays: 2555,
        metadata: ['amountCents', 'currency', 'stripeInvoiceId'] as const,
    },
    'billing.payment.failed': {
        resourceType: 'stripe_invoice',
        retentionDays: 2555,
        metadata: ['amountCents', 'currency', 'stripeInvoiceId', 'failureCode'] as const,
    },
    'training.enrollment.created': {
        resourceType: 'training_enrollment',
        retentionDays: 2555,                      // 7 years (WIOA §116, 2 CFR §200.334 + safety margin)
        metadata: ['programId', 'workerId'] as const,
    },
    'training.completion.recorded': {
        resourceType: 'training_completion',
        retentionDays: 2555,
        metadata: ['programId', 'workerId', 'hoursCompleted'] as const,
    },
    'cert.issued': {
        resourceType: 'certificate',
        retentionDays: 2555,                      // 7 years (WIOA training records)
        metadata: ['programId', 'workerId', 'completionDate', 'pdfUrl'] as const,
    },
    'cert.revoked': {
        resourceType: 'certificate',
        retentionDays: 2555,
        metadata: ['reason'] as const,
    },
    'tenant.created': {
        resourceType: 'tenant',
        retentionDays: 2555,                      // 7 years (contractual + security)
        metadata: ['slug', 'plan'] as const,
    },
    'tenant.updated': {
        resourceType: 'tenant',
        retentionDays: 2555,
        metadata: ['fields'] as const,
    },
    'tenant.disabled': {
        resourceType: 'tenant',
        retentionDays: 2555,
        metadata: [] as const,
    },
    'tenant.restored': {
        resourceType: 'tenant',
        retentionDays: 2555,
        metadata: [] as const,
    },
    'admin.impersonation.started': {
        resourceType: 'user',
        retentionDays: 2555,                      // 7 years (insider abuse investigation)
        metadata: ['targetUserId', 'reason'] as const,
    },
    'admin.impersonation.ended': {
        resourceType: 'user',
        retentionDays: 2555,
        metadata: ['durationSec'] as const,
    },
    'admin.user.deleted': {
        resourceType: 'user',
        retentionDays: 2555,
        metadata: ['userType', 'reason'] as const,
    },
    'admin.data.exported': {
        resourceType: 'export',
        retentionDays: 2555,
        metadata: ['exportType', 'rowCount', 'filterDigest'] as const,
    },
    'admin.audit.redacted': {
        resourceType: 'audit_event',
        retentionDays: 2555,
        metadata: ['targetActorId', 'eventCount', 'requestId'] as const,
    },
    'system.audit.retention.purged': {
        resourceType: 'audit_event',
        retentionDays: 2555,                      // meta-audit needs depth
        metadata: ['action', 'deletedCount', 'cutoff'] as const,
    },
    'system.audit.verified': {
        resourceType: 'audit_event',
        retentionDays: 2555,
        metadata: ['rowCount', 'mismatchCount', 'partition'] as const,
    },
    'system.audit.tamper_detected': {
        resourceType: 'audit_event',
        retentionDays: 2555,
        metadata: ['mismatchedIds', 'partition'] as const,
    },
    'system.audit.breaker.recovered': {
        resourceType: 'audit_event',
        retentionDays: 2555,
        metadata: ['drainedCount', 'openedDurationMs', 'droppedCount'] as const,
    },
    'error.unhandled': {
        resourceType: 'request',
        retentionDays: 90,                        // Sentry has the detail; correlation only
        metadata: ['errorCode', 'route', 'method'] as const,
    },
} as const;

export type AuditAction = keyof typeof auditRegistry;
```

## Retention rationale

Each duration above is grounded in a binding obligation or a defensible industry norm:

| bucket | days  | actions                                                     | citation                                                                                          |
| ------ | ----- | ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| 90 d   | 90    | `error.unhandled`                                           | Sentry retains 90 d on our plan; the audit row is correlation glue only.                          |
| 13 mo  | 395   | `auth.login`, `auth.logout`, `auth.failed_login`            | SOC-2 CC7.2 — security event YoY comparison window. Pattern-matches AWS / GCP / Azure SOC reports. |
| 4 y    | 1460  | `worker.profile.*`, `worker.resume.*`, `job.posting.*`      | CA Labor Code §1174(d) — employer must keep employment + recruitment records 4 years.             |
| 7 y    | 2555  | placement, billing, training, cert, FLC, tenant, admin, role | Composite of: WIOA §116 + 2 CFR §200.334 (federal grant records, 3 y post grant + safety margin); IRS §6001 (7 y for tax-relevant records); industry norm for security-significant insider-abuse investigation. |

We default to 7 years for everything compliance-touching because (a) the longest binding obligation for AgConn data classes is 7 y, and (b) one consistent number is operationally simpler than a rainbow of bespoke values that CSP partners may push back on.

If a partner organization signs an agreement requiring shorter retention (e.g., GDPR right-to-be-forgotten with strict deletion windows), the action-level retention can be tightened without a schema change — the registry is the contract.

> **Note:** All retention values are committed code in `packages/audit/src/registry.ts`. Any change is a PR + ADR; partners can be cited against the file and commit hash.

## Why JSONB metadata, not normalized side-tables

Action set evolves quickly during MVP and post-launch. Many fields are optional. Querying happens almost exclusively by `tenant_id + action + occurred_at` plus equality on `metadata->>jobId`-style paths. A normalized side-table per action would mean ~30+ tables and a join for every query. JSONB indexed via `gin (metadata jsonb_path_ops)` covers the rare deeper queries with acceptable latency.

A GIN index on metadata supports targeted lookups:

```sql
CREATE INDEX audit_events_metadata_gin
    ON audit_events USING gin (metadata jsonb_path_ops);
```

## Retention enum at the type level

The `retentionDays` field on each registry entry is the contract. The retention job iterates registry entries and computes the cutoff:

| retention | actions                                                                                                  |
| --------- | -------------------------------------------------------------------------------------------------------- |
| 90 d      | `error.unhandled`                                                                                        |
| 365 d     | `auth.login`, `auth.logout`, `auth.failed_login`                                                         |
| 1095 d    | `worker.profile.*`, `worker.resume.*`, `job.posting.*`                                                   |
| 2555 d    | placement records, billing, admin actions, tenant changes, role changes (default for compliance-touching) |
| 3650 d    | certificates, training completions (training records have long retention obligations under WIOA)         |

> **Inferred:** Defaulting the longest retention (10 years) to certs and training. CDFA and EDD have specific record-keeping rules that vary; treat 10 y as a safe upper bound and tighten per partner agreement during onboarding.

## CCPA redaction

CCPA right-to-delete requires removing actor PII while permitting "necessary records of activity" to be retained. We implement this as a redact-in-place rather than delete:

```sql
UPDATE audit_events
SET
    actor_id = NULL,
    actor_ip = NULL,
    actor_user_agent = NULL,
    metadata = jsonb_set(
        jsonb_set(metadata, '{redactedAt}', to_jsonb(now())),
        '{redactedReason}', '"ccpa_user_request"'
    )
WHERE tenant_id = $1
  AND actor_id = $2;
```

This update **violates the no-UPDATE invariant** above. The exception is implemented via a separate role (`audit_redact`) granted UPDATE on a narrow column subset only:

```sql
GRANT UPDATE (actor_id, actor_ip, actor_user_agent, metadata) ON audit_events TO audit_redact;

CREATE POLICY audit_redact_update ON audit_events
    FOR UPDATE
    USING (current_setting('app.role', true) = 'audit_redact')
    WITH CHECK (current_setting('app.role', true) = 'audit_redact');
```

The CCPA redaction itself is audited:

```
action: 'admin.audit.redacted'
metadata: { targetActorId, eventCount, requestId }
```

## Seed data

The seed script for development creates one canonical event of each major type so the admin viewer has something to render:

```ts
// packages/db/seed.ts (excerpt)
await prisma.auditEvent.createMany({
    data: [
        {
            tenantId: SEED_TENANT_ID,
            actorType: 'worker',
            actorId: 'seed-worker-1',
            actorRole: 'worker',
            action: 'auth.login',
            resourceType: 'session',
            metadata: { method: 'sms_otp' },
        },
        {
            tenantId: SEED_TENANT_ID,
            actorType: 'employer',
            actorId: 'seed-employer-1',
            actorRole: 'employer',
            action: 'job.posting.created',
            resourceType: 'job_posting',
            resourceId: 'seed-job-1',
            metadata: { title: 'Field Worker', county: 'Fresno', wage: 18, wageUnit: 'hour' },
        },
        // ...
    ],
});
```

Production starts empty.

## Storage budget

> **Inferred:** Rough sizing based on assumed MVP usage (one tenant, ~1k workers, ~50 employers, ~200 active job postings). At ~80 events/day per active worker (conservative — most events are mutations, not page views) and 50k workers at scale, expect:
>
> - 4M events/day at scale
> - ~500 bytes per event row average → ~2 GB/day
> - Monthly partitions: ~60 GB/month
> - With 7-year retention on placement records, the long-tail partition footprint is the dominant cost
>
> If volumes look 10× higher in production, revisit partitioning to weekly and consider TimescaleDB hypertables instead of native partitioning.
