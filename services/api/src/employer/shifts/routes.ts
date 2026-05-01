import { Hono } from 'hono';
import { ok, err, validate } from '@agconn/api-client/server';
import { ShiftStatus, ShiftAssignmentStatus, AppStatus, type Tx } from '@agconn/db';
import {
  ShiftQuery,
  CreateShiftBody,
  PatchShiftBody,
  AssignWorkerBody,
  PatchAssignmentBody,
} from '@agconn/schemas';
import {
  requireAuth,
  requireRole,
  requireTenant,
  type AuthVars,
} from '../../middleware/authContext';
import type { AuditCtxVars } from '../../middleware/audit';
import { shapeShift } from './shape';

export const employerShiftsRoutes = new Hono<{ Variables: AuthVars & AuditCtxVars }>();
employerShiftsRoutes.use('*', requireAuth);
employerShiftsRoutes.use('*', requireRole('employer'));
employerShiftsRoutes.use('*', requireTenant);

employerShiftsRoutes.get('/', validate('query', ShiftQuery), async (c) => {
  const userId = c.var.userId;
  const tenantId = c.var.tenantId!;
  const q = c.var.body;

  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  const fromDate = q.from ? new Date(q.from) : today;
  const toDate = q.to ? new Date(q.to) : new Date(fromDate.getTime() + 60 * 24 * 60 * 60 * 1000);

  const shifts = await c.var.db.shift.findMany({
    where: {
      employerId: userId,
      tenantId,
      shiftDate: { gte: fromDate, lte: toDate },
      ...(q.crewId ? { crewId: q.crewId } : {}),
    },
    orderBy: [{ shiftDate: 'asc' }, { startTime: 'asc' }],
    take: q.limit,
    include: {
      crew: { select: { name: true } },
      assignments: { select: { id: true, status: true } },
    },
  });

  return ok(c, {
    shifts: shifts.map((s) =>
      shapeShift(s, {
        crewName: s.crew?.name ?? null,
        assignedCount: s.assignments.length,
        confirmedCount: s.assignments.filter((a) =>
          a.status === ShiftAssignmentStatus.confirmed || a.status === ShiftAssignmentStatus.completed,
        ).length,
      }),
    ),
  });
});

employerShiftsRoutes.post('/', validate('json', CreateShiftBody), async (c) => {
  const userId = c.var.userId;
  const tenantId = c.var.tenantId!;
  const body = c.var.body;

  if (body.crewId) {
    const crew = await c.var.db.crew.findFirst({
      where: { id: body.crewId, employerId: userId, tenantId, deletedAt: null },
    });
    if (!crew) return err(c, 422, 'crew_not_found');
  }

  const created = await c.var.db.$transaction(async (tx) => {
    const shift = await tx.shift.create({
      data: {
        tenantId,
        employerId: userId,
        crewId: body.crewId ?? null,
        jobId: body.jobId ?? null,
        shiftDate: new Date(body.shiftDate),
        startTime: body.startTime,
        endTime: body.endTime ?? null,
        locationLabel: body.locationLabel,
        locationLat: body.locationLat ?? null,
        locationLng: body.locationLng ?? null,
        notes: body.notes ?? null,
      },
    });

    if (body.assignWorkerUserIds && body.assignWorkerUserIds.length > 0) {
      const checked = await Promise.all(
        body.assignWorkerUserIds.map(async (wId) => {
          const ok = await isActiveHire(tx, userId, wId);
          return ok ? wId : null;
        }),
      );
      const valid = checked.filter((x): x is string => Boolean(x));
      for (const wId of valid) {
        await tx.shiftAssignment.create({
          data: { tenantId, shiftId: shift.id, workerUserId: wId },
        });
      }
    }
    return shift;
  });

  await c.var.audit.log({
    action: 'employer.shift.created',
    resourceId: created.id,
    metadata: {
      shiftId: created.id,
      crewId: created.crewId ?? '',
      shiftDate: created.shiftDate.toISOString().slice(0, 10),
    },
  });

  const full = await c.var.db.shift.findUnique({
    where: { id: created.id },
    include: { crew: { select: { name: true } }, assignments: { select: { id: true, status: true } } },
  });
  return ok(c, {
    shift: shapeShift(full!, {
      crewName: full!.crew?.name ?? null,
      assignedCount: full!.assignments.length,
      confirmedCount: full!.assignments.filter((a) =>
        a.status === ShiftAssignmentStatus.confirmed || a.status === ShiftAssignmentStatus.completed,
      ).length,
    }),
  });
});

employerShiftsRoutes.get('/:id', async (c) => {
  const userId = c.var.userId;
  const tenantId = c.var.tenantId!;
  const id = c.req.param('id');

  const shift = await c.var.db.shift.findFirst({
    where: { id, employerId: userId, tenantId },
    include: {
      crew: { select: { name: true } },
      assignments: {
        include: { worker: { include: { workerProfile: true } } },
        orderBy: { createdAt: 'asc' },
      },
    },
  });
  if (!shift) return err(c, 404, 'not_found');

  return ok(c, {
    shift: shapeShift(shift, {
      crewName: shift.crew?.name ?? null,
      assignedCount: shift.assignments.length,
      confirmedCount: shift.assignments.filter((a) =>
        a.status === ShiftAssignmentStatus.confirmed || a.status === ShiftAssignmentStatus.completed,
      ).length,
    }),
    assignments: shift.assignments.map((a) => ({
      id: a.id,
      shiftId: a.shiftId,
      workerUserId: a.workerUserId,
      firstName: a.worker.workerProfile?.firstName ?? '',
      lastInitial: (a.worker.workerProfile?.lastName?.[0] ?? '').toUpperCase(),
      status: a.status,
      hoursWorked: a.hoursWorked ? Number(a.hoursWorked.toString()) : null,
      piecesCount: a.piecesCount,
      pieceRateCents: a.pieceRateCents,
    })),
  });
});

