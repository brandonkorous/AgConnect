// audit-required:exempt — redactActor is invoked from routes.ts which emits
// admin.audit.redacted on the same call path; double-logging would conflate
// the original write with the redaction.
import { canonicalize, computeHmac, hmacKeys, verifyHmac } from '@agconn/audit';
import type { Tx } from '@agconn/db';
import type { ListAuditQuery } from './schemas';

export type AuditEventDto = {
  id: string;
  tenantId: string;
  occurredAt: string;
  actorType: string;
  actorId: string | null;
  actorRole: string | null;
  actorIp: string | null;
  actorUserAgent: string | null;
  action: string;
  resourceType: string | null;
  resourceId: string | null;
  outcome: 'success' | 'failure';
  correlationId: string | null;
  metadata: Record<string, unknown>;
  eventHmacV: number;
};

const decodeCursor = (cursor: string | undefined) => {
  if (!cursor) return null;
  try {
    const json = Buffer.from(cursor, 'base64url').toString('utf8');
    const parsed = JSON.parse(json) as { occurredAt: string; id: string };
    return { occurredAt: new Date(parsed.occurredAt), id: BigInt(parsed.id) };
  } catch {
    return null;
  }
};

const encodeCursor = (occurredAt: Date, id: bigint): string =>
  Buffer.from(JSON.stringify({ occurredAt: occurredAt.toISOString(), id: id.toString() }), 'utf8').toString(
    'base64url',
  );

const toDto = (row: {
  id: bigint;
  tenantId: string;
  occurredAt: Date;
  actorType: string;
  actorId: string | null;
  actorRole: string | null;
  actorIp: string | null;
  actorUserAgent: string | null;
  action: string;
  resourceType: string | null;
  resourceId: string | null;
  outcome: string;
  correlationId: string | null;
  metadata: unknown;
  eventHmacV: number;
}): AuditEventDto => ({
  id: row.id.toString(),
  tenantId: row.tenantId,
  occurredAt: row.occurredAt.toISOString(),
  actorType: row.actorType,
  actorId: row.actorId,
  actorRole: row.actorRole,
  actorIp: row.actorIp,
  actorUserAgent: row.actorUserAgent,
  action: row.action,
  resourceType: row.resourceType,
  resourceId: row.resourceId,
  outcome: row.outcome as 'success' | 'failure',
  correlationId: row.correlationId,
  metadata: (row.metadata ?? {}) as Record<string, unknown>,
  eventHmacV: row.eventHmacV,
});

export async function listEvents(
  db: Tx,
  q: ListAuditQuery,
): Promise<{ events: AuditEventDto[]; nextCursor: string | null }> {
  const limit = q.limit ?? 50;
  const cursor = decodeCursor(q.cursor);

  const where: Record<string, unknown> = {};
  if (q.tenantId) where.tenantId = q.tenantId;
  if (q.actorId) where.actorId = q.actorId;
  if (q.actorRole) where.actorRole = q.actorRole;
  if (q.action) where.action = q.action;
  if (q.actionPrefix) where.action = { startsWith: q.actionPrefix };
  if (q.resourceType) where.resourceType = q.resourceType;
  if (q.resourceId) where.resourceId = q.resourceId;
  if (q.outcome) where.outcome = q.outcome;
  if (q.correlationId) where.correlationId = q.correlationId;
  if (q.from || q.to) {
    where.occurredAt = {
      ...(q.from ? { gte: new Date(q.from) } : {}),
      ...(q.to ? { lte: new Date(q.to) } : {}),
    };
  }
  if (cursor) {
    where.OR = [
      { occurredAt: { lt: cursor.occurredAt } },
      { occurredAt: cursor.occurredAt, id: { lt: cursor.id } },
    ];
  }

  const rows = await db.auditEvent.findMany({
    where,
    orderBy: [{ occurredAt: 'desc' }, { id: 'desc' }],
    take: limit + 1,
  });

  const hasMore = rows.length > limit;
  const slice = hasMore ? rows.slice(0, limit) : rows;
  const nextCursor =
    hasMore && slice.length > 0
      ? encodeCursor(slice[slice.length - 1]!.occurredAt, slice[slice.length - 1]!.id)
      : null;

  return { events: slice.map(toDto), nextCursor };
}

export async function getEvent(db: Tx, id: bigint): Promise<AuditEventDto | null> {
  const row = await db.auditEvent.findFirst({ where: { id } });
  return row ? toDto(row) : null;
}

