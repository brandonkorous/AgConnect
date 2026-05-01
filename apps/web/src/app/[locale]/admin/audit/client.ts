import 'server-only';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:3001';
const ADMIN_TOKEN = process.env.ADMIN_BEARER_TOKEN ?? '';

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

type Envelope<T> =
  | { ok: true; data: T }
  | { ok: false; error: { code: string; message: string } };

const adminFetch = async <T>(path: string): Promise<Envelope<T>> => {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: {
      authorization: `Bearer ${ADMIN_TOKEN}`,
      'accept-language': 'en',
    },
    cache: 'no-store',
  });
  return (await res.json().catch(() => ({
    ok: false,
    error: { code: 'internal_error', message: 'parse failed' },
  }))) as Envelope<T>;
};

export const fetchAuditEvents = (qs: string) =>
  adminFetch<{ events: ServerAuditEvent[]; nextCursor: string | null }>(
    `/admin/v1/audit/events${qs ? `?${qs}` : ''}`,
  );

export const fetchAuditEvent = (id: string) =>
  adminFetch<{ event: ServerAuditEvent } | { event: ServerAuditEvent; verified: boolean; verifierVersion: number }>(
    `/admin/v1/audit/events/${encodeURIComponent(id)}`,
  );

export const fetchCorrelation = (id: string) =>
  adminFetch<{ events: ServerAuditEvent[] }>(
    `/admin/v1/audit/correlations/${encodeURIComponent(id)}`,
  );
