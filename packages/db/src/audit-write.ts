import type { Prisma } from '@prisma/client';
import { dbClients, runWithRlsContext } from './rls.js';

// Audit rows are insert-only for 'system': createMany skips the RETURNING that create would need a SELECT policy for.
export async function insertAuditEvent(data: Prisma.AuditEventCreateManyInput): Promise<void> {
  await runWithRlsContext({ role: 'system' }, () => dbClients.shared.auditEvent.createMany({ data }));
}
