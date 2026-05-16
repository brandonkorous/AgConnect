import { Hono } from 'hono';
import { z } from 'zod';
import { ok, err, validate } from '@agconn/api-client/server';
import {
  clerkAdminAuthMiddleware,
  requireAdminOrg,
  type AdminOrgVars,
} from '../../middleware/adminClerkAuth.js';
import type { AuditCtxVars } from '../../middleware/audit.js';

export const adminDirectoryRoutes = new Hono<{
  Variables: AdminOrgVars & AuditCtxVars;
}>();

adminDirectoryRoutes.use('*', clerkAdminAuthMiddleware);
adminDirectoryRoutes.use('*', requireAdminOrg('admin'));

// ─── tenants ─────────────────────────────────────────────────────────────────

const listTenantsQuery = z
  .object({
    search: z.string().min(1).max(200).optional(),
    includeDeleted: z.coerce.boolean().default(false),
    limit: z.coerce.number().int().min(1).max(500).default(100),
  })
  .strict();

adminDirectoryRoutes.get(
  '/tenants',
  validate('query', listTenantsQuery),
  async (c) => {
    const q = c.var.body;
    const where: Record<string, unknown> = {};
    if (!q.includeDeleted) where['deletedAt'] = null;
    if (q.search) {
      where['OR'] = [
        { name: { contains: q.search, mode: 'insensitive' } },
        { slug: { contains: q.search, mode: 'insensitive' } },
      ];
    }
    const tenants = await c.var.db.tenant.findMany({
      where,
      orderBy: { name: 'asc' },
      take: q.limit,
    });

    // Counts in parallel — small fan-out, big readability win on the list page.
    const counts = await Promise.all(
      tenants.map(async (t) => {
        const [users, employers, jobs] = await Promise.all([
          c.var.db.user.count({ where: { tenantId: t.id } }),
          c.var.db.employerProfile.count({
            where: { tenantId: t.id, deletedAt: null },
          }),
          c.var.db.jobPosting.count({ where: { tenantId: t.id, deletedAt: null } }),
        ]);
        return { users, employers, jobs };
      }),
    );

    return ok(c, {
      tenants: tenants.map((t, i) => ({
        id: t.id,
        slug: t.slug,
        name: t.name,
        deletedAt: t.deletedAt?.toISOString() ?? null,
        createdAt: t.createdAt.toISOString(),
        updatedAt: t.updatedAt.toISOString(),
        settings: t.settings,
        counts: counts[i]!,
      })),
    });
  },
);

adminDirectoryRoutes.get('/tenants/:id', async (c) => {
  const id = c.req.param('id');
  const t = await c.var.db.tenant.findUnique({ where: { id } });
  if (!t) return err(c, 404, 'not_found');

  const [users, employers, jobs, applications, enrollments] = await Promise.all([
    c.var.db.user.count({ where: { tenantId: id } }),
    c.var.db.employerProfile.count({ where: { tenantId: id, deletedAt: null } }),
    c.var.db.jobPosting.count({ where: { tenantId: id, deletedAt: null } }),
    c.var.db.application.count({ where: { tenantId: id, deletedAt: null } }),
    c.var.db.enrollment.count({ where: { tenantId: id, deletedAt: null } }),
  ]);

  return ok(c, {
    tenant: {
      id: t.id,
      slug: t.slug,
      name: t.name,
      settings: t.settings,
      deletedAt: t.deletedAt?.toISOString() ?? null,
      createdAt: t.createdAt.toISOString(),
      updatedAt: t.updatedAt.toISOString(),
    },
    counts: { users, employers, jobs, applications, enrollments },
  });
});

const patchTenantBody = z
  .object({
    suspended: z.boolean().optional(),
    name: z.string().min(1).max(200).optional(),
  })
  .strict();

adminDirectoryRoutes.patch(
  '/tenants/:id',
  validate('json', patchTenantBody),
  async (c) => {
    if (c.var.orgRole !== 'org:super_admin') {
      return err(c, 403, 'forbidden', 'super_admin required to mutate tenants');
    }
    const id = c.req.param('id');
    const body = c.var.body;

    const existing = await c.var.db.tenant.findUnique({ where: { id } });
    if (!existing) return err(c, 404, 'not_found');

    const next = await c.var.db.tenant.update({
      where: { id },
      data: {
        ...(body.name !== undefined ? { name: body.name } : {}),
        ...(body.suspended !== undefined
          ? { deletedAt: body.suspended ? new Date() : null }
          : {}),
      },
    });

    await c.var.audit.log({
      action: 'admin.data.exported',
      metadata: {
        exportType: 'tenant.mutated',
        rowCount: 1,
        filterDigest: JSON.stringify({ id, body }),
      },
    });

    return ok(c, { tenant: { id: next.id, name: next.name, deletedAt: next.deletedAt } });
  },
);

