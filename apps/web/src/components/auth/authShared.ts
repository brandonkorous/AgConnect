'use client';

export function normalizeUsPhone(input: string): string | null {
  const digits = input.replace(/\D+/g, '');
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith('1')) return `+${digits}`;
  if (input.startsWith('+') && digits.length >= 10) return `+${digits}`;
  return null;
}

export function isEmail(input: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.trim());
}

export function clerkErrorMessage(
  err: unknown,
  fallback: string,
): string {
  if (
    err &&
    typeof err === 'object' &&
    'errors' in err &&
    Array.isArray((err as { errors: unknown[] }).errors)
  ) {
    const first = (err as { errors: Array<{ longMessage?: string; message?: string }> })
      .errors[0];
    return first?.longMessage ?? first?.message ?? fallback;
  }
  if (err instanceof Error) return err.message || fallback;
  return fallback;
}
