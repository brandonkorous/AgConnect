import type { ToastHint } from './envelope.js';

type StandardErrorEntry = {
  http: number;
  defaultToast: ToastHint;
  defaultMessage: string;
};

export const StandardErrors = {
  unauthenticated: {
    http: 401,
    defaultToast: 'error',
    defaultMessage: 'Please sign in.',
  },
  forbidden: {
    http: 403,
    defaultToast: 'error',
    defaultMessage: "You don't have access to that.",
  },
  no_tenant: {
    http: 403,
    defaultToast: 'error',
    defaultMessage: 'Account not set up yet.',
  },
  tenant_disabled: {
    http: 403,
    defaultToast: 'error',
    defaultMessage: 'This workspace is paused.',
  },
  not_found: {
    http: 404,
    defaultToast: false,
    defaultMessage: "We couldn't find that.",
  },
  job_gone: {
    http: 410,
    defaultToast: false,
    defaultMessage: 'This job listing has closed.',
  },
  validation_failed: {
    http: 422,
    defaultToast: false,
    defaultMessage: 'Please check the highlighted fields.',
  },
  rate_limited: {
    http: 429,
    defaultToast: 'warning',
    defaultMessage: 'Slow down a moment.',
  },
  conflict: {
    http: 409,
    defaultToast: 'warning',
    defaultMessage: 'Something changed before you saved.',
  },
  confirmation_required: {
    http: 428,
    defaultToast: 'warning',
    defaultMessage: 'Confirmation required.',
  },
  internal_error: {
    http: 500,
    defaultToast: 'error',
    defaultMessage: 'Something went wrong on our end.',
  },
  service_unavailable: {
    http: 503,
    defaultToast: 'error',
    defaultMessage: 'A service is temporarily unavailable.',
  },
  audit_write_failed: {
    http: 500,
    defaultToast: 'error',
    defaultMessage: 'Action could not be recorded.',
  },
  offline: {
    http: 0,
    defaultToast: 'warning',
    defaultMessage: "You're offline.",
  },
  aborted: {
    http: 0,
    defaultToast: false,
    defaultMessage: '',
  },
} as const satisfies Record<string, StandardErrorEntry>;

export type StandardErrorCode = keyof typeof StandardErrors;

export type ErrorCode = StandardErrorCode | (string & {});

export const httpStatusForCode = (code: ErrorCode, fallback = 500): number => {
  const entry = (StandardErrors as Record<string, StandardErrorEntry>)[code];
  return entry?.http && entry.http > 0 ? entry.http : fallback;
};

export const defaultToastForCode = (code: ErrorCode): ToastHint => {
  const entry = (StandardErrors as Record<string, StandardErrorEntry>)[code];
  return entry?.defaultToast ?? 'error';
};

export const defaultMessageForCode = (code: ErrorCode, fallback = ''): string => {
  const entry = (StandardErrors as Record<string, StandardErrorEntry>)[code];
  return entry?.defaultMessage ?? fallback;
};