// ─── users ──────────────────────────────────────────────────────────────────

const listUsersQuery = z
  .object({
    search: z.string().min(1).max(200).optional(),
    role: z.enum(['worker', 'employer', 'admin', 'training_org']).optional(),
    tenantId: z.string().uuid().optional(),
    limit: z.coerce.number().int().min(1).max(500).default(100),
  })
  .strict();

adminDirectoryRoutes.get(
  '/users',
  validate('query', listUsersQuery),
  async (c) => {
    const q = c.var.body;
    const where: Record<string, unknown> = {};
    if (q.role) where['role'] = q.role;
    if (q.tenantId) where['tenantId'] = q.tenantId;
    if (q.search) {
      where['OR'] = [
        { id: { contains: q.search } },
        { email: { contains: q.search, mode: 'insensitive' } },
        { phone: { contains: q.search } },
      ];
    }

    const users = await c.var.db.user.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: q.limit,
      select: {
        id: true,
        tenantId: true,
        role: true,
        email: true,
        phone: true,
        preferredLang: true,
        onboarded: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return ok(c, {
      users: users.map((u) => ({
        id: u.id,
        tenantId: u.tenantId,
        role: u.role,
        email: u.email,
        phone: u.phone,
        preferredLang: u.preferredLang,
        onboarded: u.onboarded,
        createdAt: u.createdAt.toISOString(),
        updatedAt: u.updatedAt.toISOString(),
      })),
    });
  },
);

adminDirectoryRoutes.get('/users/:id', async (c) => {
  const id = c.req.param('id');
  const user = await c.var.db.user.findUnique({
    where: { id },
    include: {
      tenant: { select: { id: true, name: true, slug: true } },
      workerProfile: {
        select: { firstName: true, lastName: true, county: true, onboardedAt: true },
      },
      employerContacts: {
        where: { deletedAt: null },
        take: 1,
        orderBy: { createdAt: 'asc' },
        select: {
          employer: {
            select: {
              id: true,
              legalName: true,
              licenseType: true,
              flcVerifiedAt: true,
            },
          },
        },
      },
    },
  });
  if (!user) return err(c, 404, 'not_found');

  const [applications, enrollments] = await Promise.all([
    c.var.db.application.count({ where: { workerId: id, deletedAt: null } }),
    c.var.db.enrollment.count({ where: { workerId: id, deletedAt: null } }),
  ]);

  return ok(c, {
    user: {
      id: user.id,
      tenantId: user.tenantId,
      tenantName: user.tenant?.name ?? null,
      role: user.role,
      email: user.email,
      phone: user.phone,
      preferredLang: user.preferredLang,
      permissions: user.permissions,
      consentMethod: user.consentMethod,
      consentedAt: user.consentedAt?.toISOString() ?? null,
      smsOptInState: user.smsOptInState,
      onboarded: user.onboarded,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
      workerProfile: user.workerProfile
        ? {
            firstName: user.workerProfile.firstName,
            lastName: user.workerProfile.lastName,
            county: user.workerProfile.county,
            onboardedAt: user.workerProfile.onboardedAt?.toISOString() ?? null,
          }
        : null,
      employerProfile: user.employerContacts[0]?.employer
        ? {
            id: user.employerContacts[0].employer.id,
            legalName: user.employerContacts[0].employer.legalName,
            licenseType: user.employerContacts[0].employer.licenseType,
            verified: user.employerContacts[0].employer.flcVerifiedAt !== null,
          }
        : null,
    },
    counts: { applications, enrollments },
  });
});

// ─── employers (directory + detail) ─────────────────────────────────────────

const listEmployersQuery = z
  .object({
    search: z.string().min(1).max(200).optional(),
    licenseType: z.enum(['grower', 'flc', 'labor_contractor']).optional(),
    verified: z.enum(['true', 'false', 'pending']).optional(),
    tenantId: z.string().uuid().optional(),
    limit: z.coerce.number().int().min(1).max(500).default(100),
  })
  .strict();

adminDirectoryRoutes.get(
  '/employers',
  validate('query', listEmployersQuery),
  async (c) => {
    const q = c.var.body;
    const where: Record<string, unknown> = { deletedAt: null };
    if (q.licenseType) where['licenseType'] = q.licenseType;
    if (q.tenantId) where['tenantId'] = q.tenantId;
    if (q.verified === 'true') where['flcVerifiedAt'] = { not: null };
    if (q.verified === 'false') where['rejectedAt'] = { not: null };
    if (q.verified === 'pending') {
      where['flcVerifiedAt'] = null;
      where['rejectedAt'] = null;
    }
    if (q.search) {
      where['OR'] = [
        { legalName: { contains: q.search, mode: 'insensitive' } },
        { dbaName: { contains: q.search, mode: 'insensitive' } },
        { ein: { contains: q.search } },
        { flcLicenseNum: { contains: q.search } },
        { contactEmail: { contains: q.search, mode: 'insensitive' } },
      ];
    }

    const rows = await c.var.db.employerProfile.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: q.limit,
      select: {
        id: true,
        tenantId: true,
        legalName: true,
        dbaName: true,
        licenseType: true,
        flcLicenseNum: true,
        county: true,
        flcVerifiedAt: true,
        rejectedAt: true,
        createdAt: true,
        contactEmail: true,
      },
    });

    return ok(c, {
      employers: rows.map((e) => ({
        id: e.id,
        tenantId: e.tenantId,
        legalName: e.legalName,
        dbaName: e.dbaName,
        licenseType: e.licenseType,
        flcLicenseNum: e.flcLicenseNum,
        county: e.county,
        contactEmail: e.contactEmail,
        verified: e.flcVerifiedAt !== null,
        rejected: e.rejectedAt !== null,
        createdAt: e.createdAt.toISOString(),
      })),
    });
  },
);

