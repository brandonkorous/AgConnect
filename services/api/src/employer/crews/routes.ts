import { Hono } from 'hono';
import { ok, err, validate } from '@agconn/api-client/server';
import { CrewMemberRole, AppStatus, type Tx } from '@agconn/db';
import {
  CreateCrewBody,
  PatchCrewBody,
  AddCrewMemberBody,
  SetForemanBody,
} from '@agconn/schemas';
import {
  requireAuth,
  requireRole,
  requireTenant,
  type AuthVars,
} from '../../middleware/authContext';
import type { AuditCtxVars } from '../../middleware/audit';
import { shapeCrew, shapeMember } from './shape';

export const employerCrewsRoutes = new Hono<{ Variables: AuthVars & AuditCtxVars }>();
employerCrewsRoutes.use('*', requireAuth);
employerCrewsRoutes.use('*', requireRole('employer'));
employerCrewsRoutes.use('*', requireTenant);

employerCrewsRoutes.get('/', async (c) => {
  const userId = c.var.userId;
  const tenantId = c.var.tenantId!;

  const crews = await c.var.db.crew.findMany({
    where: { employerId: userId, tenantId, deletedAt: null },
    orderBy: [{ createdAt: 'asc' }],
    include: {
      _count: { select: { members: true } },
      members: { where: { leftAt: null }, select: { id: true } },
    },
  });

  return ok(c, {
    crews: crews.map((cr) =>
      shapeCrew(cr, { memberCount: cr._count.members, activeMemberCount: cr.members.length }),
    ),
  });
});

employerCrewsRoutes.post('/', validate('json', CreateCrewBody), async (c) => {
  const userId = c.var.userId;
  const tenantId = c.var.tenantId!;
  const body = c.var.body;

  if (body.foremanUserId) {
    const ok2 = await isActiveHire(c.var.db as unknown as Tx, userId, body.foremanUserId);
    if (!ok2) return err(c, 422, 'worker_not_active_hire');
  }

  const created = await c.var.db.crew.create({
    data: {
      tenantId,
      employerId: userId,
      foremanUserId: body.foremanUserId ?? null,
      jobId: body.jobId ?? null,
      name: body.name,
      color: body.color,
      notes: body.notes ?? null,
    },
  });

  if (body.foremanUserId) {
    await c.var.db.crewMember.create({
      data: {
        tenantId,
        crewId: created.id,
        workerUserId: body.foremanUserId,
        role: CrewMemberRole.lead,
      },
    });
  }

  await c.var.audit.log({
    action: 'employer.crew.created',
    resourceId: created.id,
    metadata: { crewId: created.id, name: created.name },
  });

  return ok(c, { crew: shapeCrew(created, { memberCount: body.foremanUserId ? 1 : 0, activeMemberCount: body.foremanUserId ? 1 : 0 }) });
});

employerCrewsRoutes.get('/:id', async (c) => {
  const userId = c.var.userId;
  const tenantId = c.var.tenantId!;
  const id = c.req.param('id');

  const crew = await c.var.db.crew.findFirst({
    where: { id, employerId: userId, tenantId, deletedAt: null },
    include: {
      members: {
        where: { leftAt: null },
        include: { worker: { include: { workerProfile: true } } },
        orderBy: [{ role: 'asc' }, { joinedAt: 'asc' }],
      },
    },
  });
  if (!crew) return err(c, 404, 'not_found');

  return ok(c, {
    crew: shapeCrew(crew, { memberCount: crew.members.length, activeMemberCount: crew.members.length }),
    members: crew.members.map((m) =>
      shapeMember(m, m.worker.workerProfile?.firstName ?? '', m.worker.workerProfile?.lastName ?? ''),
    ),
  });
});

employerCrewsRoutes.patch('/:id', validate('json', PatchCrewBody), async (c) => {
  const userId = c.var.userId;
  const tenantId = c.var.tenantId!;
  const id = c.req.param('id');
  const body = c.var.body;

  const existing = await c.var.db.crew.findFirst({
    where: { id, employerId: userId, tenantId, deletedAt: null },
  });
  if (!existing) return err(c, 404, 'not_found');

  const updated = await c.var.db.crew.update({
    where: { id },
    data: {
      name: body.name ?? undefined,
      color: body.color ?? undefined,
      foremanUserId: body.foremanUserId === null ? null : (body.foremanUserId ?? undefined),
      jobId: body.jobId === null ? null : (body.jobId ?? undefined),
      notes: body.notes === null ? null : (body.notes ?? undefined),
    },
  });

  await c.var.audit.log({
    action: 'employer.crew.updated',
    resourceId: id,
    metadata: { crewId: id, fields: Object.keys(body) },
  });

  return ok(c, { crew: shapeCrew(updated, { memberCount: 0, activeMemberCount: 0 }) });
});

employerCrewsRoutes.delete('/:id', async (c) => {
  const userId = c.var.userId;
  const tenantId = c.var.tenantId!;
  const id = c.req.param('id');

  const existing = await c.var.db.crew.findFirst({
    where: { id, employerId: userId, tenantId, deletedAt: null },
  });
  if (!existing) return err(c, 404, 'not_found');

  await c.var.db.crew.update({
    where: { id },
    data: { deletedAt: new Date() },
  });

  await c.var.audit.log({
    action: 'employer.crew.archived',
    resourceId: id,
    metadata: { crewId: id },
  });

  return ok(c, { ok: true });
});

