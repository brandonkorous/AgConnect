import type { PrismaClient, Prisma as PrismaNS } from '@prisma/client';
import { pools } from './pools.js';

// `prisma` is the cross-cutting client used for work that doesn't belong to a
// specific domain pool: provisioning users from Clerk, audit writes, the four
// known cross-domain transactions, migration scripts, seed scripts. It is the
// `shared` pool — this gives those operations their own bounded connection
// budget so they cannot starve domain-specific traffic.
//
// Domain code should import a domain pool (e.g. `dbClients.worker`) instead
// of `prisma`. Reach for `prisma` only when the work is genuinely cross-cutting.
export const prisma: PrismaClient = pools.shared;

export type { Prisma } from '@prisma/client';
// Re-export the Prisma namespace value too so callers can use `Prisma.sql` /
// `Prisma.empty` / etc. without depending on @prisma/client directly.
export { Prisma as PrismaNamespace } from '@prisma/client';
export {
    Lang,
    WaitlistAudience,
    WaitlistSource,
    EmailStatus,
    SuppressionReason,
    ActorType,
    AuditOutcome,
    UserRole,
    AuthEventStatus,
    SmsStatus,
    County,
    AppStatus,
    AlertChannel,
    JobStatus,
    WageUnit,
    Funder,
    ProgramStatus,
    EnrollmentStatus,
    LicenseType,
    EmployerPlanTier,
    PlanInterval,
    VerificationAction,
    FlcCheckStatus,
    RejectionReason,
    CrewMemberRole,
    ShiftStatus,
    ShiftType,
    ShiftAssignmentStatus,
    PayrollPeriodStatus,
    ComplianceItemStatus,
    MessageChannel,
    MessageDirection,
    TranslationStatus,
    WageStructure,
    PayFrequency,
    MinExperience,
    MinAge,
    ScreeningAnswerType,
    JobEditEventKind,
    RenotifyChannel,
    RenotifyStatus,
} from '@prisma/client';
export type {
    Tenant,
    Waitlist,
    EmailLog,
    EmailSuppression,
    AuditEvent,
    User,
    EmployerProfile,
    AuthEvent,
    SmsLog,
    SmsOptOut,
    WorkerProfile,
    JobPosting,
    Application,
    ApplicationEvent,
    SavedSearch,
    SearchView,
    TrainingProgram,
    Enrollment,
    VerificationLog,
    MspaFlcRegistry,
    MspaSyncRun,
    WorkerSearchLog,
    WorkerInvitation,
    BillingEvent,
    Crew,
    CrewMember,
    Shift,
    ShiftAssignment,
    PayrollPeriod,
    PayrollLine,
    ComplianceItem,
    Conversation,
    ConversationParticipant,
    Message,
    TranslationKey,
    Crop,
    RoleType,
    SkillTag,
    EmployerContact,
    JobPhoto,
    JobScreeningQuestion,
    ApplicationScreeningAnswer,
    JobEditEvent,
    JobRenotification,
    SmsKeyword,
} from '@prisma/client';

export type Db = PrismaClient;
export type Tx = PrismaNS.TransactionClient;

export { pools, type PoolName } from './pools.js';
export {
    dbClients,
    makeRlsClient,
    runWithRlsContext,
    getRlsContext,
    applyRlsToTx,
    type RlsRole,
    type RlsContext,
} from './rls.js';

export type { LocalizedString, ComplianceItemContent } from './compliance-types.js';
