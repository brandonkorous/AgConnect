import { auditRegistry, type AuditAction } from './registry';

export type SanitizeWarning = {
  action: AuditAction;
  key: string;
  reason: 'unsanctioned_key';
};

export type SanitizeResult = {
  metadata: Record<string, unknown>;
  warnings: SanitizeWarning[];
};

export const sanitizeMetadata = (
  action: AuditAction,
  raw: Record<string, unknown> | undefined,
): SanitizeResult => {
  const allowed = new Set<string>(auditRegistry[action].metadata as ReadonlyArray<string>);
  const out: Record<string, unknown> = {};
  const warnings: SanitizeWarning[] = [];
  if (!raw) return { metadata: out, warnings };
  for (const [k, v] of Object.entries(raw)) {
    if (allowed.has(k)) out[k] = v;
    else {
      out[k] = '[unsanctioned]';
      warnings.push({ action, key: k, reason: 'unsanctioned_key' });
    }
  }
  return { metadata: out, warnings };
};

export const clipUserAgent = (ua: string | undefined | null): string | null => {
  if (!ua) return null;
  return ua.length > 256 ? ua.slice(0, 256) : ua;
};

export const clipForwardedIp = (header: string | undefined | null): string | null => {
  if (!header) return null;
  const first = header.split(',')[0]?.trim();
  return first && first.length > 0 ? first : null;
};
