import { SEED_ROLE_KEYS } from '@agconn/schemas';

// Roles a member can be assigned in the Team UI. 'owner' is excluded —
// ownership moves only through transfer-owner. The live catalog is
// platform-managed; these seed keys are the assignable default and the
// API re-validates the chosen key against the catalog on write.
export const ASSIGNABLE_ROLE_KEYS = SEED_ROLE_KEYS.filter((k) => k !== 'owner');

export type MemberStatus = 'sms_only' | 'invited' | 'active';

export const STATUS_BADGE: Record<MemberStatus, 'active' | 'pending' | 'closed'> = {
  active: 'active',
  invited: 'pending',
  sms_only: 'closed',
};
