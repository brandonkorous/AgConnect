import 'server-only';
import { adminFetch } from './api-server';

// ─── tenants ─────────────────────────────────────────────────────────────────

export type TenantListRow = {
  id: string;
  slug: string;
  name: string;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
  settings: unknown;
  counts: { users: number; employers: number; jobs: number };
};

export type TenantDetail = {
  tenant: Omit<TenantListRow, 'counts'>;
  counts: {
    users: number;
    employers: number;
    jobs: number;
    applications: number;
    enrollments: number;
  };
};

export const fetchTenants = (search?: string) =>
  adminFetch<{ tenants: TenantListRow[] }>('/admin/v1/directory/tenants', {
    query: { search },
  });

export const fetchTenant = (id: string) =>
  adminFetch<TenantDetail>(`/admin/v1/directory/tenants/${encodeURIComponent(id)}`);

// ─── users ──────────────────────────────────────────────────────────────────

export type UserListRow = {
  id: string;
  tenantId: string | null;
  role: string;
  email: string | null;
  phone: string | null;
  preferredLang: 'en' | 'es';
  onboarded: boolean;
  createdAt: string;
  updatedAt: string;
};

export type UserDetail = {
  user: UserListRow & {
    tenantName: string | null;
    permissions: string[];
    consentMethod: string | null;
    consentedAt: string | null;
    smsOptInState: string | null;
    workerProfile: {
      firstName: string;
      lastName: string;
      county: string | null;
      onboardedAt: string | null;
    } | null;
    employerProfile: {
      id: string;
      legalName: string;
      licenseType: string | null;
      verified: boolean;
    } | null;
  };
  counts: { applications: number; enrollments: number };
};

export const fetchUsers = (q: {
  search?: string;
  role?: string;
  tenantId?: string;
}) =>
  adminFetch<{ users: UserListRow[] }>('/admin/v1/directory/users', {
    query: { search: q.search, role: q.role, tenantId: q.tenantId },
  });

export const fetchUser = (id: string) =>
  adminFetch<UserDetail>(`/admin/v1/directory/users/${encodeURIComponent(id)}`);

// ─── employers ──────────────────────────────────────────────────────────────

export type EmployerListRow = {
  id: string;
  tenantId: string;
  legalName: string;
  dbaName: string | null;
  licenseType: string | null;
  flcLicenseNum: string | null;
  county: string | null;
  contactEmail: string | null;
  verified: boolean;
  rejected: boolean;
  createdAt: string;
};

export type EmployerDetail = {
  employer: {
    id: string;
    tenantId: string;
    tenantName: string;
    legalName: string;
    dbaName: string | null;
    contactEmail: string | null;
    contactPhone: string | null;
    licenseType: string | null;
    ein: string | null;
    flcLicenseNum: string | null;
    dolMspaNum: string | null;
    county: string | null;
    streetAddress: string | null;
    city: string | null;
    flcVerifiedAt: string | null;
    flcCheckStatus: string | null;
    rejectedAt: string | null;
    rejectionReason: string | null;
    verifiedBy: string | null;
    plan: string;
    createdAt: string;
    updatedAt: string;
  };
  counts: { postings: number; applications: number; hires: number };
  verificationLog: {
    id: string;
    action: string;
    actorUserId: string | null;
    notes: string | null;
    payload: unknown;
    createdAt: string;
  }[];
};

export const fetchEmployers = (q: {
  search?: string;
  licenseType?: string;
  verified?: 'true' | 'false' | 'pending';
  tenantId?: string;
}) =>
  adminFetch<{ employers: EmployerListRow[] }>('/admin/v1/directory/employers', {
    query: {
      search: q.search,
      licenseType: q.licenseType,
      verified: q.verified,
      tenantId: q.tenantId,
    },
  });

export const fetchEmployer = (id: string) =>
  adminFetch<EmployerDetail>(`/admin/v1/directory/employers/${encodeURIComponent(id)}`);

// ─── workers ────────────────────────────────────────────────────────────────

export type WorkerListRow = {
  id: string;
  email: string | null;
  phone: string | null;
  preferredLang: 'en' | 'es';
  onboarded: boolean;
  firstName: string | null;
  lastName: string | null;
  county: string | null;
  skills: string[];
  onboardedAt: string | null;
  createdAt: string;
};

export type WorkerDetail = {
  worker: {
    id: string;
    email: string | null;
    phone: string | null;
    preferredLang: 'en' | 'es';
    consentMethod: string | null;
    consentedAt: string | null;
    smsOptInState: string | null;
    onboarded: boolean;
    createdAt: string;
    profile: {
      firstName: string;
      lastName: string;
      zipCode: string | null;
      county: string | null;
      skills: string[];
      certifications: unknown;
      onboardedAt: string | null;
    } | null;
  };
  certCount: number;
  applications: {
    id: string;
    status: string;
    jobTitle: string;
    employerId: string;
    appliedAt: string;
    hiredAt: string | null;
    wageOffered: number | null;
  }[];
  enrollments: {
    id: string;
    status: string;
    programTitle: string;
    funder: string;
    county: string;
    enrolledAt: string;
    completedAt: string | null;
    certificateId: string | null;
  }[];
};

export const fetchWorkers = (q: { search?: string; county?: string }) =>
  adminFetch<{ workers: WorkerListRow[] }>('/admin/v1/directory/workers', {
    query: { search: q.search, county: q.county },
  });

export const fetchWorker = (id: string) =>
  adminFetch<WorkerDetail>(`/admin/v1/directory/workers/${encodeURIComponent(id)}`);
