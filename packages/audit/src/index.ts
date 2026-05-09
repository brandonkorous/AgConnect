export {
  auditRegistry,
  isKnownAction,
  type AuditAction,
} from './registry.js';

export type {
  ActorType,
  AuditOutcome,
  AuditEventInput,
  AuditEventRow,
} from './types.js';

export { canonicalize, canonicalJSON } from './canonicalize.js';

export {
  hmacKeys,
  initHmacKeysFromEnv,
  computeHmac,
  verifyHmac,
} from './hmac.js';

export {
  AuditBreaker,
  defaultBreakerConfig,
  type BreakerConfig,
  type BreakerEvent,
  type BreakerHooks,
  type BreakerState,
  type WriteFn,
} from './breaker.js';

export {
  sanitizeMetadata,
  clipUserAgent,
  clipForwardedIp,
  type SanitizeResult,
  type SanitizeWarning,
} from './sanitize.js';
