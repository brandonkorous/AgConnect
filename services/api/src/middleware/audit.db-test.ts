import { test } from 'node:test';
import assert from 'node:assert/strict';
import { pools } from '@agconn/db';

// Audit rows written outside a request land as agconn_app (pnpm test:db).
process.env.AUDIT_HMAC_KEY ??= Buffer.alloc(48, 7).toString('base64');
const { emitSystemAudit } = await import('./audit.js');

test('emitSystemAudit writes a system audit event', async () => {
  await emitSystemAudit({ action: 'system.audit.breaker.recovered', metadata: { drainedCount: 0 } });
});

test('a request audit row is written for its tenant', async () => {
  const { buildAuditRow, writeAuditRow } = await import('./audit.js');
  const row = buildAuditRow({
    tenantId: '00000000-0000-0000-0000-000000000000', occurredAtMs: Date.now(), actorType: 'worker',
    actorId: 'audit_fixture', actorRole: 'worker', actorIp: null, actorUserAgent: null,
    action: 'system.audit.breaker.recovered', resourceType: null, resourceId: null,
    outcome: 'success', correlationId: null, metadata: {},
  });
  await writeAuditRow(row);
  await pools.shared.$disconnect();
});
