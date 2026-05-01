# 12 — Audit Log: API Surface

This file covers (a) the **server-side write API** that domain handlers use to emit events, (b) the **admin read API** that the audit viewer consumes, and (c) the **redaction / purge** operational endpoints.

## Write API — `c.var.audit.log(...)`

The audit middleware mounts before any tenant-scoped router. It exposes a typed logger on the Hono context that is bound to the current request's actor + correlation id.

```ts
// apps/api/src/middleware/audit.ts
import { createMiddleware } from 'hono/factory';
import { auditRegistry, type AuditAction } from '@agconn/audit/registry';

type AuditMetadataFor<A extends AuditAction> = {
    [K in (typeof auditRegistry)[A]['metadata'][number]]?: unknown;
};

type LogInput<A extends AuditAction> = {
    action: A;
    resourceType?: string;       // defaults to registry entry
    resourceId?: string;
    outcome?: 'success' | 'failure';
    metadata?: AuditMetadataFor<A>;
};

type AuditLogger = {
    log<A extends AuditAction>(input: LogInput<A>): Promise<void>;
};

export const auditMiddleware = createMiddleware<{ Variables: { audit: AuditLogger } }>(
    async (c, next) => {
        const correlationId = (c.req.header('x-correlation-id') ?? crypto.randomUUID());
        c.header('x-correlation-id', correlationId);
        c.set('correlationId', correlationId);

        c.set('audit', {
            async log(input) {
                const entry = auditRegistry[input.action];
                const allowed = new Set<string>(entry.metadata as readonly string[]);
                const cleaned: Record<string, unknown> = {};
                for (const [k, v] of Object.entries(input.metadata ?? {})) {
                    if (allowed.has(k)) cleaned[k] = v;
                    else {
                        cleaned[k] = '[unsanctioned]';
                        c.var.log.warn({ action: input.action, key: k }, 'audit metadata key not in allowlist');
                    }
                }

                const occurredAt = new Date();
                const row = {
                    tenantId: c.var.tenantId,
                    actorType: deriveActorType(c.var.userRole),
                    actorId: c.var.userId ?? null,
                    actorRole: c.var.userRole ?? null,
                    actorIp: clipIp(c.req.header('x-forwarded-for')),
                    actorUserAgent: clipUserAgent(c.req.header('user-agent')),
                    action: input.action,
                    resourceType: input.resourceType ?? entry.resourceType,
                    resourceId: input.resourceId,
                    outcome: input.outcome ?? 'success',
                    correlationId,
                    metadata: cleaned,
                    occurredAt,
                };
                const { key, version } = hmacKeys.current();
                const canonical = canonicalize({ ...row, occurredAtMs: occurredAt.getTime() });
                const eventHmac = computeHmac(canonical, key);

                await writeAuditWithBreaker(c, { ...row, eventHmac, eventHmacV: version });
            },
        });

        await next();
    },
);
```

### Circuit breaker

`writeAuditWithBreaker` wraps the Prisma insert with the documented breaker:

```ts
// packages/audit/src/breaker.ts
const breaker = {
    state: 'closed' as 'closed' | 'open' | 'half_open',
    consecutiveFailures: 0,
    openedAt: 0,
    queue: [] as PendingAuditWrite[],
};

const FAILURE_THRESHOLD = 5;
const FAILURE_WINDOW_MS = 30_000;
const OPEN_DURATION_MS = 60_000;
const QUEUE_MAX = 1_000;

export async function writeAuditWithBreaker(c: Context, row: AuditRow) {
    if (breaker.state === 'open' && Date.now() - breaker.openedAt < OPEN_DURATION_MS) {
        // Breaker open: enqueue locally, don't fail business request.
        if (breaker.queue.length < QUEUE_MAX) breaker.queue.push(row);
        else c.var.log.error({ row }, 'audit queue full — event dropped');
        return;
    }
    if (breaker.state === 'open') transition('half_open');

    try {
        await c.var.db.auditEvent.create({ data: row });
        breaker.consecutiveFailures = 0;
        if (breaker.state === 'half_open') {
            transition('closed');
            await drainQueue(c);
        }
    } catch (e) {
        breaker.consecutiveFailures += 1;
        sentry.captureException(e, { level: 'fatal', tags: { audit_write: 'failed' } });
        if (breaker.consecutiveFailures >= FAILURE_THRESHOLD) {
            transition('open');
            // best-effort fallback so business stays available
            if (breaker.queue.length < QUEUE_MAX) breaker.queue.push(row);
            return;
        }
        throw e;                                // below threshold → fail the parent transaction
    }
}

async function drainQueue(c: Context) {
    while (breaker.queue.length) {
        const row = breaker.queue.shift()!;
        try {
            await c.var.db.auditEvent.create({ data: row });
        } catch (e) {
            breaker.queue.unshift(row);
            transition('open');
            return;
        }
    }
    await c.var.audit.log({                    // meta-event
        action: 'system.audit.breaker.recovered',
        metadata: { drainedCount: /* tracked separately */ 0 },
    });
}

function transition(to: typeof breaker.state) {
    const from = breaker.state;
    if (from === to) return;
    breaker.state = to;
    if (to === 'open') breaker.openedAt = Date.now();
    sentry.captureMessage(`audit breaker ${from} → ${to}`, 'fatal');
}
```

