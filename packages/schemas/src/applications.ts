import { z } from 'zod';
import { CountyEnum } from './common';
import { JobCardSchema, JobFullSchema } from './jobs';

export const AppStatusEnum = z.enum(['applied', 'reviewed', 'hired', 'rejected', 'withdrawn']);
export type AppStatusV = z.infer<typeof AppStatusEnum>;

export const ApplicationSchema = z.object({
  id: z.string().uuid(),
  status: AppStatusEnum,
  wageOffered: z.number().nullable(),
  workerNote: z.string().nullable(),
  appliedAt: z.string().datetime(),
  reviewedAt: z.string().datetime().nullable(),
  hiredAt: z.string().datetime().nullable(),
  rejectedAt: z.string().datetime().nullable(),
  withdrawnAt: z.string().datetime().nullable(),
  startDate: z.string().nullable(),
  countyAtApply: CountyEnum.nullable(),
  skillsAtApply: z.array(z.string()),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
export type Application = z.infer<typeof ApplicationSchema>;

export const ApplicationEventSchema = z.object({
  id: z.string().uuid(),
  fromStatus: AppStatusEnum.nullable(),
  toStatus: AppStatusEnum,
  actorRole: z.enum(['worker', 'employer', 'training_org', 'admin']),
  metadata: z.record(z.string(), z.unknown()),
  createdAt: z.string().datetime(),
});
export type ApplicationEvent = z.infer<typeof ApplicationEventSchema>;

export const ApplicationsQuery = z
  .object({
    status: z.enum(['active', 'hired', 'closed']).optional(),
    limit: z.coerce.number().int().min(1).max(50).default(20),
    cursor: z.string().min(1).max(200).optional(),
  })
  .strict();

export const ApplicationsListResponse = z.object({
  applications: z.array(
    ApplicationSchema.extend({ job: JobCardSchema }),
  ),
  nextCursor: z.string().nullable(),
});

export const ApplicationDetailResponse = z.object({
  application: ApplicationSchema,
  job: JobFullSchema,
  events: z.array(ApplicationEventSchema),
  employer: z.object({
    id: z.string(),
    name: z.string(),
    phone: z.string().nullable(),
    email: z.string().nullable(),
  }),
});
