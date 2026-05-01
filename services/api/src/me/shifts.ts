import { Hono } from 'hono';
import { ok, err } from '@agconn/api-client/server';
import { ShiftAssignmentStatus } from '@agconn/db';
import { requireAuth, requireRole, type AuthVars } from '../middleware/authContext';
import type { AuditCtxVars } from '../middleware/audit';

// Worker-facing view of their assigned Shifts. Reads through ShiftAssignment
// (the join row) and surfaces the parent Shift + employer name.

export const meShiftsRoutes = new Hono<{ Variables: AuthVars & AuditCtxVars }>();
meShiftsRoutes.use('*', requireAuth);
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
          crew: true,
          job: true,
        },
      },
    },
    orderBy: { shift: { shiftDate: 'asc' } },
  });

  return ok(c, {
    shifts: assignments.map((a) => ({
      id: a.id,
      status: a.status,
      hoursWorked: a.hoursWorked ? Number(a.hoursWorked.toString()) : null,
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
        jobTitleEn: a.shift.job?.titleEn ?? null,
        jobTitleEs: a.shift.job?.titleEs ?? null,
      },
    })),
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
