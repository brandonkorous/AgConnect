import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient, type Prisma as PrismaNS } from '@prisma/client';

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function createPrisma(): PrismaClient {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error('DATABASE_URL is not set — required for @agconn/db');
  }
  const adapter = new PrismaPg({ connectionString: url });
  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  });
}

export const prisma: PrismaClient = globalForPrisma.prisma ?? createPrisma();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

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

export {
  rlsClient,
  runWithRlsContext,
  getRlsContext,
  applyRlsToTx,
  type RlsRole,
  type RlsContext,
} from './rls.js';

// Compliance instruction content lives in the DB (table:
// compliance_item_content). The TS seed file is retained for re-seeding
// fresh environments and is exported as `_COMPLIANCE_CONTENT_SEED` for the
// seed script only — runtime callers must read from the DB.
export {
  COMPLIANCE_ITEM_CONTENT as _COMPLIANCE_CONTENT_SEED,
  type ComplianceItemContent,
  type LocalizedString,
} from '../seed-data/compliance-item-content.js';
