import { createMiddleware } from 'hono/factory';
import { prisma } from '@agconn/db';
import {
  AuditBreaker,
  auditRegistry,
  canonicalize,
  clipForwardedIp,
  clipUserAgent,
  computeHmac,
  hmacKeys,
  initHmacKeysFromEnv,
  isKnownAction,
  sanitizeMetadata,
  type ActorType,
  type AuditAction,
  type AuditEventInput,
  type AuditEventRow,
  type AuditOutcome,
} from '@agconn/audit';

initHmacKeysFromEnv();

export type AuditLogInput = {
  action: AuditAction;
  resourceType?: string;
  resourceId?: string | null;
  outcome?: AuditOutcome;
  metadata?: Record<string, unknown>;
  // Override actor context for cases where the auto-resolved request actor
  // is wrong (e.g. system events emitted from inside a request).
  actorOverride?: {
    actorType?: ActorType;
    actorId?: string | null;
    actorRole?: string | null;
    tenantId?: string;
  };
};

export type AuditLogger = {
  log: (input: AuditLogInput) => Promise<void>;
};

export type AuditCtxVars = {
  audit: AuditLogger;
  correlationId: string;
};

const deriveActorType = (role: string | undefined | null): ActorType => {
  switch (role) {
    case 'worker':
    case 'employer':
    case 'training_org':
    case 'admin':
    case 'system':
      return role;
    default:
      return 'system';
  }
};

const writeAuditRow = async (row: AuditEventRow): Promise<void> => {
  await prisma.auditEvent.create({
    data: {
      tenantId: row.tenantId,
      occurredAt: new Date(row.occurredAtMs),
      actorType: row.actorType,
      actorId: row.actorId ?? null,
      actorRole: row.actorRole ?? null,
      actorIp: row.actorIp ?? null,
      actorUserAgent: row.actorUserAgent ?? null,
      action: row.action,
      resourceType: row.resourceType ?? null,
      resourceId: row.resourceId ?? null,
      outcome: row.outcome,
      correlationId: row.correlationId ?? null,
      metadata: row.metadata as object,
      eventHmac: Uint8Array.from(row.eventHmac),
      eventHmacV: row.eventHmacV,
    },
  });
};

const breaker = new AuditBreaker(writeAuditRow, undefined, {
  onEvent: (e) => {
    if (e.kind === 'transition') {
      console.error('[audit] breaker transition', e.from, '→', e.to);
    } else if (e.kind === 'dropped') {
      console.error('[audit] event DROPPED (queue full)', { action: e.row.action });
    } else if (e.kind === 'recovered') {
      console.warn('[audit] breaker recovered', e);
      // Recovery emits a system audit event of its own.
      void emitSystemAudit({
        action: 'system.audit.breaker.recovered',
        metadata: {
          drainedCount: e.drainedCount,
          openedDurationMs: e.openedDurationMs,
          droppedCount: e.droppedCount,
        },
      });
    }
  },
});

export const buildAuditRow = (input: AuditEventInput): AuditEventRow => {
  const { key, version } = hmacKeys.current();
  const canonical = canonicalize(input);
  const eventHmac = computeHmac(canonical, key);
  return { ...input, eventHmac, eventHmacV: version };
};

// System-level audit emission, used outside HTTP requests (background jobs,
// breaker recovery callbacks). Bypasses RLS via app.role = 'system'.
export const emitSystemAudit = async (input: {
  action: AuditAction;
  tenantId?: string;
  resourceType?: string;
  resourceId?: string | null;
  outcome?: AuditOutcome;
  metadata?: Record<string, unknown>;
}): Promise<void> => {
  if (!isKnownAction(input.action)) {
    throw new Error(`emitSystemAudit: unknown action ${input.action}`);
  }
  const entry = auditRegistry[input.action];
  const { metadata, warnings } = sanitizeMetadata(input.action, input.metadata);
  for (const w of warnings) {
    console.warn('[audit] unsanctioned metadata key', w);
  }
  const row = buildAuditRow({
    tenantId: input.tenantId ?? '00000000-0000-0000-0000-000000000000',
    occurredAtMs: Date.now(),
    actorType: 'system',
    actorId: null,
    actorRole: 'system',
    actorIp: null,
    actorUserAgent: null,
    action: input.action,
    resourceType: input.resourceType ?? entry.resourceType,
    resourceId: input.resourceId ?? null,
    outcome: input.outcome ?? 'success',
    correlationId: null,
    metadata,
  });

  await prisma.$transaction(async (tx) => {
    await tx.$executeRawUnsafe(`SET LOCAL app.role = 'system'`);
    await tx.auditEvent.create({
      data: {
        tenantId: row.tenantId,
        occurredAt: new Date(row.occurredAtMs),
        actorType: row.actorType,
        actorId: row.actorId,
        actorRole: row.actorRole,
        action: row.action,
        resourceType: row.resourceType,
        resourceId: row.resourceId,
        outcome: row.outcome,
        correlationId: row.correlationId,
        metadata: row.metadata as object,
        eventHmac: Uint8Array.from(row.eventHmac),
        eventHmacV: row.eventHmacV,
      },
    });
  });
};

// Hono middleware. Mounts a typed `c.var.audit.log()` and `c.var.correlationId`.
// Must run AFTER tenant middleware so c.var.db / tenantId / role are set.
export const auditMiddleware = createMiddleware<{
  Variables: AuditCtxVars & {
    db?: unknown;
    tenantId?: string;
    role?: string;
    userId?: string;
    userRole?: string;
  };
}>(async (c, next) => {
  const incoming = c.req.header('x-correlation-id');
  const correlationId =
    incoming && /^[0-9a-f-]{36}$/i.test(incoming) ? incoming : crypto.randomUUID();
  c.header('x-correlation-id', correlationId);
  c.set('correlationId', correlationId);

  const ip = clipForwardedIp(c.req.header('x-forwarded-for')) ?? c.req.header('x-real-ip') ?? null;
  const ua = clipUserAgent(c.req.header('user-agent'));

  const logger: AuditLogger = {
    log: async (input) => {
      if (!isKnownAction(input.action)) {
        throw new Error(`audit.log: unknown action ${input.action}`);
      }
      const entry = auditRegistry[input.action];
      const { metadata, warnings } = sanitizeMetadata(input.action, input.metadata);
      for (const w of warnings) console.warn('[audit] unsanctioned metadata key', w);

      const ctxTenant = c.get('tenantId');
      const tenantId =
        input.actorOverride?.tenantId ||
        (typeof ctxTenant === 'string' && ctxTenant.length > 0 ? ctxTenant : null) ||
        '00000000-0000-0000-0000-000000000000';
      const userRole = input.actorOverride?.actorRole ?? c.get('userRole') ?? c.get('role');

      const row = buildAuditRow({
        tenantId,
        occurredAtMs: Date.now(),
        actorType: input.actorOverride?.actorType ?? deriveActorType(userRole),
        actorId: input.actorOverride?.actorId ?? c.get('userId') ?? null,
        actorRole: userRole ?? null,
        actorIp: ip,
        actorUserAgent: ua,
        action: input.action,
        resourceType: input.resourceType ?? entry.resourceType,
        resourceId: input.resourceId ?? null,
        outcome: input.outcome ?? 'success',
        correlationId,
        metadata,
      });

      await breaker.submit(row);
    },
  };

  c.set('audit', logger);
  await next();
});
