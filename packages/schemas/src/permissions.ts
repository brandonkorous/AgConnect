/**
 * Canonical permission scopes for the `users.permissions` array.
 *
 * `role` is the broad lane (worker / employer / training_org / admin).
 * `permissions` are fine-grained scopes within a role — for MVP, only used
 * for admin sub-tiers. An entry of `*` means full access for that role.
 *
 * See docs/00-foundation/02-auth/02-data-model.md.
 */
export const PERMISSIONS = [
  'employers.verify',
  'employers.reject',
  'employers.transfer_tenant',
  'billing.refund',
  'billing.adjust_plan',
  'reports.export',
  'audit.read',
] as const;

export type Permission = (typeof PERMISSIONS)[number];

const PERMISSION_SET = new Set<string>(PERMISSIONS);
const WILDCARD = '*';

export function isKnownPermission(value: string): value is Permission {
  return PERMISSION_SET.has(value);
}

export function hasPermission(
  granted: readonly string[] | null | undefined,
  required: Permission,
): boolean {
  if (!granted) return false;
  if (granted.includes(WILDCARD)) return true;
  return granted.includes(required);
}