employerCrewsRoutes.post('/:id/members', validate('json', AddCrewMemberBody), async (c) => {
  const userId = c.var.userId;
  const tenantId = c.var.tenantId!;
  const id = c.req.param('id');
  const body = c.var.body;

  const crew = await c.var.db.crew.findFirst({
    where: { id, employerId: userId, tenantId, deletedAt: null },
  });
  if (!crew) return err(c, 404, 'not_found');

  const okHire = await isActiveHire(c.var.db as unknown as Tx, userId, body.workerUserId);
  if (!okHire) return err(c, 422, 'worker_not_active_hire');

  const existing = await c.var.db.crewMember.findFirst({
    where: { crewId: id, workerUserId: body.workerUserId, leftAt: null },
  });
  if (existing) return err(c, 409, 'already_member');

  const member = await c.var.db.crewMember.create({
    data: {
      tenantId,
      crewId: id,
      workerUserId: body.workerUserId,
      role: body.role === 'lead' ? CrewMemberRole.lead : CrewMemberRole.member,
    },
    include: { worker: { include: { workerProfile: true } } },
  });

  if (body.role === 'lead') {
    await c.var.db.crew.update({ where: { id }, data: { foremanUserId: body.workerUserId } });
  }

  await c.var.audit.log({
    action: 'employer.crew.member.added',
    resourceId: member.id,
    metadata: { crewId: id, workerUserId: body.workerUserId, role: body.role },
  });

  return ok(c, {
    member: shapeMember(
      member,
      member.worker.workerProfile?.firstName ?? '',
      member.worker.workerProfile?.lastName ?? '',
    ),
  });
});

employerCrewsRoutes.delete('/:id/members/:userId', async (c) => {
  const employerUserId = c.var.userId;
  const tenantId = c.var.tenantId!;
  const id = c.req.param('id');
  const memberUserId = c.req.param('userId');

  const crew = await c.var.db.crew.findFirst({
    where: { id, employerId: employerUserId, tenantId, deletedAt: null },
  });
  if (!crew) return err(c, 404, 'not_found');

  const member = await c.var.db.crewMember.findFirst({
    where: { crewId: id, workerUserId: memberUserId, leftAt: null },
  });
  if (!member) return err(c, 404, 'not_found');

  await c.var.db.crewMember.update({
    where: { id: member.id },
    data: { leftAt: new Date() },
  });

  if (crew.foremanUserId === memberUserId) {
    await c.var.db.crew.update({ where: { id }, data: { foremanUserId: null } });
  }

  await c.var.audit.log({
    action: 'employer.crew.member.removed',
    resourceId: member.id,
    metadata: { crewId: id, workerUserId: memberUserId },
  });

  return ok(c, { ok: true });
});

employerCrewsRoutes.post('/:id/foreman', validate('json', SetForemanBody), async (c) => {
  const userId = c.var.userId;
  const tenantId = c.var.tenantId!;
  const id = c.req.param('id');
  const body = c.var.body;

  const crew = await c.var.db.crew.findFirst({
    where: { id, employerId: userId, tenantId, deletedAt: null },
  });
  if (!crew) return err(c, 404, 'not_found');

  const okHire = await isActiveHire(c.var.db as unknown as Tx, userId, body.workerUserId);
  if (!okHire) return err(c, 422, 'worker_not_active_hire');

  await c.var.db.$transaction(async (tx) => {
    // Demote any current lead.
    await tx.crewMember.updateMany({
      where: { crewId: id, role: CrewMemberRole.lead, leftAt: null },
      data: { role: CrewMemberRole.member },
    });
    // Ensure target is an active member.
    const existing = await tx.crewMember.findFirst({
      where: { crewId: id, workerUserId: body.workerUserId, leftAt: null },
    });
    if (existing) {
      await tx.crewMember.update({ where: { id: existing.id }, data: { role: CrewMemberRole.lead } });
    } else {
      await tx.crewMember.create({
        data: {
          tenantId,
          crewId: id,
          workerUserId: body.workerUserId,
          role: CrewMemberRole.lead,
        },
      });
    }
    await tx.crew.update({ where: { id }, data: { foremanUserId: body.workerUserId } });
  });

  await c.var.audit.log({
    action: 'employer.crew.updated',
    resourceId: id,
    metadata: { crewId: id, fields: ['foremanUserId'] },
  });

  const updated = await c.var.db.crew.findUnique({ where: { id } });
  return ok(c, { crew: shapeCrew(updated!, { memberCount: 0, activeMemberCount: 0 }) });
});

async function isActiveHire(db: Tx, employerUserId: string, workerUserId: string): Promise<boolean> {
  const hired = await db.application.findFirst({
    where: {
      workerId: workerUserId,
      status: AppStatus.hired,
      job: { employerId: employerUserId, deletedAt: null },
    },
    select: { id: true },
  });
  return Boolean(hired);
}