adminDirectoryRoutes.get('/employers/:id', async (c) => {
  const id = c.req.param('id');
  const e = await c.var.db.employerProfile.findUnique({
    where: { id },
    include: { tenant: { select: { id: true, name: true, slug: true } } },
  });
  if (!e) return err(c, 404, 'not_found');

  const [postingsCount, applicationsCount, hiresCount, verificationLog] = await Promise.all([
    c.var.db.jobPosting.count({ where: { employerId: id, deletedAt: null } }),
    c.var.db.application.count({
      where: { job: { employerId: id }, deletedAt: null },
    }),
    c.var.db.application.count({
      where: { job: { employerId: id }, status: 'hired', deletedAt: null },
    }),
    c.var.db.verificationLog.findMany({
      where: { employerId: id },
      orderBy: { createdAt: 'desc' },
      take: 25,
    }),
  ]);

  return ok(c, {
    employer: {
      id: e.id,
      tenantId: e.tenantId,
      tenantName: e.tenant.name,
      legalName: e.legalName,
      dbaName: e.dbaName,
      contactEmail: e.contactEmail,
      contactPhone: e.contactPhone,
      licenseType: e.licenseType,
      ein: e.ein,
      flcLicenseNum: e.flcLicenseNum,
      dolMspaNum: e.dolMspaNum,
      county: e.county,
      streetAddress: e.streetAddress,
      city: e.city,
      flcVerifiedAt: e.flcVerifiedAt?.toISOString() ?? null,
      flcCheckStatus: e.flcCheckStatus,
      rejectedAt: e.rejectedAt?.toISOString() ?? null,
      rejectionReason: e.rejectionReason,
      verifiedBy: e.verifiedBy,
      plan: e.plan,
      createdAt: e.createdAt.toISOString(),
      updatedAt: e.updatedAt.toISOString(),
    },
    counts: { postings: postingsCount, applications: applicationsCount, hires: hiresCount },
    verificationLog: verificationLog.map((l) => ({
      id: l.id,
      action: l.action,
      actorUserId: l.actorUserId,
      notes: l.notes,
      payload: l.payload,
      createdAt: l.createdAt.toISOString(),
    })),
  });
});

// ─── workers ────────────────────────────────────────────────────────────────

