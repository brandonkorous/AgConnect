import { z } from 'zod';

export const listAuditQuery = z
  .object({
    tenantId: z.string().uuid().optional(),
    actorId: z.string().min(1).max(200).optional(),
    actorRole: z.enum(['worker', 'employer', 'training_org', 'admin', 'system']).optional(),
    action: z.string().min(1).max(120).optional(),
    actionPrefix: z.string().min(1).max(120).optional(),
    resourceType: z.string().min(1).max(120).optional(),
    resourceId: z.string().min(1).max(200).optional(),
    outcome: z.enum(['success', 'failure']).optional(),
    correlationId: z.string().uuid().optional(),
    from: z.string().datetime().optional(),
    to: z.string().datetime().optional(),
    cursor: z.string().min(1).max(200).optional(),
    limit: z.coerce.number().int().min(1).max(200).optional(),
  })
  .refine((v) => !(v.action && v.actionPrefix), {
    message: 'action and actionPrefix are mutually exclusive',
    path: ['action'],
  });

export type ListAuditQuery = z.infer<typeof listAuditQuery>;

export const verifyQuery = listAuditQuery;

export const redactBody = z.object({
  tenantId: z.string().uuid(),
  actorId: z.string().min(1).max(200),
  requestId: z.string().min(1).max(120),
  reason: z.enum(['ccpa_user_request', 'gdpr_user_request', 'legal_hold_release']),
  dryRun: z.boolean().optional(),
});

export type RedactBody = z.infer<typeof redactBody>;
