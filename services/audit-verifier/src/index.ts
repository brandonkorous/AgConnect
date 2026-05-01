// Audit verifier worker. Walks the most recent two monthly partitions,
// recomputes each row's HMAC, and emits `system.audit.verified` per partition.
// Mismatches additionally emit `system.audit.tamper_detected` and exit non-zero
// so the orchestrator can page on-call.

import './instrument';
import * as Sentry from '@sentry/node';
import {
  auditRegistry,
  canonicalize,
  computeHmac,
  hmacKeys,
  initHmacKeysFromEnv,
  verifyHmac,
} from '@agconn/audit';
import { prisma } from '@agconn/db';

initHmacKeysFromEnv();

const SYSTEM_TENANT_ID = '00000000-0000-0000-0000-000000000000';

type ActorTypeStr = 'worker' | 'employer' | 'training_org' | 'admin' | 'system';
type Outcome = 'success' | 'failure';

async function emitMeta(
  action: 'system.audit.verified' | 'system.audit.tamper_detected',
  metadata: Record<string, unknown>,
): Promise<void> {
  const occurredAt = new Date();
  const { key, version } = hmacKeys.current();
  const canonical = canonicalize({
    tenantId: SYSTEM_TENANT_ID,
    occurredAtMs: occurredAt.getTime(),
    actorType: 'system',
    actorId: null,
    actorRole: 'system',
    actorIp: null,
    actorUserAgent: null,
    action,
    resourceType: auditRegistry[action].resourceType,
    resourceId: null,
    outcome: 'success',
    correlationId: null,
    metadata,
  });
  const eventHmac = computeHmac(canonical, key);

  await prisma.$transaction(async (tx) => {
    await tx.$executeRawUnsafe(`SET LOCAL app.role = 'system'`);
    await tx.auditEvent.create({
      data: {
        tenantId: SYSTEM_TENANT_ID,
        occurredAt,
        actorType: 'system',
        actorRole: 'system',
        action,
        resourceType: auditRegistry[action].resourceType,
        outcome: 'success',
        metadata: metadata as object,
        eventHmac: Uint8Array.from(eventHmac),
        eventHmacV: version,
      },
    });
  });
}

async function verifyPartition(
  partitionStart: Date,
  partitionEnd: Date,
): Promise<{ rowCount: number; mismatchCount: number; mismatchedIds: bigint[] }> {
  const rows = await prisma.$transaction(async (tx) => {
    await tx.$executeRawUnsafe(`SET LOCAL app.role = 'audit_redact'`); // SELECT-only is enough; redact role has SELECT
    return tx.auditEvent.findMany({
      where: { occurredAt: { gte: partitionStart, lt: partitionEnd } },
    });
  });

  let mismatch = 0;
  const mismatchedIds: bigint[] = [];

  for (const row of rows) {
    const keyEntry = hmacKeys.forVersion(row.eventHmacV);
    if (!keyEntry) {
      mismatch += 1;
      mismatchedIds.push(row.id);
      continue;
    }
    const canonical = canonicalize({
      tenantId: row.tenantId,
      occurredAtMs: row.occurredAt.getTime(),
      actorType: row.actorType as ActorTypeStr,
      actorId: row.actorId,
      actorRole: row.actorRole,
      actorIp: row.actorIp,
      actorUserAgent: row.actorUserAgent,
      action: row.action as never,
      resourceType: row.resourceType,
      resourceId: row.resourceId,
      outcome: row.outcome as Outcome,
      correlationId: row.correlationId,
      metadata: (row.metadata ?? {}) as Record<string, unknown>,
    });
    if (!verifyHmac(canonical, Buffer.from(row.eventHmac), keyEntry.key)) {
      mismatch += 1;
      mismatchedIds.push(row.id);
    }
  }

  return { rowCount: rows.length, mismatchCount: mismatch, mismatchedIds };
}

function monthBounds(offsetMonths: number): { start: Date; end: Date; label: string } {
  const start = new Date();
  start.setUTCDate(1);
  start.setUTCHours(0, 0, 0, 0);
  start.setUTCMonth(start.getUTCMonth() + offsetMonths);
  const end = new Date(start);
  end.setUTCMonth(end.getUTCMonth() + 1);
  const label = start.toISOString().slice(0, 7);
  return { start, end, label };
}

async function main(): Promise<void> {
  console.log('[audit-verifier] starting');
  let totalMismatch = 0;

  for (const offset of [0, -1]) {
    const { start, end, label } = monthBounds(offset);
    try {
      const { rowCount, mismatchCount, mismatchedIds } = await verifyPartition(start, end);
      console.log(
        `[audit-verifier] partition=${label} rows=${rowCount} mismatch=${mismatchCount}`,
      );
      await emitMeta('system.audit.verified', {
        rowCount,
        mismatchCount,
        partition: label,
      });
      if (mismatchCount > 0) {
        await emitMeta('system.audit.tamper_detected', {
          mismatchedIds: mismatchedIds.slice(0, 100).map(String),
          partition: label,
        });
        totalMismatch += mismatchCount;
      }
    } catch (e) {
      console.error(`[audit-verifier] failed for partition ${label}`, e);
    }
  }

  await prisma.$disconnect();

  if (totalMismatch > 0) {
    console.error(`[audit-verifier] DETECTED ${totalMismatch} mismatches`);
    process.exit(2);
  }
  console.log('[audit-verifier] clean');
}

main().catch(async (e) => {
  console.error('[audit-verifier] fatal', e);
  Sentry.captureException(e);
  await Sentry.flush(2000).catch(() => undefined);
  process.exit(1);
});
