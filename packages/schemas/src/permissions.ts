/**
 * Canonical permission scopes.
 *
 * `role` (worker / employer / training_org / admin) is the broad lane used by
 * RLS. Within the employer lane, access is governed by the platform-managed
 * `roles` catalog: each role carries a `permissions` array, assigned to an
 * employer_contacts membership. A member's effective permissions are the
 * permissions of their active membership's role. `*` = full access.
 *
 * Admin sub-tier permissions (employers.verify, billing.refund, …) remain on
 * `users.permissions`. See docs/00-foundation/02-auth/02-data-model.md.
 */
export const PERMISSIONS = [
  // Admin sub-tiers (users.permissions)
  'employers.verify',
  'employers.reject',
  'employers.transfer_tenant',
  'billing.refund',
  'billing.adjust_plan',
  'reports.export',
  'audit.read',
  'roles.manage',
  // Employer membership scopes (roles.permissions)
  'jobs.read',
  'jobs.write',
  'applicants.read',
  'applicants.write',
  'worker_search.use',
  'crews.read',
  'crews.manage',
  'crews.record',
  'payroll.read',
  'payroll.manage',
  'payroll.record',
  'compliance.read',
  'compliance.write',
  'reports.read',
  'billing.manage',
  'members.read',
  'members.manage',
  'flc.read',
  'flc.write',
  'messaging.use',
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

/**
 * Seed catalog for the global `roles` table. Platform admins may add/remove
 * roles and edit permission arrays at runtime; this is only the initial
 * seed. The new-migration SQL hardcodes the same arrays — keep in sync.
 *
 * `scopeQualifier: 'self_crew'` (foreman) restricts crews/shifts/payroll to
 * crews where crew.foreman_user_id = the member's user id.
 */
export type RoleBundle = {
  key: string;
  permissions: string[];
  scopeQualifier: 'self_crew' | null;
};

export const SEED_ROLE_BUNDLES: readonly RoleBundle[] = [
  { key: 'owner', permissions: ['*'], scopeQualifier: null },
  {
    key: 'manager',
    permissions: [
      'jobs.read',
      'jobs.write',
      'applicants.read',
      'applicants.write',
      'worker_search.use',
      'crews.read',
      'crews.manage',
      'payroll.read',
      'payroll.manage',
      'compliance.read',
      'reports.read',
      'members.read',
      'flc.read',
      'messaging.use',
    ],
    scopeQualifier: null,
  },
  {
    key: 'hiring',
    permissions: [
      'jobs.read',
      'applicants.read',
      'applicants.write',
      'worker_search.use',
      'reports.read',
      'messaging.use',
    ],
    scopeQualifier: null,
  },
  {
    key: 'job_poster',
    permissions: ['jobs.read', 'jobs.write'],
    scopeQualifier: null,
  },
  {
    key: 'compliance',
    permissions: [
      'jobs.read',
      'applicants.read',
      'payroll.read',
      'compliance.read',
      'compliance.write',
      'reports.read',
      'flc.read',
      'flc.write',
    ],
    scopeQualifier: null,
  },
  {
    key: 'reporting',
    permissions: [
      'jobs.read',
      'applicants.read',
      'crews.read',
      'payroll.read',
      'compliance.read',
      'reports.read',
      'flc.read',
    ],
    scopeQualifier: null,
  },
  {
    key: 'billing',
    permissions: ['reports.read', 'billing.manage'],
    scopeQualifier: null,
  },
  {
    key: 'foreman',
    permissions: ['crews.read', 'crews.record', 'payroll.record'],
    scopeQualifier: 'self_crew',
  },
];

export const SEED_ROLE_KEYS = SEED_ROLE_BUNDLES.map((r) => r.key);
