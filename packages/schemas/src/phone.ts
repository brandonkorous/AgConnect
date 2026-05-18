// Canonical US phone normalizer. Single source of truth for E.164 across
// every surface that touches a phone number — web auth forms, the Twilio
// inbound webhook, and the Clerk provisioning primitive — so the three
// never disagree on format. See
// docs/00-foundation/13-onboarding-identity-remediation/02-phase-0-recon.md (0.4).
//
// Semantics are intentionally identical to the original web-only
// implementation it replaces (apps/web/.../auth/authShared.ts) to avoid a
// behavior change at existing call sites.

/**
 * Normalize loose user input to strict E.164 (`+1` + 10 digits) or `null`
 * when the input cannot be a US number. Pure; safe in client and server code.
 */
export function normalizeUsPhone(input: string): string | null {
  const digits = input.replace(/\D+/g, '');
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith('1')) return `+${digits}`;
  if (input.startsWith('+') && digits.length >= 10) return `+${digits}`;
  return null;
}

/** True when `value` is already strict US E.164 (`+1` + 10 digits). */
export function isUsE164(value: string): boolean {
  return /^\+1\d{10}$/.test(value);
}
