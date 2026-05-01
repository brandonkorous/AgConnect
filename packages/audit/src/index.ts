export {
  auditRegistry,
  isKnownAction,
  type AuditAction,
} from './registry';

export type {
  ActorType,
  AuditOutcome,
  AuditEventInput,
  AuditEventRow,
} from './types';

export { canonicalize, canonicalJSON } from './canonicalize';

export {
  hmacKeys,
  initHmacKeysFromEnv,
  computeHmac,
  verifyHmac,
} from './hmac';

export {
  AuditBreaker,
  defaultBreakerConfig,
  type BreakerConfig,
  type BreakerEvent,
  type BreakerHooks,
  type BreakerState,
  type WriteFn,
} from './breaker';

export {
  sanitizeMetadata,
  clipUserAgent,
  clipForwardedIp,
  type SanitizeResult,
  type SanitizeWarning,
} from './sanitize';