export async function verifyEvent(
  db: Tx,
  id: bigint,
): Promise<{ event: AuditEventDto; verified: boolean; verifierVersion: number } | null> {
  const row = await db.auditEvent.findFirst({ where: { id } });
  if (!row) return null;
  const keyEntry = hmacKeys.forVersion(row.eventHmacV);
  if (!keyEntry) {
    return { event: toDto(row), verified: false, verifierVersion: row.eventHmacV };
  }
  const canonical = canonicalize({
    tenantId: row.tenantId,
    occurredAtMs: row.occurredAt.getTime(),
    actorType: row.actorType as 'worker' | 'employer' | 'training_org' | 'admin' | 'system',
    actorId: row.actorId,
    actorRole: row.actorRole,
    actorIp: row.actorIp,
    actorUserAgent: row.actorUserAgent,
    action: row.action as never,
    resourceType: row.resourceType,
    resourceId: row.resourceId,
    outcome: row.outcome as 'success' | 'failure',
    correlationId: row.correlationId,
    metadata: (row.metadata ?? {}) as Record<string, unknown>,
  });
  const verified = verifyHmac(canonical, Buffer.from(row.eventHmac), keyEntry.key);
  return { event: toDto(row), verified, verifierVersion: keyEntry.version };
}

export async function listByCorrelation(
  db: Tx,
  correlationId: string,
): Promise<AuditEventDto[]> {
  const rows = await db.auditEvent.findMany({
    where: { correlationId },
    orderBy: [{ occurredAt: 'asc' }, { id: 'asc' }],
    take: 500,
  });
  return rows.map(toDto);
}

export async function listByActor(
  db: Tx,
  actorId: string,
  q: ListAuditQuery,
): Promise<{ events: AuditEventDto[]; nextCursor: string | null }> {
  return listEvents(db, { ...q, actorId });
}

export async function listByResource(
  db: Tx,
  resourceType: string,
  resourceId: string,
): Promise<AuditEventDto[]> {
  const rows = await db.auditEvent.findMany({
    where: { resourceType, resourceId },
    orderBy: [{ occurredAt: 'asc' }, { id: 'asc' }],
    take: 500,
  });
  return rows.map(toDto);
}

export async function redactActor(
  db: Tx,
  input: { tenantId: string; actorId: string; reason: string; requestId: string; dryRun?: boolean },
): Promise<{ redactedCount: number; previousHmacs: string[] }> {
  const matching = await db.auditEvent.findMany({
    where: { tenantId: input.tenantId, actorId: input.actorId },
    select: { id: true, eventHmac: true, occurredAt: true, metadata: true },
  });

  if (input.dryRun) {
    return { redactedCount: matching.length, previousHmacs: [] };
  }

  await db.$executeRawUnsafe(`SET LOCAL app.role = 'audit_redact'`);

  const { key, version } = hmacKeys.current();
  const previousHmacs: string[] = [];
  let count = 0;

  for (const row of matching) {
    const full = await db.auditEvent.findFirst({ where: { id: row.id } });
    if (!full) continue;

    const newMetadata = {
      ...(full.metadata as Record<string, unknown>),
      redactedAt: new Date().toISOString(),
      redactedReason: input.reason,
      redactedRequestId: input.requestId,
    };

    const canonical = canonicalize({
      tenantId: full.tenantId,
      occurredAtMs: full.occurredAt.getTime(),
      actorType: full.actorType as 'worker' | 'employer' | 'training_org' | 'admin' | 'system',
      actorId: null,
      actorRole: full.actorRole,
      actorIp: null,
      actorUserAgent: null,
      action: full.action as never,
      resourceType: full.resourceType,
      resourceId: full.resourceId,
      outcome: full.outcome as 'success' | 'failure',
      correlationId: full.correlationId,
      metadata: newMetadata,
    });
    const newHmac = computeHmac(canonical, key);

    previousHmacs.push(Buffer.from(full.eventHmac).toString('base64'));

    await db.auditEvent.update({
      where: { id: full.id },
      data: {
        actorId: null,
        actorIp: null,
        actorUserAgent: null,
        metadata: newMetadata as object,
        eventHmac: Uint8Array.from(newHmac),
        eventHmacV: version,
      },
    });
    count += 1;
  }

  return { redactedCount: count, previousHmacs };
}
