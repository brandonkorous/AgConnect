import { z } from 'zod';

const NAME_MAX = 80;
const NOTE_MAX = 500;
const TIME = /^[0-2][0-9]:[0-5][0-9]$/;

// Schedule color palette: crop-themed, not the daisyUI semantic tokens. The
// values are stable identifiers; the UI maps them to CSS via a lookup. New
// rows default to "olive" (the brand primary).
export const CrewColorEnum = z.enum(['grape', 'almond', 'citrus', 'tomato', 'lettuce', 'olive']);
export type CrewColor = z.infer<typeof CrewColorEnum>;

export const CrewTypeEnum = z.enum(['harvest', 'setup', 'sort', 'irrigation', 'pruning', 'general']);
export type CrewType = z.infer<typeof CrewTypeEnum>;

export const CrewCropEnum = z.enum(['grape', 'almond', 'citrus', 'tomato', 'lettuce', 'strawberry']);
export type CrewCrop = z.infer<typeof CrewCropEnum>;

// Required-skill keys. Match the design's six toggles. Worker
// `workerProfile.skills` is checked against these to compute coverage.
export const CrewSkillEnum = z.enum(['forklift', 'cdl', 'wps', 'bilingual', 'lead', 'irrigation']);
export type CrewSkill = z.infer<typeof CrewSkillEnum>;

// Per-crew communication channel toggles. Stored as a JSONB column.
export const CrewCommsChannels = z
  .object({
    groupChat: z.boolean().optional(),
    smsDigest: z.boolean().optional(),
    whatsappForeman: z.boolean().optional(),
    voiceBroadcast: z.boolean().optional(),
  })
  .strict();
export type CrewCommsChannels = z.infer<typeof CrewCommsChannels>;

export const CrewMemberRoleEnum = z.enum(['member', 'lead']);
export type CrewMemberRole = z.infer<typeof CrewMemberRoleEnum>;

export const ShiftStatusEnum = z.enum(['scheduled', 'in_progress', 'completed', 'cancelled']);
export type ShiftStatus = z.infer<typeof ShiftStatusEnum>;

export const ShiftTypeEnum = z.enum(['work', 'training', 'off', 'holiday']);
export type ShiftType = z.infer<typeof ShiftTypeEnum>;

// Free-form per-shift settings the editor surfaces but doesn't yet have first-class
// schema for. Stored as a JSONB column on shifts.metadata.
export const ShiftMetadata = z
  .object({
    pickup: z
      .object({
        enabled: z.boolean().default(false),
        label: z.string().max(120).optional(),
      })
      .strict()
      .optional(),
    equipmentProvided: z.boolean().optional(),
    equipmentDetail: z.string().max(200).optional(),
    lunchProvided: z.boolean().optional(),
    lunchDetail: z.string().max(200).optional(),
    safety: z
      .object({
        wpsCleared: z.boolean().optional(),
        ppeBriefingDone: z.boolean().optional(),
        emergencyContactsLoaded: z.boolean().optional(),
        restroomNearby: z.boolean().optional(),
      })
      .strict()
      .optional(),
    notifications: z
      .object({
        smsEveningBefore: z.boolean().optional(),
        whatsappMorning: z.boolean().optional(),
        foremanRollCall: z.boolean().optional(),
      })
      .strict()
      .optional(),
    heatAdvisoryAutoApply: z.boolean().optional(),
    heatAdvisoryForecastF: z.number().int().min(-50).max(150).optional(),
  })
  .strict();
export type ShiftMetadata = z.infer<typeof ShiftMetadata>;

export const ShiftAssignmentStatusEnum = z.enum([
  'assigned',
  'confirmed',
  'declined',
  'no_show',
  'completed',
]);
export type ShiftAssignmentStatus = z.infer<typeof ShiftAssignmentStatusEnum>;

const SHORT_CODE_MAX = 4;
const PIECE_RATE_UNIT_MAX = 16;
const SKILLS_MAX = 16;

export const CreateCrewBody = z
  .object({
    name: z.string().min(2).max(NAME_MAX),
    color: CrewColorEnum.default('olive'),
    shortCode: z.string().min(1).max(SHORT_CODE_MAX).optional(),
    crewType: CrewTypeEnum.optional(),
    primaryCrop: CrewCropEnum.optional(),
    foremanUserId: z.string().min(1).optional(),
    jobId: z.string().uuid().optional(),
    requiredSkills: z.array(CrewSkillEnum).max(SKILLS_MAX).optional(),
    baseWageCents: z.number().int().min(0).max(1_000_000).optional(),
    pieceRateCents: z.number().int().min(0).max(1_000_000).optional(),
    pieceRateUnit: z.string().min(1).max(PIECE_RATE_UNIT_MAX).optional(),
    foremanPremiumCents: z.number().int().min(0).max(1_000_000).optional(),
    commsChannels: CrewCommsChannels.optional(),
    notes: z.string().max(NOTE_MAX).optional(),
  })
  .strict();
export type CreateCrewBody = z.infer<typeof CreateCrewBody>;

