import { z } from 'zod';

// Employer roster member. A row with a userId + acceptedAt is a platform
// member scoped by role; otherwise an SMS-only contact / pending invite.
// roleKey is validated against the live roles catalog at the route layer
// (the catalog is platform-managed, not a fixed enum). 'owner' is never
// assignable here — ownership moves only via POST /members/transfer-owner.

const roleKey = z
  .string()
  .min(2)
  .max(40)
  .regex(/^[a-z][a-z0-9_]*$/)
  .refine((k) => k !== 'owner', { message: 'owner is assigned via transfer-owner' });

export const MemberInput = z
  .object({
    name: z.string().min(2).max(120),
    phone: z.string().max(40).default(''),
    email: z.string().email().max(200).optional(),
    roleKey,
    languages: z.array(z.enum(['en', 'es'])).min(1).max(2).default(['en', 'es']),
    sortOrder: z.number().int().min(0).max(999).default(0),
    // When true and an email is present, send a platform invitation.
    invite: z.boolean().default(false),
  })
  .strict();
export type MemberInput = z.infer<typeof MemberInput>;

export const MemberPatch = MemberInput.partial().omit({ invite: true }).strict();
export type MemberPatch = z.infer<typeof MemberPatch>;

export const TransferOwnerBody = z.object({ contactId: z.string().uuid() }).strict();
export type TransferOwnerBody = z.infer<typeof TransferOwnerBody>;

export type MemberStatus = 'sms_only' | 'invited' | 'active';

export const MemberView = z.object({
  id: z.string().uuid(),
  userId: z.string().nullable(),
  name: z.string(),
  email: z.string().nullable(),
  phone: z.string(),
  roleKey: z.string(),
  scopeQualifier: z.string().nullable(),
  languages: z.array(z.enum(['en', 'es'])),
  sortOrder: z.number().int(),
  status: z.enum(['sms_only', 'invited', 'active']),
  isOwner: z.boolean(),
  invitedAt: z.string().nullable(),
  acceptedAt: z.string().nullable(),
});
export type MemberView = z.infer<typeof MemberView>;

export const AcceptInviteResult = z.object({
  employerId: z.string().uuid(),
  employerName: z.string(),
  roleKey: z.string(),
});
export type AcceptInviteResult = z.infer<typeof AcceptInviteResult>;