employerShiftsRoutes.patch('/:id', validate('json', PatchShiftBody), async (c) => {
  const userId = c.var.userId;
  const tenantId = c.var.tenantId!;
  const id = c.req.param('id');
  const body = c.var.body;

  const existing = await c.var.db.shift.findFirst({
    where: { id, employerId: userId, tenantId },
  });
  if (!existing) return err(c, 404, 'not_found');

  const updated = await c.var.db.shift.update({
    where: { id },
    data: {
      shiftDate: body.shiftDate ? new Date(body.shiftDate) : undefined,
      startTime: body.startTime ?? undefined,
      endTime: body.endTime === null ? null : (body.endTime ?? undefined),
      locationLabel: body.locationLabel ?? undefined,
      locationLat: body.locationLat === null ? null : (body.locationLat ?? undefined),
      locationLng: body.locationLng === null ? null : (body.locationLng ?? undefined),
      status: body.status ?? undefined,
      notes: body.notes === null ? null : (body.notes ?? undefined),
    },
    include: {
      crew: { select: { name: true } },
      assignments: { select: { id: true, status: true } },
    },
  });

  if (body.status === ShiftStatus.cancelled) {
    await c.var.audit.log({
      action: 'employer.shift.cancelled',
      resourceId: id,
      metadata: { shiftId: id, reason: '' },
    });
  } else {
    await c.var.audit.log({
      action: 'employer.shift.updated',
      resourceId: id,
      metadata: { shiftId: id, fields: Object.keys(body) },
    });
  }

  return ok(c, {
    shift: shapeShift(updated, {
      crewName: updated.crew?.name ?? null,
      assignedCount: updated.assignments.length,
      confirmedCount: updated.assignments.filter((a) =>
        a.status === ShiftAssignmentStatus.confirmed || a.status === ShiftAssignmentStatus.completed,
      ).length,
    }),
  });
});

employerShiftsRoutes.delete('/:id', async (c) => {
  const userId = c.var.userId;
  const tenantId = c.var.tenantId!;
  const id = c.req.param('id');

  const existing = await c.var.db.shift.findFirst({
    where: { id, employerId: userId, tenantId },
  });
  if (!existing) return err(c, 404, 'not_found');

  await c.var.db.shift.update({
    where: { id },
    data: { status: ShiftStatus.cancelled },
  });
  await c.var.audit.log({
    action: 'employer.shift.cancelled',
    resourceId: id,
    metadata: { shiftId: id, reason: 'deleted' },
  });
  return ok(c, { ok: true });
});

employerShiftsRoutes.post('/:id/assign', validate('json', AssignWorkerBody), async (c) => {
  const userId = c.var.userId;
  const tenantId = c.var.tenantId!;
  const id = c.req.param('id');
  const body = c.var.body;

  const shift = await c.var.db.shift.findFirst({
    where: { id, employerId: userId, tenantId },
  });
  if (!shift) return err(c, 404, 'not_found');

  const okHire = await isActiveHire(c.var.db as unknown as Tx, userId, body.workerUserId);
  if (!okHire) return err(c, 422, 'worker_not_active_hire');

  const existing = await c.var.db.shiftAssignment.findFirst({
    where: { shiftId: id, workerUserId: body.workerUserId },
  });
  if (existing) return err(c, 409, 'already_assigned');

  const created = await c.var.db.shiftAssignment.create({
    data: {
      tenantId,
      shiftId: id,
      workerUserId: body.workerUserId,
    },
  });

  await c.var.audit.log({
    action: 'employer.shift.assignment.created',
    resourceId: created.id,
    metadata: { shiftId: id, workerUserId: body.workerUserId },
  });

  return ok(c, {
    assignment: {
      id: created.id,
      shiftId: id,
      workerUserId: body.workerUserId,
      status: created.status,
    },
  });
});

employerShiftsRoutes.patch(
  '/:id/assignments/:aId',
  validate('json', PatchAssignmentBody),
  async (c) => {
    const userId = c.var.userId;
    const tenantId = c.var.tenantId!;
    const id = c.req.param('id');
    const aId = c.req.param('aId');
    const body = c.var.body;

    const shift = await c.var.db.shift.findFirst({
      where: { id, employerId: userId, tenantId },
    });
    if (!shift) return err(c, 404, 'not_found');

    const assignment = await c.var.db.shiftAssignment.findFirst({
      where: { id: aId, shiftId: id },
    });
    if (!assignment) return err(c, 404, 'not_found');

    const updated = await c.var.db.shiftAssignment.update({
      where: { id: aId },
      data: {
        status: body.status ?? undefined,
        hoursWorked: body.hoursWorked ?? undefined,
        piecesCount: body.piecesCount ?? undefined,
        pieceRateCents: body.pieceRateCents ?? undefined,
      },
    });

    await c.var.audit.log({
      action: 'employer.shift.assignment.updated',
      resourceId: aId,
      metadata: { shiftId: id, assignmentId: aId, fields: Object.keys(body) },
    });

    return ok(c, {
      assignment: {
        id: updated.id,
        shiftId: id,
        status: updated.status,
        hoursWorked: updated.hoursWorked ? Number(updated.hoursWorked.toString()) : null,
        piecesCount: updated.piecesCount,
        pieceRateCents: updated.pieceRateCents,
      },
    });
  },
);

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
