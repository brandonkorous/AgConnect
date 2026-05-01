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
} from '@prisma/client';

export type Db = PrismaClient;
export type Tx = PrismaNS.TransactionClient;
