import { z } from 'zod';
import { CountyEnum } from './common';

export const FunderEnum = z.enum(['CDFA', 'F3', 'CalOSBA', 'EDD', 'other']);
export type FunderV = z.infer<typeof FunderEnum>;

export const ProgramStatusEnum = z.enum(['draft', 'active', 'full', 'closed', 'canceled']);

export const SessionTimeSchema = z.object({
  start: z.string().datetime(),
  end: z.string().datetime(),
  notes: z.string().max(140).optional(),
});
export const SessionTimesSchema = z.array(SessionTimeSchema).max(10);
export type SessionTime = z.infer<typeof SessionTimeSchema>;

export const ProgramCardSchema = z.object({
  id: z.string().uuid(),
  seoSlug: z.string(),
  titleEn: z.string(),
  titleEs: z.string(),
  summaryEn: z.string().nullable(),
  summaryEs: z.string().nullable(),
  funder: FunderEnum,
  county: CountyEnum,
  capacity: z.number(),
  enrolledCount: z.number(),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  topics: z.array(z.string()),
  status: ProgramStatusEnum,
  certName: z.string().nullable(),
});

export const ProgramFullSchema = ProgramCardSchema.extend({
  descriptionEn: z.string(),
  descriptionEs: z.string(),
  locationName: z.string(),
  locationAddress: z.string(),
  sessionTimes: SessionTimesSchema,
  orgName: z.string(),
  orgEmail: z.string().nullable(),
});

export const TrainingQuery = z
  .object({
    county: z.array(CountyEnum).optional(),
    funder: z.array(FunderEnum).optional(),
    topics: z.array(z.string()).optional(),
    startBefore: z.string().optional(),
    startAfter: z.string().optional(),
    q: z.string().max(120).optional(),
    hasCapacity: z.coerce.boolean().optional(),
    limit: z.coerce.number().int().min(1).max(50).default(20),
    cursor: z.string().min(1).max(200).optional(),
  })
  .strict();

export const TrainingListResponse = z.object({
  programs: z.array(ProgramCardSchema),
  nextCursor: z.string().nullable(),
});

export const EnrollmentStatusEnum = z.enum(['enrolled', 'completed', 'dropped']);

export const EnrollmentSchema = z.object({
  id: z.string().uuid(),
  programId: z.string().uuid(),
  status: EnrollmentStatusEnum,
  enrolledAt: z.string().datetime(),
  completedAt: z.string().datetime().nullable(),
  droppedAt: z.string().datetime().nullable(),
  certUrl: z.string().nullable(),
  certificateId: z.string().nullable(),
  noShow: z.boolean(),
});

export const EnrollResponse = z.object({
  enrollment: EnrollmentSchema,
  program: ProgramFullSchema,
});

// Org-side -----------------------------------------------------------------

export const CreateProgramBody = z
  .object({
    titleEn: z.string().min(1).max(120),
    titleEs: z.string().min(1).max(120),
    summaryEn: z.string().max(280).optional(),
    summaryEs: z.string().max(280).optional(),
    descriptionEn: z.string().min(20).max(5000),
    descriptionEs: z.string().min(20).max(5000),
    funder: FunderEnum,
    county: CountyEnum,
    locationName: z.string().min(1).max(200),
    locationAddress: z.string().min(1).max(300),
    capacity: z.number().int().min(1).max(500),
    startDate: z.string().datetime(),
    endDate: z.string().datetime(),
    sessionTimes: SessionTimesSchema,
    topics: z.array(z.string()).max(10),
    certName: z.string().max(120).optional(),
  })
  .strict();

export const UpdateEnrollmentBody = z
  .object({
    status: z.enum(['completed', 'dropped']),
    noShow: z.boolean().optional(),
  })
  .strict();
