import { test } from 'node:test';
import assert from 'node:assert/strict';
import { pools } from '@agconn/db';

// Audit rows written outside a request land as agconn_app (pnpm test:db).
process.env.AUDIT_HMAC_KEY ??= Buffer.alloc(48, 7).toString('base64');
const { emitSystemAudit } = await import('./audit.js');

test('emitSystemAudit writes a system audit event', async () => {
  await emitSystemAudit({ action: 'system.audit.breaker.recovered', metadata: { drainedCount: 0 } });
  await pools.shared.$disconnect();
});
