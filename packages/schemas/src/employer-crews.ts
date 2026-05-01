import { z } from 'zod';

const NAME_MAX = 80;
const NOTE_MAX = 500;
const TIME = /^[0-2][0-9]:[0-5][0-9]$/;

export const CrewColorEnum = z.enum(['primary', 'accent', 'info', 'success', 'warning']);
export type CrewColor = z.infer<typeof CrewColorEnum>;

export const CrewMemberRoleEnum = z.enum(['member', 'lead']);
export type CrewMemberRole = z.infer<typeof CrewMemberRoleEnum>;

export const ShiftStatusEnum = z.enum(['scheduled', 'in_progress', 'completed', 'cancelled']);
export type ShiftStatus = z.infer<typeof ShiftStatusEnum>;

export const ShiftAssignmentStatusEnum = z.enum([
  'assigned',
  'confirmed',
  'declined',
  'no_show',
  'completed',
]);
export type ShiftAssignmentStatus = z.infer<typeof ShiftAssignmentStatusEnum>;

export const CreateCrewBody = z
  .object({
    name: z.string().min(2).max(NAME_MAX),
    color: CrewColorEnum.default('primary'),
    foremanUserId: z.string().min(1).optional(),
    jobId: z.string().uuid().optional(),
    notes: z.string().max(NOTE_MAX).optional(),
  })
  .strict();
export type CreateCrewBody = z.infer<typeof CreateCrewBody>;

export const PatchCrewBody = z
  .object({
    name: z.string().min(2).max(NAME_MAX).optional(),
    color: CrewColorEnum.optional(),
    foremanUserId: z.string().min(1).nullable().optional(),
    jobId: z.string().uuid().nullable().optional(),
    notes: z.string().max(NOTE_MAX).nullable().optional(),
  })
  .strict();
export type PatchCrewBody = z.infer<typeof PatchCrewBody>;

export const AddCrewMemberBody = z
  .object({
    workerUserId: z.string().min(1),
    role: CrewMemberRoleEnum.default('member'),
  })
  .strict();
export type AddCrewMemberBody = z.infer<typeof AddCrewMemberBody>;

export const SetForemanBody = z
  .object({ workerUserId: z.string().min(1) })
  .strict();
export type SetForemanBody = z.infer<typeof SetForemanBody>;

export const ShiftQuery = z
  .object({
    from: z.string().date().optional(),
    to: z.string().date().optional(),
    crewId: z.string().uuid().optional(),
    limit: z.coerce.number().int().min(1).max(200).default(60),
  })
  .strict();
export type ShiftQuery = z.infer<typeof ShiftQuery>;

export const CreateShiftBody = z
  .object({
    crewId: z.string().uuid().nullable().optional(),
    jobId: z.string().uuid().nullable().optional(),
    shiftDate: z.string().date(),
    startTime: z.string().regex(TIME),
    endTime: z.string().regex(TIME).optional(),
    locationLabel: z.string().min(1).max(120),
    locationLat: z.number().gte(-90).lte(90).optional(),
    locationLng: z.number().gte(-180).lte(180).optional(),
    notes: z.string().max(NOTE_MAX).optional(),
    assignWorkerUserIds: z.array(z.string().min(1)).max(50).optional(),
  })
  .strict()
  .refine((b) => !b.endTime || b.endTime > b.startTime, {
    message: 'end_before_start',
    path: ['endTime'],
  });
export type CreateShiftBody = z.infer<typeof CreateShiftBody>;

export const PatchShiftBody = z
  .object({
    shiftDate: z.string().date().optional(),
    startTime: z.string().regex(TIME).optional(),
    endTime: z.string().regex(TIME).nullable().optional(),
    locationLabel: z.string().min(1).max(120).optional(),
    locationLat: z.number().nullable().optional(),
    locationLng: z.number().nullable().optional(),
    status: ShiftStatusEnum.optional(),
    notes: z.string().max(NOTE_MAX).nullable().optional(),
  })
  .strict();
export type PatchShiftBody = z.infer<typeof PatchShiftBody>;

export const AssignWorkerBody = z
  .object({ workerUserId: z.string().min(1) })
  .strict();
export type AssignWorkerBody = z.infer<typeof AssignWorkerBody>;

export const PatchAssignmentBody = z
  .object({
    status: ShiftAssignmentStatusEnum.optional(),
    hoursWorked: z.number().nonnegative().max(24).optional(),
    piecesCount: z.number().int().nonnegative().optional(),
    pieceRateCents: z.number().int().nonnegative().optional(),
  })
  .strict();
export type PatchAssignmentBody = z.infer<typeof PatchAssignmentBody>;

export const CrewSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  employerId: z.string(),
  foremanUserId: z.string().nullable(),
  jobId: z.string().uuid().nullable(),
  name: z.string(),
  color: CrewColorEnum,
  notes: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
  memberCount: z.number().int().nonnegative(),
  activeMemberCount: z.number().int().nonnegative(),
});
export type CrewView = z.infer<typeof CrewSchema>;

export const CrewMemberSchema = z.object({
  id: z.string().uuid(),
  crewId: z.string().uuid(),
  workerUserId: z.string(),
  firstName: z.string(),
  lastInitial: z.string(),
  role: CrewMemberRoleEnum,
  joinedAt: z.string(),
  leftAt: z.string().nullable(),
});
export type CrewMemberView = z.infer<typeof CrewMemberSchema>;

export const ShiftAssignmentSchema = z.object({
  id: z.string().uuid(),
  shiftId: z.string().uuid(),
  workerUserId: z.string(),
  firstName: z.string(),
  lastInitial: z.string(),
  status: ShiftAssignmentStatusEnum,
  hoursWorked: z.number().nullable(),
  piecesCount: z.number().int().nullable(),
  pieceRateCents: z.number().int().nullable(),
});
export type ShiftAssignmentView = z.infer<typeof ShiftAssignmentSchema>;

export const ShiftSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  employerId: z.string(),
  crewId: z.string().uuid().nullable(),
  crewName: z.string().nullable(),
  jobId: z.string().uuid().nullable(),
  shiftDate: z.string(),
  startTime: z.string(),
  endTime: z.string().nullable(),
  locationLabel: z.string(),
  locationLat: z.number().nullable(),
  locationLng: z.number().nullable(),
  status: ShiftStatusEnum,
  notes: z.string().nullable(),
  assignedCount: z.number().int().nonnegative(),
  confirmedCount: z.number().int().nonnegative(),
  capacity: z.number().int().nonnegative().nullable(),
});
export type ShiftView = z.infer<typeof ShiftSchema>;
