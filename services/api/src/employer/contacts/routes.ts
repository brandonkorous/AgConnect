// Employer contacts (foreman / lead-picker source for the job form dropdown).
// Backed by the membership roster (employer_contacts). The legacy free-text
// `role` is now a role-catalog key; rich membership management lives in the
// /v1/employer/members domain. This surface stays for the job-posting
// foreman picker and simple non-login contacts.

import { Hono } from 'hono';
import { ok, err, validate } from '@agconn/api-client/server';
import { EmployerContactInput } from '@agconn/schemas';
import type { Tx } from '@agconn/db';
import {
  requireAuth,
  requireActiveEmployer,
  requireEmployerPermission,
  requireTenant,
  type AuthVars,
} from '../../middleware/authContext.js';
import type { AuditCtxVars } from '../../middleware/audit.js';

export const employerContactsRoutes = new Hono<{ Variables: AuthVars & AuditCtxVars }>();
employerContactsRoutes.use('*', requireAuth('employer'));
employerContactsRoutes.use('*', requireActiveEmployer);
employerContactsRoutes.use('*', requireTenant);

type ContactRow = {
  id: string;
  name: string;
  phone: string;
  languages: string[];
  sortOrder: number;
  role: { key: string };
};

const ROW_SELECT = {
  id: true,
  name: true,
  phone: true,
  languages: true,
  sortOrder: true,
  role: { select: { key: true } },
} as const;

function toView(r: ContactRow) {
  return {
    id: r.id,
    name: r.name,
    phone: r.phone,
    role: r.role.key,
    languages: r.languages as ('en' | 'es')[],
    sortOrder: r.sortOrder,
  };
}

async function resolveRoleId(db: Tx, key: string): Promise<string | null> {
  const role = await db.role.findFirst({
    where: { tenantId: null, key, deletedAt: null },
    select: { id: true },
  });
  return role?.id ?? null;
}

employerContactsRoutes.get('/', requireEmployerPermission('jobs.read'), async (c) => {
  const employerId = c.var.employerId!;
  const rows = await c.var.db.employerContact.findMany({
    where: { employerId, deletedAt: null },
    orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    select: ROW_SELECT,
  });
  return ok(c, { contacts: rows.map((r) => toView(r as ContactRow)) });
});

employerContactsRoutes.post(
  '/',
  requireEmployerPermission('members.manage'),
  validate('json', EmployerContactInput),
  async (c) => {
    const employerId = c.var.employerId!;
    const tenantId = c.var.tenantId!;
    const body = c.var.body;

    const roleId = await resolveRoleId(c.var.db as unknown as Tx, body.role);
    if (!roleId) return err(c, 422, 'unknown_role');

    const created = await c.var.db.employerContact.create({
      data: {
        tenantId,
        employerId,
        name: body.name,
        phone: body.phone,
        roleId,
        languages: body.languages,
        sortOrder: body.sortOrder,
      },
      select: ROW_SELECT,
    });

    await c.var.audit.log({
      action: 'employer.contact.created',
      resourceId: created.id,
      metadata: { name: body.name, role: body.role },
    });

    return ok(c, { contact: toView(created as ContactRow) });
  },
);

employerContactsRoutes.patch(
  '/:id',
  requireEmployerPermission('members.manage'),
  validate('json', EmployerContactInput.partial()),
  async (c) => {
    const employerId = c.var.employerId!;
    const id = c.req.param('id');
    const body = c.var.body;

    const existing = await c.var.db.employerContact.findFirst({
      where: { id, employerId, deletedAt: null },
      select: { id: true },
    });
    if (!existing) return err(c, 404, 'not_found');

    let roleId: string | undefined;
    if (body.role) {
      const resolved = await resolveRoleId(c.var.db as unknown as Tx, body.role);
      if (!resolved) return err(c, 422, 'unknown_role');
      roleId = resolved;
    }

    const updated = await c.var.db.employerContact.update({
      where: { id },
      data: {
        name: body.name ?? undefined,
        phone: body.phone ?? undefined,
        roleId,
        languages: body.languages ?? undefined,
        sortOrder: body.sortOrder ?? undefined,
      },
      select: ROW_SELECT,
    });
    return ok(c, { contact: toView(updated as ContactRow) });
  },
);

employerContactsRoutes.delete(
  '/:id',
  requireEmployerPermission('members.manage'),
  async (c) => {
    const employerId = c.var.employerId!;
    const id = c.req.param('id');

    const existing = await c.var.db.employerContact.findFirst({
      where: { id, employerId, deletedAt: null },
      select: { id: true },
    });
    if (!existing) return err(c, 404, 'not_found');

    await c.var.db.employerContact.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    await c.var.audit.log({
      action: 'employer.contact.deleted',
      resourceId: id,
      metadata: {},
    });

    return ok(c, { ok: true });
  },
);
