import type { AuditAction } from './registry.js';

export type ActorType = 'worker' | 'employer' | 'training_org' | 'admin' | 'system';
export type AuditOutcome = 'success' | 'failure';

export type AuditEventInput = {
  tenantId: string;
  occurredAtMs: number;
  actorType: ActorType;
  actorId: string | null;
  actorRole: string | null;
  actorIp: string | null;
  actorUserAgent: string | null;
  action: AuditAction;
  resourceType: string | null;
  resourceId: string | null;
  outcome: AuditOutcome;
  correlationId: string | null;
  metadata: Record<string, unknown>;
};

export type AuditEventRow = AuditEventInput & {
  eventHmac: Buffer;
  eventHmacV: number;
};
