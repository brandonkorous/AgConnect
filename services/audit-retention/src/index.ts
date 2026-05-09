// Audit retention worker. Runs nightly (cron'd by k8s) and:
//   1. Tops up the rolling 6-month forward partition window.
//   2. Per-action DELETEs rows older than the action's retentionDays.
//   3. Emits a `system.audit.retention.purged` event per action.
//
// Connects with app.role = 'audit_purge'. RLS narrows the role's grant to
// DELETE only.

import './instrument.js';
import * as Sentry from '@sentry/node';
import {
    auditRegistry,
    canonicalize,
    computeHmac,
    hmacKeys,
    initHmacKeysFromEnv,
} from '@agconn/audit';
import { prisma } from '@agconn/db';

initHmacKeysFromEnv();

const SYSTEM_TENANT_ID = '00000000-0000-0000-0000-000000000000';

async function ensureForwardPartitions(): Promise<void> {
    for (let i = 0; i <= 6; i++) {
        const monthStart = new Date();
        monthStart.setUTCDate(1);
        monthStart.setUTCHours(0, 0, 0, 0);
        monthStart.setUTCMonth(monthStart.getUTCMonth() + i);
        const dateStr = monthStart.toISOString().slice(0, 10);
        await prisma.$executeRawUnsafe(`SELECT ensure_audit_partition('${dateStr}'::date)`);
    }
}

async function emitMeta(action: 'system.audit.retention.purged', metadata: {
    action: string;
    deletedCount: number;
    cutoff: string;
}): Promise<void> {
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

async function purgeAction(action: keyof typeof auditRegistry): Promise<number> {
    const entry = auditRegistry[action];
    const cutoff = new Date(Date.now() - entry.retentionDays * 86_400_000);

    const deleted = await prisma.$transaction(async (tx) => {
        await tx.$executeRawUnsafe(`SET LOCAL app.role = 'audit_purge'`);
        return tx.auditEvent.deleteMany({
            where: { action, occurredAt: { lt: cutoff } },
        });
    });

    if (deleted.count > 0) {
        await emitMeta('system.audit.retention.purged', {
            action,
            deletedCount: deleted.count,
            cutoff: cutoff.toISOString(),
        });
    }
    return deleted.count;
}

async function main(): Promise<void> {
    console.log('[audit-retention] starting');
    await ensureForwardPartitions();

    let total = 0;
    for (const action of Object.keys(auditRegistry) as Array<keyof typeof auditRegistry>) {
        try {
            const n = await purgeAction(action);
            if (n > 0) console.log(`[audit-retention] purged ${n} ${action}`);
            total += n;
        } catch (e) {
            console.error(`[audit-retention] failed for ${action}`, e);
        }
    }
    console.log(`[audit-retention] complete; total=${total}`);
    await prisma.$disconnect();
}

main().catch(async (e) => {
    console.error('[audit-retention] fatal', e);
    Sentry.captureException(e);
    await Sentry.flush(2000).catch(() => undefined);
    process.exit(1);
});
