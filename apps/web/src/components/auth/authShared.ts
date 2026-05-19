'use client';

// Phone normalization is now the shared canonical primitive in
// @agconn/schemas (used by web auth, the Twilio webhook, and Clerk
// provisioning). Re-exported here so existing call sites are unchanged.
export { normalizeUsPhone, isUsE164 } from '@agconn/schemas';

export function isEmail(input: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.trim());
}

export function clerkErrorMessage(err: unknown, fallback: string): string {
  if (typeof err === 'string') return err || fallback;

  if (err && typeof err === 'object') {
    const o = err as {
      longMessage?: string;
      message?: string;
      code?: string;
      errors?: Array<{ longMessage?: string; message?: string; code?: string }>;
    };
    // Clerk wraps multiple errors under `errors`; the first is typically the
    // user-actionable one. Prefer longMessage > message > code at every layer.
    const first = Array.isArray(o.errors) ? o.errors[0] : undefined;
    const candidates = [
      first?.longMessage,
      first?.message,
      o.longMessage,
      o.message,
      first?.code,
      o.code,
    ];
    for (const c of candidates) {
      if (typeof c === 'string' && c.trim().length > 0) return c;
    }
  }
  if (err instanceof Error) return err.message || fallback;
  return fallback;
}

/**
 * After a `signUp.create({...})` call succeeds, inspect `signUp.missingFields`
 * for fields that are required by the Clerk instance config but are NOT in the
 * list of fields this form will eventually collect. If any are found, the
 * sign-up cannot be completed regardless of what the user does next — most
 * commonly because a Clerk Dashboard setting requires a field (e.g.
 * `phone_number`) that we don't ask for.
 *
 * Returns a human-readable error string, or `null` if the form can proceed.
 */
export function detectUnresolvableMissingFields(
  missingFields: ReadonlyArray<string>,
  formCollects: ReadonlyArray<string>,
): string | null {
  const blocking = missingFields.filter((f) => !formCollects.includes(f));
  if (blocking.length === 0) return null;
  return (
    `Sign-up cannot be completed — your identity provider requires ` +
    `${blocking.join(', ')} but this form does not collect it. ` +
    `This is a configuration issue. Please contact support@agconn.com.`
  );
}