const listWorkersQuery = z
  .object({
    search: z.string().min(1).max(200).optional(),
    county: z.enum(['Fresno', 'Kern', 'Kings', 'Madera', 'Tulare']).optional(),
    limit: z.coerce.number().int().min(1).max(500).default(100),
  })
  .strict();

adminDirectoryRoutes.get(
  '/workers',
  validate('query', listWorkersQuery),
  async (c) => {
    const q = c.var.body;
    const where: Record<string, unknown> = {
      role: 'worker',
      tenantId: null,
    };
    if (q.search) {
      where['OR'] = [
        { id: { contains: q.search } },
        { email: { contains: q.search, mode: 'insensitive' } },
        { phone: { contains: q.search } },
        { workerProfile: { firstName: { contains: q.search, mode: 'insensitive' } } },
        { workerProfile: { lastName: { contains: q.search, mode: 'insensitive' } } },
      ];
    }
    if (q.county) {
      where['workerProfile'] = { county: q.county };
    }

    const rows = await c.var.db.user.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: q.limit,
      include: {
        workerProfile: {
          select: {
            firstName: true,
            lastName: true,
            county: true,
            onboardedAt: true,
            skills: true,
          },
        },
      },
    });

    return ok(c, {
      workers: rows.map((u) => ({
        id: u.id,
        email: u.email,
        phone: u.phone,
        preferredLang: u.preferredLang,
        onboarded: u.onboarded,
        firstName: u.workerProfile?.firstName ?? null,
        lastName: u.workerProfile?.lastName ?? null,
        county: u.workerProfile?.county ?? null,
        skills: u.workerProfile?.skills ?? [],
        onboardedAt: u.workerProfile?.onboardedAt?.toISOString() ?? null,
        createdAt: u.createdAt.toISOString(),
      })),
    });
  },
);

adminDirectoryRoutes.get('/workers/:id', async (c) => {
  const id = c.req.param('id');
  const user = await c.var.db.user.findUnique({
    where: { id },
    include: { workerProfile: true },
  });
  if (!user || user.role !== 'worker') return err(c, 404, 'not_found');

  const [applications, enrollments, certs] = await Promise.all([
    c.var.db.application.findMany({
      where: { workerId: id, deletedAt: null },
      orderBy: { appliedAt: 'desc' },
      take: 25,
      include: {
        job: { select: { titleEn: true, employerId: true } },
      },
    }),
    c.var.db.enrollment.findMany({
      where: { workerId: id, deletedAt: null },
      orderBy: { enrolledAt: 'desc' },
      take: 25,
      include: { program: { select: { titleEn: true, funder: true, county: true } } },
    }),
    c.var.db.enrollment.count({
      where: { workerId: id, deletedAt: null, certificateId: { not: null } },
    }),
  ]);

  return ok(c, {
    worker: {
      id: user.id,
      email: user.email,
      phone: user.phone,
      preferredLang: user.preferredLang,
      consentMethod: user.consentMethod,
      consentedAt: user.consentedAt?.toISOString() ?? null,
      smsOptInState: user.smsOptInState,
      onboarded: user.onboarded,
      createdAt: user.createdAt.toISOString(),
      profile: user.workerProfile
        ? {
            firstName: user.workerProfile.firstName,
            lastName: user.workerProfile.lastName,
            zipCode: user.workerProfile.zipCode,
            county: user.workerProfile.county,
            skills: user.workerProfile.skills,
            certifications: user.workerProfile.certifications,
            onboardedAt: user.workerProfile.onboardedAt?.toISOString() ?? null,
          }
        : null,
    },
    certCount: certs,
    applications: applications.map((a) => ({
      id: a.id,
      status: a.status,
      jobTitle: a.job.titleEn,
      employerId: a.job.employerId,
      appliedAt: a.appliedAt.toISOString(),
      hiredAt: a.hiredAt?.toISOString() ?? null,
      wageOffered: a.wageOffered ? Number(a.wageOffered) : null,
    })),
    enrollments: enrollments.map((e) => ({
      id: e.id,
      status: e.status,
      programTitle: e.program.titleEn,
      funder: e.program.funder,
      county: e.program.county,
      enrolledAt: e.enrolledAt.toISOString(),
      completedAt: e.completedAt?.toISOString() ?? null,
      certificateId: e.certificateId,
    })),
  });
});
