import { z } from 'zod';
import { CountyEnum } from './common';
import { AppStatusEnum } from './applications';

export const RejectionReasonEnum = z.enum([
  'not_qualified',
  'too_far',
  'position_filled',
  'no_response',
  'other',
]);
export type RejectionReason = z.infer<typeof RejectionReasonEnum>;

export const CertSummarySchema = z.object({
  name: z.string(),
  issuer: z.string().nullable(),
  source: z.enum(['agconn', 'self']),
});

export const ApplicantWorkerCardSchema = z.object({
  id: z.string(),
  firstName: z.string(),
  lastInitial: z.string(),
  county: CountyEnum.nullable(),
  skills: z.array(z.string()),
  skillsMatchCount: z.number().int(),
  certifications: z.array(CertSummarySchema),
});

export const ApplicationCardSchema = z.object({
  id: z.string().uuid(),
  status: AppStatusEnum,
  appliedAt: z.string().datetime(),
  job: z.object({
    id: z.string().uuid(),
    titleEn: z.string(),
    titleEs: z.string(),
    county: CountyEnum,
    seoSlug: z.string().nullable(),
  }),
  worker: ApplicantWorkerCardSchema,
  unread: z.boolean(),
});
export type ApplicationCard = z.infer<typeof ApplicationCardSchema>;

export const InboxQuery = z
  .object({
    status: AppStatusEnum.optional(),
    jobId: z.string().uuid().optional(),
    limit: z.coerce.number().int().min(1).max(50).default(20),
    cursor: z.string().min(1).max(200).optional(),
  })
  .strict();

export const InboxResponse = z.object({
  applications: z.array(ApplicationCardSchema),
  nextCursor: z.string().nullable(),
  unreadCount: z.number().int(),
});

export const KanbanResponse = z.object({
  columns: z.object({
    applied: z.array(ApplicationCardSchema),
    reviewed: z.array(ApplicationCardSchema),
    hired: z.array(ApplicationCardSchema),
  }),
  rejectedCount: z.number().int(),
});

export const ApplicantDetailResponse = z.object({
  application: z.object({
    id: z.string().uuid(),
    status: AppStatusEnum,
    workerNote: z.string().nullable(),
    employerNote: z.string().nullable(),
    rejectionReason: RejectionReasonEnum.nullable(),
    rejectionReasonText: z.string().nullable(),
    wageOffered: z.number().nullable(),
    appliedAt: z.string().datetime(),
    reviewedAt: z.string().datetime().nullable(),
    hiredAt: z.string().datetime().nullable(),
    rejectedAt: z.string().datetime().nullable(),
    startDate: z.string().nullable(),
  }),
  job: z.object({
    id: z.string().uuid(),
    titleEn: z.string(),
    titleEs: z.string(),
    county: CountyEnum,
    wageMin: z.number(),
    wageMax: z.number(),
    seoSlug: z.string().nullable(),
  }),
  worker: z.object({
    id: z.string(),
    firstName: z.string(),
    lastName: z.string(),
    phone: z.string().nullable(),
    email: z.string().email().nullable(),
    county: CountyEnum.nullable(),
    zipCode: z.string().nullable(),
    skills: z.array(z.string()),
    certifications: z.array(CertSummarySchema),
    availability: z.unknown(),
  }),
  events: z.array(
    z.object({
      id: z.string().uuid(),
      fromStatus: AppStatusEnum.nullable(),
      toStatus: AppStatusEnum,
      actorRole: z.enum(['worker', 'employer', 'training_org', 'admin']),
      metadata: z.record(z.string(), z.unknown()),
      createdAt: z.string().datetime(),
    }),
  ),
});

// Transition body — discriminated union per target status.
export const TransitionBody = z.discriminatedUnion('toStatus', [
  z
    .object({
      toStatus: z.literal('reviewed'),
      note: z.string().max(2000).optional(),
    })
    .strict(),
  z
    .object({
      toStatus: z.literal('hired'),
      wageOffered: z.number().min(0).max(500),
      startDate: z.string().date(),
      note: z.string().max(2000).optional(),
    })
    .strict(),
  z
    .object({
      toStatus: z.literal('rejected'),
      rejectionReason: RejectionReasonEnum.optional(),
      rejectionReasonText: z.string().max(500).optional(),
    })
    .strict(),
]);
export type TransitionBody = z.infer<typeof TransitionBody>;

export const BulkTransitionBody = z
  .object({
    applicationIds: z.array(z.string().uuid()).min(1).max(100),
    toStatus: z.enum(['reviewed', 'rejected']),
    rejectionReason: RejectionReasonEnum.optional(),
  })
  .strict();

export const BulkTransitionResponse = z.object({
  succeeded: z.array(z.string().uuid()),
  failed: z.array(z.object({ id: z.string().uuid(), error: z.string() })),
});

export const NoteBody = z
  .object({
    note: z.string().max(2000),
  })
  .strict();