Properties:

- **Default behavior** (closed): a failed audit write fails the parent transaction (per invariant #5).
- **Threshold trip** (closed → open): 5 consecutive failures within 30 s. Subsequent writes are queued locally (max 1,000 events; overflow drops with a fatal Sentry log).
- **Cooldown** (open): for 60 s, every audit write enqueues locally without attempting the DB. Business requests succeed.
- **Probe** (open → half_open): after 60 s, the next write attempts the DB. Success → flush the queue and transition closed. Failure → re-open.
- **Visibility:** every state transition pages on-call via Sentry `level: fatal`.
- **Recovery emits a meta-event:** `system.audit.breaker.recovered` records the drained count so the gap is itself audited. The window in which writes were queued (and any drops) is recoverable from Sentry + this meta-event.

This trades strict atomicity during a 60-second outage for availability — explicitly acceptable because the alternative is "AgConn returns 500 to every user any time the audit table hiccups."

> **Behavior under sustained outage (> 60 s with non-recovery):** the breaker keeps cycling open / half_open / open. Business requests stay available; queue overflow drops events at 1,000 with a fatal Sentry. On-call has 60 s of warning before any drop occurs.

Domain handlers call it inline, in the same transaction as the business write:

```ts
// apps/api/src/domains/employer/job-postings/routes.ts
jobPostings.post('/', validate(CreateJobPostingBody), async (c) => {
    const job = await c.var.db.$transaction(async (tx) => {
        const created = await tx.jobPosting.create({
            data: { ...c.var.body, tenantId: c.var.tenantId, employerId: c.var.userId },
        });
        await c.var.audit.log({
            action: 'job.posting.created',
            resourceId: created.id,
            metadata: {
                title: created.title,
                county: created.county,
                wage: created.wageAmount,
                wageUnit: created.wageUnit,
            },
        });
        return created;
    });
    return ok(c, job, 201);
});
```

> **Inferred:** Audit writes happen **inside** the same Prisma `$transaction` as the business write. Atomicity guarantees: either both land or neither does. Cost: a small write-amplification on every mutation. Benefit: no orphaned business state without a paper trail, no successful audits for failed business writes.

## Auto-emitted events

Three classes of events emit automatically; domain handlers do not write them:

### From auth middleware ([02-auth/03-api.md](../02-auth/03-api.md))

- `auth.login` — on Clerk webhook `session.created` or successful OTP verification.
- `auth.logout` — on Clerk webhook `session.removed`.
- `auth.failed_login` — on OTP verify with `outcome: 'success'` and `metadata.reason`.
- `auth.role_changed` — on Clerk webhook `user.updated` with role diff.

### From the global Hono `onError` ([11-app-shell/03-api.md](../11-app-shell/03-api.md))

- `error.unhandled` — `outcome: 'failure'`, `metadata: { errorCode, route, method }`. Fires only after a thrown exception bubbles to the top handler. The correlation id ties the event to the user's request and to the Sentry breadcrumb.

### From background jobs

Each pg-boss worker is wrapped to emit `job.<name>.completed` with `outcome` and `metadata.durationMs`:

```ts
// services/<name>/src/wrapper.ts
export const auditedJob = (name: string, fn: (job: Job) => Promise<void>) => async (job: Job) => {
    const start = Date.now();
    try {
        await fn(job);
        await emitSystemAudit({ action: `job.${name}.completed`, outcome: 'success', metadata: { durationMs: Date.now() - start } });
    } catch (e) {
        await emitSystemAudit({ action: `job.${name}.completed`, outcome: 'failure', metadata: { durationMs: Date.now() - start, errorCode: classify(e) } });
        throw e;
    }
};
```

(Per-job actions register in the `auditRegistry` per service.)

## Linter: every mutation handler must emit at least one event

A custom ESLint rule (`@agconn/eslint-plugin/audit-required`) enforces:

> Every Hono route registered with `.post`, `.patch`, `.put`, or `.delete` must call `c.var.audit.log({...})` at least once in the handler body, OR carry a `// audit-skip: <reason>` comment on the route line.

This catches the "I forgot" case at PR review time. The escape hatch (`audit-skip`) is permitted but should be rare — examples: idempotent admin reads incorrectly registered as POST, health checks.

## Read API — admin only

All read endpoints live under `/admin/v1/audit/*` and require `userRole === 'admin'`. They run with `app.role = 'admin'` so RLS permits SELECT.

### GET /admin/v1/audit/events

List events with filters.

Query params:

```ts
const ListAuditQuery = z.object({
    tenantId: z.string().uuid().optional(),         // omit → caller's tenant for tenant-scoped admins; required for super-admin (future)
    actorId: z.string().optional(),
    actorRole: z.enum(['worker', 'employer', 'training_org', 'admin', 'system']).optional(),
    action: z.string().optional(),                  // exact action, e.g., 'auth.login'
    actionPrefix: z.string().optional(),            // prefix, e.g., 'auth.'
    resourceType: z.string().optional(),
    resourceId: z.string().optional(),
    outcome: z.enum(['success', 'failure']).optional(),
    correlationId: z.string().uuid().optional(),
    from: z.string().datetime().optional(),         // ISO 8601
    to: z.string().datetime().optional(),
    cursor: z.string().optional(),                  // opaque, server-issued
    limit: z.number().int().min(1).max(200).default(50),
});
```

Either `action` or `actionPrefix` is allowed, not both.

Response:

```ts
{
    ok: true,
    data: {
        events: AuditEvent[];
        nextCursor: string | null;
    }
}
```

`AuditEvent` shape mirrors the Prisma model except `id` is serialized as a string (BigInt). The cursor encodes `(occurredAt, id)` for deterministic pagination.

Performance contract: any query with a `tenantId` filter and a date range under 30 days returns in < 100 ms p95 against a 100M-row table. Without `tenantId`, the call falls back to a slower query path with a 1000-event cap.

### GET /admin/v1/audit/events/:id

Fetch a single event by id. Returns 404 if not found or RLS-hidden.

Optional query: `?verify=true` recomputes the row's HMAC against the stored value and returns:

```ts
{
    ok: true,
    data: {
        event: AuditEvent,
        verified: boolean,
        verifierVersion: number,            // HMAC key version used to verify
    }
}
```

`verified: false` is itself a finding — the support tool surfaces it in red and links to the tamper-detection procedure.

### GET /admin/v1/audit/verify

Run an on-demand HMAC verification across a filter set. Same query params as `/events`, but the response contains:

```ts
{
    ok: true,
    data: {
        rowCount: number,
        mismatchCount: number,
        mismatchedIds: string[],            // truncated to first 100
        durationMs: number,
    }
}
```

Hard cap of 100,000 rows per call. The nightly verifier covers larger spans. Each call emits `system.audit.verified` with the same numbers; mismatches additionally emit `system.audit.tamper_detected`.

### GET /admin/v1/audit/correlations/:correlationId

Fetch every event sharing a correlation id — useful for "what else happened in this request?" queries.

Response: `{ events: AuditEvent[] }` — typically 1–6 events per HTTP request.

### GET /admin/v1/audit/actor/:actorId/timeline

A pre-built timeline for a single actor (worker, employer, admin). Returns the most recent N events for that `actor_id` across all their resource types. Used by the support tool.

Query: `?from=...&to=...&limit=...&cursor=...`.

### GET /admin/v1/audit/resource/:resourceType/:resourceId/history

Every event touching a specific resource — useful for "show me this application's full lifecycle." Same pagination shape.

### GET /admin/v1/audit/export

Returns a streamed CSV of audit events matching the same filters as `/events`. Stream rather than buffer. Adds an `admin.data.exported` audit event with the filter digest.

Response: `text/csv` with the columns `occurred_at, tenant_id, actor_type, actor_id, actor_role, actor_ip, action, resource_type, resource_id, outcome, correlation_id, metadata_json`.

Hard cap of 1M rows per export to avoid runaway pulls.

## Redaction & purge — operator endpoints

Both endpoints require `userRole === 'admin'` AND a second-factor confirmation header (`x-confirm: <random_token>`) issued by a separate confirmation flow. They themselves emit audit events.

### POST /admin/v1/audit/redact

Body:

```ts
const RedactBody = z.object({
    tenantId: z.string().uuid(),
    actorId: z.string().min(1),
    requestId: z.string(),                          // CCPA request ticket id from external system
    reason: z.enum(['ccpa_user_request', 'gdpr_user_request', 'legal_hold_release']),
});
```

Effect:

- Connects with `app.role = 'audit_redact'`.
- `UPDATE audit_events SET actor_id = NULL, actor_ip = NULL, actor_user_agent = NULL, metadata = jsonb_set(...)` for matching rows.
- Emits `admin.audit.redacted` with `{ targetActorId, eventCount, requestId }`.
- Returns `{ redactedCount: number }`.

### POST /admin/v1/audit/purge-test

Test-only endpoint (gated behind `process.env.AGCONN_ENV === 'dev' | 'staging'`) that triggers the retention job for a specific cutoff. Returns the count that would be purged (`dryRun: true`) or the count actually purged. Production runs the retention job automatically (see below).

## Retention job

A pg-boss worker (`audit-retention`) runs nightly at 02:00 UTC:

```ts
// services/audit-retention/src/job.ts
export const runRetention = async () => {
    await db.$transaction(async (tx) => {
        await tx.$executeRawUnsafe(`SET LOCAL app.role = 'audit_purge'`);
        for (const [action, { retentionDays }] of Object.entries(auditRegistry)) {
            const cutoff = subDays(new Date(), retentionDays);
            const result = await tx.$executeRaw`
                DELETE FROM audit_events
                WHERE action = ${action}
                  AND occurred_at < ${cutoff}
            `;
            await emitSystemAudit({
                action: 'system.audit.retention.purged',
                metadata: { action, deletedCount: Number(result), cutoff: cutoff.toISOString() },
            });
        }
    });
};
```

A "purged" audit event is itself written (under `system.audit.retention.purged`), with its own retention.

> **Inferred:** Doing per-action DELETEs rather than dropping whole partitions. The retention varies by action (90 days vs. 10 years), so partition-level drops would require per-action partitions, which is an unmanageable explosion. Per-action DELETE inside a single transaction is acceptable up to ~10M rows/night; beyond that, switch to per-action partitioning.

## Errors

| code                  | http | when                                                                  |
| --------------------- | ---- | --------------------------------------------------------------------- |
| `unauthenticated`     | 401  | No session                                                            |
| `forbidden`           | 403  | Non-admin hitting `/admin/v1/audit/*`                                 |
| `not_found`           | 404  | Event id, correlation id, actor id, or resource id has no events     |
| `validation_failed`   | 422  | Bad query params (e.g., both `action` and `actionPrefix` set)        |
| `confirmation_required` | 428 | Redact / purge endpoints called without `x-confirm` header           |
| `rate_limited`        | 429  | Export endpoint > 5 calls/min per admin                               |
| `audit_write_failed`  | 500  | Event write threw inside a transaction; business write rolled back    |

`audit_write_failed` is the one error that does propagate to user requests — if the audit write fails, the business write rolls back and the user gets a 500. The alternative (let the business write succeed without an audit) violates invariant #1.

> **Inferred:** Hard-failing the business request on audit failure. The competing pattern (best-effort audit, log to Sentry, let the request succeed) trades availability for compliance. We choose compliance because the audit log is a load-bearing system. Mitigation for availability is in [08-edge-cases.md](08-edge-cases.md).
