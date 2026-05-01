import { z } from 'zod';
import { CountyEnum } from './common';
import { CertSummarySchema } from './employer-applications';

export const WorkerSearchQuery = z
  .object({
    county: z.array(CountyEnum).optional(),
    skills: z.array(z.string().min(1).max(60)).optional(),
    certTopics: z.array(z.string()).optional(),
    availabilityDay: z
      .array(z.enum(['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']))
      .optional(),
    availabilityTime: z.enum(['am', 'pm', 'either']).optional(),
    q: z.string().max(120).optional(),
    limit: z.coerce.number().int().min(1).max(50).default(20),
    cursor: z.string().min(1).max(200).optional(),
  })
  .strict();
export type WorkerSearchQuery = z.infer<typeof WorkerSearchQuery>;

export const WorkerCardSchema = z.object({
  id: z.string(),
  firstName: z.string(),
  lastInitial: z.string(),
  lastName: z.string().optional(),                                // present only when relationship exists
  county: CountyEnum.nullable(),
  skills: z.array(z.string()),
  matchScore: z.number().int(),
  certifications: z.array(CertSummarySchema),
  availability: z.unknown(),
  experienceCount: z.number().int(),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  relationship: z.enum(['hired', 'invited', 'applied']).optional(),
});
export type WorkerCard = z.infer<typeof WorkerCardSchema>;

export const WorkerSearchResponse = z.object({
  workers: z.array(WorkerCardSchema),
  nextCursor: z.string().nullable(),
});

export const WorkerPreviewResponse = z.object({
  worker: WorkerCardSchema.extend({
    experience: z.array(z.unknown()),
    education: z.array(z.unknown()),
    languages: z.array(z.string()),
  }),
});

export const InviteWorkerBody = z
  .object({
    jobId: z.string().uuid(),
    message: z.string().max(500).optional(),
  })
  .strict();

export const WorkerInvitationSchema = z.object({
  id: z.string().uuid(),
  workerId: z.string(),
  jobId: z.string().uuid(),
  message: z.string().nullable(),
  acceptedAt: z.string().datetime().nullable(),
  declinedAt: z.string().datetime().nullable(),
  expiredAt: z.string().datetime().nullable(),
  createdAt: z.string().datetime(),
});

export const InvitationsListResponse = z.object({
  invitations: z.array(WorkerInvitationSchema),
});
