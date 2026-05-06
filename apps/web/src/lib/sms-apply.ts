// SMS-apply provisioning. Until per-tenant short-codes are wired through the
// employer billing flow, this reads from a single env var. When the var isn't
// set, the UI hides the SMS-apply block entirely — better than showing a fake
// number to farmworkers who would actually try texting it.
export function getSmsApplyNumber(): string | null {
  const raw = process.env.NEXT_PUBLIC_SMS_APPLY_NUMBER?.trim();
  return raw && raw.length > 0 ? raw : null;
}

export function getSmsApplyKeyword(): string {
  return process.env.NEXT_PUBLIC_SMS_APPLY_KEYWORD?.trim() || 'JOB';
}
