import type { AuditEventInput } from './types';

// Deterministic JSON serialization following RFC 8785 conventions:
// sorted object keys (lexicographic on UTF-16 code units), no whitespace,
// JSON.stringify number/string formatting, arrays preserve order.
export const canonicalJSON = (value: unknown): string => {
  if (value === null) return 'null';
  if (typeof value === 'boolean') return value ? 'true' : 'false';
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) {
      throw new Error('canonicalJSON: non-finite number');
    }
    return JSON.stringify(value);
  }
  if (typeof value === 'string') return JSON.stringify(value);
  if (typeof value === 'bigint') return value.toString();
  if (Array.isArray(value)) {
    return '[' + value.map((v) => canonicalJSON(v)).join(',') + ']';
  }
  if (typeof value === 'object') {
    const keys = Object.keys(value as Record<string, unknown>).sort();
    const parts: string[] = [];
    for (const k of keys) {
      const v = (value as Record<string, unknown>)[k];
      if (v === undefined) continue;
      parts.push(JSON.stringify(k) + ':' + canonicalJSON(v));
    }
    return '{' + parts.join(',') + '}';
  }
  throw new Error(`canonicalJSON: unsupported type ${typeof value}`);
};

const US = String.fromCharCode(0x1f);

const requireNoUS = (label: string, s: string | null) => {
  if (s !== null && s.includes(US)) {
    throw new Error(`audit field ${label} contains forbidden Unit Separator (U+001F)`);
  }
};

export const canonicalize = (e: AuditEventInput): string => {
  requireNoUS('tenantId', e.tenantId);
  requireNoUS('actorId', e.actorId);
  requireNoUS('actorRole', e.actorRole);
  requireNoUS('action', e.action);
  requireNoUS('resourceType', e.resourceType);
  requireNoUS('resourceId', e.resourceId);
  requireNoUS('correlationId', e.correlationId);

  return [
    e.tenantId,
    e.occurredAtMs.toString(),
    e.actorType,
    e.actorId ?? '',
    e.actorRole ?? '',
    e.action,
    e.resourceType ?? '',
    e.resourceId ?? '',
    e.outcome,
    e.correlationId ?? '',
    canonicalJSON(e.metadata),
  ].join(US);
};