export const PatchCrewBody = z
  .object({
    name: z.string().min(2).max(NAME_MAX).optional(),
    color: CrewColorEnum.optional(),
    shortCode: z.string().max(SHORT_CODE_MAX).nullable().optional(),
    crewType: CrewTypeEnum.nullable().optional(),
    primaryCrop: CrewCropEnum.nullable().optional(),
    foremanUserId: z.string().min(1).nullable().optional(),
    jobId: z.string().uuid().nullable().optional(),
    requiredSkills: z.array(CrewSkillEnum).max(SKILLS_MAX).optional(),
    baseWageCents: z.number().int().min(0).max(1_000_000).nullable().optional(),
    pieceRateCents: z.number().int().min(0).max(1_000_000).nullable().optional(),
    pieceRateUnit: z.string().max(PIECE_RATE_UNIT_MAX).nullable().optional(),
    foremanPremiumCents: z.number().int().min(0).max(1_000_000).nullable().optional(),
    commsChannels: CrewCommsChannels.optional(),
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
    shiftType: ShiftTypeEnum.default('work'),
    metadata: ShiftMetadata.optional(),
    notes: z.string().max(NOTE_MAX).optional(),
    // When set, materialize sibling shifts on each requested ISO date that
    // shares the same crew/time/location/etc. Useful for "repeat days" UX.
    repeatDates: z.array(z.string().date()).max(31).optional(),
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
    crewId: z.string().uuid().nullable().optional(),
    shiftDate: z.string().date().optional(),
    startTime: z.string().regex(TIME).optional(),
    endTime: z.string().regex(TIME).nullable().optional(),
    locationLabel: z.string().min(1).max(120).optional(),
    locationLat: z.number().nullable().optional(),
    locationLng: z.number().nullable().optional(),
    status: ShiftStatusEnum.optional(),
    shiftType: ShiftTypeEnum.optional(),
    metadata: ShiftMetadata.optional(),
    notes: z.string().max(NOTE_MAX).nullable().optional(),
    // When true, the API enqueues SMS to assigned workers describing the
    // changes. False (or omitted) saves silently — the editor surfaces both
    // explicit save buttons.
    notifyCrew: z.boolean().optional(),
    // Optional sibling-shift expansion on save: dates here will spawn new
    // shifts that mirror the current one (same crew/time/location/type).
    repeatDates: z.array(z.string().date()).max(31).optional(),
  })
  .strict();
export type PatchShiftBody = z.infer<typeof PatchShiftBody>;

export const DuplicateShiftBody = z
  .object({
    shiftDate: z.string().date(),
    crewId: z.string().uuid().nullable().optional(),
  })
  .strict();
export type DuplicateShiftBody = z.infer<typeof DuplicateShiftBody>;

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
  foremanName: z.string().nullable(),
  jobId: z.string().uuid().nullable(),
  jobTitle: z.string().nullable(),
  name: z.string(),
  shortCode: z.string().nullable(),
  crewType: z.string().nullable(),
  primaryCrop: z.string().nullable(),
  color: CrewColorEnum,
  requiredSkills: z.array(CrewSkillEnum),
  baseWageCents: z.number().int().nullable(),
  pieceRateCents: z.number().int().nullable(),
  pieceRateUnit: z.string().nullable(),
  foremanPremiumCents: z.number().int().nullable(),
  commsChannels: CrewCommsChannels,
  notes: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
  memberCount: z.number().int().nonnegative(),
  activeMemberCount: z.number().int().nonnegative(),
});
export type CrewView = z.infer<typeof CrewSchema>;

// Right-rail insights for a single crew. The yield series is real piecework
// data aggregated from shift assignments; the activity feed comes from the
// audit log filtered by `metadata.crewId`. Both can be empty for new crews.
export const CrewYieldPointSchema = z.object({
  date: z.string(),
  pieces: z.number().int().nonnegative(),
});
export type CrewYieldPointView = z.infer<typeof CrewYieldPointSchema>;

export const CrewActivityEventSchema = z.object({
  id: z.string(),
  action: z.string(),
  occurredAt: z.string(),
  actorId: z.string().nullable(),
});
export type CrewActivityEventView = z.infer<typeof CrewActivityEventSchema>;

export const CrewSkillCoverageSchema = z.object({
  skill: CrewSkillEnum,
  haveCount: z.number().int().nonnegative(),
  totalCount: z.number().int().nonnegative(),
});
export type CrewSkillCoverageView = z.infer<typeof CrewSkillCoverageSchema>;

export const CrewInsightsSchema = z.object({
  yield: z.array(CrewYieldPointSchema),
  activity: z.array(CrewActivityEventSchema),
  skillCoverage: z.array(CrewSkillCoverageSchema),
});
export type CrewInsightsView = z.infer<typeof CrewInsightsSchema>;

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
  shiftType: ShiftTypeEnum,
  metadata: ShiftMetadata,
  notes: z.string().nullable(),
  assignedCount: z.number().int().nonnegative(),
  confirmedCount: z.number().int().nonnegative(),
  capacity: z.number().int().nonnegative().nullable(),
});
export type ShiftView = z.infer<typeof ShiftSchema>;

export const ActiveHireSchema = z.object({
  workerUserId: z.string(),
  firstName: z.string(),
  lastInitial: z.string(),
  jobTitle: z.string(),
  hiredAt: z.string(),
});
export type ActiveHireView = z.infer<typeof ActiveHireSchema>;
