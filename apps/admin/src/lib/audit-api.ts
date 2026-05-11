import 'server-only';
import { adminFetch } from './api-server';

export type ServerAuditEvent = {
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

export const fetchAuditEvents = (qs: string) =>
  adminFetch<{ events: ServerAuditEvent[]; nextCursor: string | null }>(
    `/admin/v1/audit/events${qs ? `?${qs}` : ''}`,
  );

export const fetchAuditEvent = (id: string) =>
  adminFetch<
    | { event: ServerAuditEvent }
    | { event: ServerAuditEvent; verified: boolean; verifierVersion: number }
  >(`/admin/v1/audit/events/${encodeURIComponent(id)}`);

export const fetchCorrelation = (id: string) =>
  adminFetch<{ events: ServerAuditEvent[] }>(
    `/admin/v1/audit/correlations/${encodeURIComponent(id)}`,
  );
