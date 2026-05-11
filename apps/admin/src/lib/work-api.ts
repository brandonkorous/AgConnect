import 'server-only';
import { adminFetch } from './api-server';

// ─── jobs ───────────────────────────────────────────────────────────────────

export type JobListRow = {
  id: string;
  tenantId: string;
  employerId: string;
  titleEn: string;
  county: string;
  city: string | null;
  wageMin: number;
  wageMax: number;
  wageUnit: string;
  status: 'draft' | 'active' | 'closed' | 'filled';
  positionsTotal: number;
  hireCount: number;
  startDate: string;
  applyBy: string | null;
  publishedAt: string | null;
  filledAt: string | null;
  closedAt: string | null;
  createdAt: string;
};

export type JobDetail = {
  job: JobListRow & {
    tenantName: string;
    employerName: string;
    titleEs: string;
    descriptionEn: string;
    descriptionEs: string;
    zipCode: string | null;
    skills: string[];
    housing: boolean;
    transport: boolean;
    seoSlug: string | null;
    endDate: string | null;
    updatedAt: string;
  };
  applicationCount: number;
  screeningQuestions: {
    id: string;
    sortOrder: number;
    questionEn: string;
    questionEs: string;
    answerType: string;
    required: boolean;
  }[];
  renotifications: {
    id: string;
    channel: string;
    status: string;
    sentAt: string | null;
    error: string | null;
  }[];
};

export const fetchJobs = (q: {
  search?: string;
  status?: string;
  counties?: string[];
}) =>
  adminFetch<{ jobs: JobListRow[] }>('/admin/v1/work/jobs', {
    query: { search: q.search, status: q.status, counties: q.counties },
  });

export const fetchJob = (id: string) =>
  adminFetch<JobDetail>(`/admin/v1/work/jobs/${encodeURIComponent(id)}`);

// ─── applications ───────────────────────────────────────────────────────────

export type ApplicationListRow = {
  id: string;
  tenantId: string;
  jobId: string;
  jobTitle: string;
  employerId: string;
  workerId: string;
  status: 'applied' | 'reviewed' | 'hired' | 'rejected' | 'withdrawn';
  wageOffered: number | null;
  appliedAt: string;
  reviewedAt: string | null;
  hiredAt: string | null;
  rejectedAt: string | null;
  countyAtApply: string | null;
};

export type ApplicationDetail = {
  application: ApplicationListRow & {
    workerName: string | null;
    workerEmail: string | null;
    workerPhone: string | null;
    workerLang: 'en' | 'es';
    workerCounty: string | null;
    skillsAtApply: string[];
    workerNote: string | null;
    employerNote: string | null;
    rejectionReason: string | null;
    rejectionReasonText: string | null;
    withdrawnAt: string | null;
    startDate: string | null;
  };
  events: {
    id: string;
    fromStatus: string | null;
    toStatus: string;
    actorUserId: string;
    actorRole: string;
    metadata: unknown;
    createdAt: string;
  }[];
  screeningAnswers: {
    id: string;
    questionEn: string;
    answerType: string;
    answerYes: boolean | null;
    answerText: string | null;
    answeredAt: string;
  }[];
};

export const fetchApplications = (q: {
  search?: string;
  status?: string;
  jobId?: string;
  workerId?: string;
}) =>
  adminFetch<{ applications: ApplicationListRow[] }>('/admin/v1/work/applications', {
    query: {
      search: q.search,
      status: q.status,
      jobId: q.jobId,
      workerId: q.workerId,
    },
  });

export const fetchApplication = (id: string) =>
  adminFetch<ApplicationDetail>(`/admin/v1/work/applications/${encodeURIComponent(id)}`);

// ─── enrollments ────────────────────────────────────────────────────────────

export type EnrollmentListRow = {
  id: string;
  tenantId: string;
  programId: string;
  programTitle: string;
  funder: string;
  county: string;
  workerId: string;
  status: 'enrolled' | 'completed' | 'dropped';
  enrolledAt: string;
  completedAt: string | null;
  droppedAt: string | null;
  noShow: boolean;
  certIssued: boolean;
  certificateId: string | null;
};

export type EnrollmentDetail = {
  enrollment: {
    id: string;
    tenantId: string;
    status: string;
    enrolledAt: string;
    completedAt: string | null;
    droppedAt: string | null;
    noShow: boolean;
    certUrl: string | null;
    certGeneratedAt: string | null;
    certificateId: string | null;
    reminderSent48h: boolean;
    reminderSent2h: boolean;
  };
  program: {
    id: string;
    titleEn: string;
    funder: string;
    county: string;
    locationName: string;
    startDate: string;
    endDate: string;
    certName: string | null;
  };
  worker: {
    id: string;
    email: string | null;
    phone: string | null;
    preferredLang: 'en' | 'es';
    firstName: string | null;
    lastName: string | null;
    county: string | null;
  };
};

export const fetchEnrollments = (q: { search?: string; status?: string }) =>
  adminFetch<{ enrollments: EnrollmentListRow[] }>('/admin/v1/work/enrollments', {
    query: { search: q.search, status: q.status },
  });

export const fetchEnrollment = (id: string) =>
  adminFetch<EnrollmentDetail>(`/admin/v1/work/enrollments/${encodeURIComponent(id)}`);

// ─── compliance ─────────────────────────────────────────────────────────────

export type ComplianceItemRow = {
  id: string;
  tenantId: string;
  employerId: string;
  category: string;
  itemKey: string;
  label: string;
  status: 'ok' | 'warn' | 'fail';
  details: string | null;
  evidenceUrl: string | null;
  dueAt: string | null;
  resolvedAt: string | null;
};

export type ScoreboardRow = {
  employerId: string;
  employerName: string;
  tenantId: string;
  snapshotDate: string;
  score: number;
  okCount: number;
  warnCount: number;
  failCount: number;
};

export const fetchComplianceItems = (q: {
  search?: string;
  status?: string;
  category?: string;
}) =>
  adminFetch<{ items: ComplianceItemRow[] }>('/admin/v1/work/compliance/items', {
    query: { search: q.search, status: q.status, category: q.category },
  });

export const fetchScoreboard = () =>
  adminFetch<{ asOf: string; rows: ScoreboardRow[] }>(
    '/admin/v1/work/compliance/scoreboard',
  );
