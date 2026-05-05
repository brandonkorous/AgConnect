import { Hono } from 'hono';
import { ok, err } from '@agconn/api-client/server';
import { ShiftAssignmentStatus } from '@agconn/db';
import { requireAuth, requireRole, type AuthVars } from '../middleware/authContext';
import type { AuditCtxVars } from '../middleware/audit';

// Worker-facing view of their assigned Shifts. Reads through ShiftAssignment
// (the join row) and surfaces the parent Shift + employer name.

export const meShiftsRoutes = new Hono<{ Variables: AuthVars & AuditCtxVars }>();
meShiftsRoutes.use('*', requireAuth('me'));
meShiftsRoutes.use('*', requireRole('worker'));

meShiftsRoutes.get('/', async (c) => {
  const workerId = c.var.userId;
  const tenantId = c.var.tenantId;
  if (!tenantId) return err(c, 403, 'no_tenant');

  const url = new URL(c.req.url);
  const fromParam = url.searchParams.get('from');
  const toParam = url.searchParams.get('to');
  const from = fromParam ? new Date(fromParam) : new Date();
  if (!fromParam) from.setUTCHours(0, 0, 0, 0);
  const to = toParam ? new Date(toParam) : new Date(from.getTime() + 60 * 24 * 60 * 60 * 1000);

  const assignments = await c.var.db.shiftAssignment.findMany({
    where: {
      workerUserId: workerId,
      shift: { shiftDate: { gte: from, lte: to } },
    },
    include: {
      shift: {
        include: {
          employer: { include: { employerProfile: true } },
          crew: { include: { foreman: true } },
        },
      },
    },
    orderBy: { shift: { shiftDate: 'asc' } },
  });

  // Shift.jobId points at JobPosting but the schema doesn't declare the
  // relation, so we resolve titles in a single follow-up query.
  const jobIds = Array.from(
    new Set(assignments.map((a) => a.shift.jobId).filter((id): id is string => Boolean(id))),
  );
  const jobs = jobIds.length
    ? await c.var.db.jobPosting.findMany({
        where: { id: { in: jobIds } },
        select: { id: true, titleEn: true, titleEs: true },
      })
    : [];
  const jobById = new Map(jobs.map((j) => [j.id, j]));

  return ok(c, {
    shifts: assignments.map((a) => {
      const job = a.shift.jobId ? jobById.get(a.shift.jobId) ?? null : null;
      const foreman = a.shift.crew?.foreman ?? null;
      return {
        id: a.id,
        status: a.status,
        hoursWorked: a.hoursWorked ? Number(a.hoursWorked.toString()) : null,
        arrivedAt: a.arrivedAt ? a.arrivedAt.toISOString() : null,
        shift: {
          id: a.shift.id,
          date: a.shift.shiftDate.toISOString().slice(0, 10),
          startTime: a.shift.startTime,
          endTime: a.shift.endTime,
          locationLabel: a.shift.locationLabel,
          locationLat: a.shift.locationLat ? Number(a.shift.locationLat.toString()) : null,
          locationLng: a.shift.locationLng ? Number(a.shift.locationLng.toString()) : null,
          status: a.shift.status,
          notes: a.shift.notes,
          employer:
            a.shift.employer?.employerProfile?.dbaName ??
            a.shift.employer?.employerProfile?.legalName ??
            'AgConn employer',
          crewName: a.shift.crew?.name ?? null,
          foremanPhone: foreman?.phone ?? null,
          jobTitleEn: job?.titleEn ?? null,
          jobTitleEs: job?.titleEs ?? null,
        },
      };
    }),
  });
});

meShiftsRoutes.post('/:assignmentId/confirm', async (c) => {
  const id = c.req.param('assignmentId');
  const assignment = await c.var.db.shiftAssignment.findFirst({
    where: { id, workerUserId: c.var.userId },
  });
  if (!assignment) return err(c, 404, 'not_found');
  if (assignment.status !== ShiftAssignmentStatus.assigned) {
    return err(c, 422, 'validation_failed', 'cannot_confirm_at_status');
  }
  const updated = await c.var.db.shiftAssignment.update({
    where: { id },
    data: { status: ShiftAssignmentStatus.confirmed as never },
  });
  await c.var.audit.log({
    action: 'worker.profile.updated',
    resourceId: id,
    metadata: { fields: 'shift.confirmed' },
  });
  return ok(c, { id: updated.id, status: updated.status });
});

meShiftsRoutes.post('/:assignmentId/decline', async (c) => {
  const id = c.req.param('assignmentId');
  const assignment = await c.var.db.shiftAssignment.findFirst({
    where: { id, workerUserId: c.var.userId },
  });
  if (!assignment) return err(c, 404, 'not_found');
  if (assignment.status !== ShiftAssignmentStatus.assigned) {
    return err(c, 422, 'validation_failed', 'cannot_decline_at_status');
  }
  const updated = await c.var.db.shiftAssignment.update({
    where: { id },
    data: { status: ShiftAssignmentStatus.declined as never },
  });
  await c.var.audit.log({
    action: 'worker.profile.updated',
    resourceId: id,
    metadata: { fields: 'shift.declined' },
  });
  return ok(c, { id: updated.id, status: updated.status });
});

// Field Mode "I'm here" tile. Records the worker's arrival timestamp without
// promoting status — the assignment stays at `assigned` or `confirmed`, and
// the foreman/HR system reads `arrived_at` separately to clock the worker in.
meShiftsRoutes.post('/:assignmentId/arrive', async (c) => {
  const id = c.req.param('assignmentId');
  const assignment = await c.var.db.shiftAssignment.findFirst({
    where: { id, workerUserId: c.var.userId },
  });
  if (!assignment) return err(c, 404, 'not_found');
  if (assignment.status === ShiftAssignmentStatus.declined) {
    return err(c, 422, 'validation_failed', 'cannot_arrive_at_declined');
  }
  if (assignment.arrivedAt) {
    return ok(c, { id: assignment.id, arrivedAt: assignment.arrivedAt.toISOString() });
  }
  const updated = await c.var.db.shiftAssignment.update({
    where: { id },
    data: { arrivedAt: new Date() },
  });
  await c.var.audit.log({
    action: 'worker.profile.updated',
    resourceId: id,
    metadata: { fields: 'shift.arrived' },
  });
  return ok(c, { id: updated.id, arrivedAt: updated.arrivedAt!.toISOString() });
});
