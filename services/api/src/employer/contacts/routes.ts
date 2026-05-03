// Employer contacts (foreman / lead picker source). Lives under the employer's
// profile so contacts persist across job postings.

import { Hono } from 'hono';
import { ok, err, validate } from '@agconn/api-client/server';
import { EmployerContactInput } from '@agconn/schemas';
import { requireAuth, requireRole, requireTenant, type AuthVars } from '../../middleware/authContext';
import type { AuditCtxVars } from '../../middleware/audit';

export const employerContactsRoutes = new Hono<{ Variables: AuthVars & AuditCtxVars }>();
employerContactsRoutes.use('*', requireAuth);
employerContactsRoutes.use('*', requireRole('employer'));
employerContactsRoutes.use('*', requireTenant);

employerContactsRoutes.get('/', async (c) => {
  const userId = c.var.userId;
  const profile = await c.var.db.employerProfile.findUnique({ where: { userId } });
  if (!profile) return err(c, 404, 'not_found');

  const rows = await c.var.db.employerContact.findMany({
    where: { employerId: profile.id, deletedAt: null },
    orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
  });
  return ok(c, { contacts: rows.map(toView) });
});

employerContactsRoutes.post('/', validate('json', EmployerContactInput), async (c) => {
  const userId = c.var.userId;
  const tenantId = c.var.tenantId!;
  const body = c.var.body;

  const profile = await c.var.db.employerProfile.findUnique({ where: { userId } });
  if (!profile) return err(c, 404, 'not_found');

  const created = await c.var.db.employerContact.create({
    data: {
      tenantId,
      employerId: profile.id,
      name: body.name,
      phone: body.phone,
      role: body.role,
      languages: body.languages,
      sortOrder: body.sortOrder,
    },
  });

  await c.var.audit.log({
    action: 'employer.contact.created',
    resourceId: created.id,
    metadata: { name: body.name, role: body.role },
  });

  return ok(c, { contact: toView(created) });
});

employerContactsRoutes.patch('/:id', validate('json', EmployerContactInput.partial()), async (c) => {
  const userId = c.var.userId;
  const id = c.req.param('id');
  const body = c.var.body;

  const profile = await c.var.db.employerProfile.findUnique({ where: { userId } });
  if (!profile) return err(c, 404, 'not_found');

  const existing = await c.var.db.employerContact.findFirst({
    where: { id, employerId: profile.id, deletedAt: null },
  });
  if (!existing) return err(c, 404, 'not_found');

  const updated = await c.var.db.employerContact.update({
    where: { id },
    data: {
      name: body.name ?? undefined,
      phone: body.phone ?? undefined,
      role: body.role ?? undefined,
      languages: body.languages ?? undefined,
      sortOrder: body.sortOrder ?? undefined,
    },
  });
  return ok(c, { contact: toView(updated) });
});

employerContactsRoutes.delete('/:id', async (c) => {
  const userId = c.var.userId;
  const id = c.req.param('id');

  const profile = await c.var.db.employerProfile.findUnique({
    where: { userId },
  });
  if (!profile) return err(c, 404, 'not_found');

  const existing = await c.var.db.employerContact.findFirst({
    where: { id, employerId: profile.id, deletedAt: null },
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
});

function toView(r: {
  id: string;
  name: string;
  phone: string;
  role: string;
  languages: string[];
  sortOrder: number;
}) {
  return {
    id: r.id,
    name: r.name,
    phone: r.phone,
    role: r.role,
    languages: r.languages as ('en' | 'es')[],
    sortOrder: r.sortOrder,
  };
}
