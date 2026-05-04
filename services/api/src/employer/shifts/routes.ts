import { Hono } from 'hono';
import { ok, err, validate } from '@agconn/api-client/server';
import {
  ShiftStatus,
  ShiftAssignmentStatus,
  ShiftType,
  AppStatus,
  type Tx,
} from '@agconn/db';
import { enqueueSms } from '@agconn/sms';
import {
  ShiftQuery,
  CreateShiftBody,
  PatchShiftBody,
  DuplicateShiftBody,
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

// audit-required:exempt — CSV view of already-stored shift schedule.
employerShiftsRoutes.get('/schedule.csv', async (c) => {
  const userId = c.var.userId;
  const tenantId = c.var.tenantId!;
  const fromQ = c.req.query('from');
  const toQ = c.req.query('to');
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  const fromDate = fromQ ? new Date(fromQ) : today;
  const toDate = toQ
    ? new Date(toQ)
    : new Date(fromDate.getTime() + 30 * 24 * 60 * 60 * 1000);

  const shifts = await c.var.db.shift.findMany({
    where: {
      employerId: userId,
      tenantId,
      shiftDate: { gte: fromDate, lte: toDate },
    },
    orderBy: [{ shiftDate: 'asc' }, { startTime: 'asc' }],
    include: {
      crew: { select: { name: true } },
      assignments: { select: { status: true } },
    },
  });

  const rows: string[][] = [
    [
      'date',
      'crew',
      'start_time',
      'end_time',
      'location',
      'status',
      'assigned',
      'confirmed',
      'notes',
    ],
  ];
  for (const s of shifts) {
    const assigned = s.assignments.length;
    const confirmed = s.assignments.filter(
      (a) =>
        a.status === ShiftAssignmentStatus.confirmed ||
        a.status === ShiftAssignmentStatus.completed,
    ).length;
    rows.push([
      s.shiftDate.toISOString().slice(0, 10),
      s.crew?.name ?? '',
      s.startTime,
      s.endTime ?? '',
      s.locationLabel ?? '',
      s.status,
      String(assigned),
      String(confirmed),
      s.notes ?? '',
    ]);
  }

  const filename = `agconn-schedule-${fromDate.toISOString().slice(0, 10)}.csv`;
  return new Response(toCsv(rows), {
    status: 200,
    headers: {
      'content-type': 'text/csv; charset=utf-8',
      'content-disposition': `attachment; filename="${filename}"`,
    },
  });
});

function toCsv(rows: string[][]): string {
  return rows
    .map((row) =>
      row
        .map((cell) => {
          const s = String(cell ?? '');
          return /[,"\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
        })
        .join(','),
    )
    .join('\r\n');
}

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
    const baseData = {
      tenantId,
      employerId: userId,
      crewId: body.crewId ?? null,
      jobId: body.jobId ?? null,
      startTime: body.startTime,
      endTime: body.endTime ?? null,
      locationLabel: body.locationLabel,
      locationLat: body.locationLat ?? null,
      locationLng: body.locationLng ?? null,
      shiftType: (body.shiftType ?? 'work') as ShiftType,
      metadata: (body.metadata ?? {}) as object,
      notes: body.notes ?? null,
    };
    const dates = [body.shiftDate, ...(body.repeatDates ?? [])].filter(
      (d, i, arr) => arr.indexOf(d) === i,
    );
    const created = [] as Array<Awaited<ReturnType<typeof tx.shift.create>>>;
    for (const d of dates) {
      const shift = await tx.shift.create({
        data: { ...baseData, shiftDate: new Date(d) },
      });
      created.push(shift);
    }

    if (body.assignWorkerUserIds && body.assignWorkerUserIds.length > 0) {
      const checked = await Promise.all(
        body.assignWorkerUserIds.map(async (wId) => {
          const ok = await isActiveHire(tx, userId, wId);
          return ok ? wId : null;
        }),
      );
      const valid = checked.filter((x): x is string => Boolean(x));
      for (const shift of created) {
        for (const wId of valid) {
          await tx.shiftAssignment.create({
            data: { tenantId, shiftId: shift.id, workerUserId: wId },
          });
        }
      }
    }
    return created[0]!;
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

  if (body.crewId) {
    const crew = await c.var.db.crew.findFirst({
      where: { id: body.crewId, employerId: userId, tenantId, deletedAt: null },
    });
    if (!crew) return err(c, 422, 'crew_not_found');
  }

  const updated = await c.var.db.shift.update({
    where: { id },
    data: {
      crewId: body.crewId === null ? null : (body.crewId ?? undefined),
      shiftDate: body.shiftDate ? new Date(body.shiftDate) : undefined,
      startTime: body.startTime ?? undefined,
      endTime: body.endTime === null ? null : (body.endTime ?? undefined),
      locationLabel: body.locationLabel ?? undefined,
      locationLat: body.locationLat === null ? null : (body.locationLat ?? undefined),
      locationLng: body.locationLng === null ? null : (body.locationLng ?? undefined),
      status: body.status ?? undefined,
      shiftType: (body.shiftType as ShiftType | undefined) ?? undefined,
      metadata: body.metadata ? (body.metadata as object) : undefined,
      notes: body.notes === null ? null : (body.notes ?? undefined),
    },
    include: {
      crew: { select: { name: true } },
      assignments: {
        select: { id: true, status: true, workerUserId: true },
      },
    },
  });

  // Optional sibling-shift expansion: spawn new shifts on each repeatDate
  // mirroring the just-saved values. Skip dates that already exist for this
  // crew at the same start time.
  if (body.repeatDates && body.repeatDates.length > 0) {
    for (const d of body.repeatDates) {
      const exists = await c.var.db.shift.findFirst({
        where: {
          employerId: userId,
          tenantId,
          crewId: updated.crewId,
          shiftDate: new Date(d),
          startTime: updated.startTime,
        },
      });
      if (exists) continue;
      await c.var.db.shift.create({
        data: {
          tenantId,
          employerId: userId,
          crewId: updated.crewId,
          jobId: updated.jobId,
          shiftDate: new Date(d),
          startTime: updated.startTime,
          endTime: updated.endTime,
          locationLabel: updated.locationLabel,
          locationLat: updated.locationLat,
          locationLng: updated.locationLng,
          shiftType: updated.shiftType,
          metadata: updated.metadata as object,
          notes: updated.notes,
        },
      });
    }
  }

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

  if (body.notifyCrew && updated.assignments.length > 0) {
    const dateStr = updated.shiftDate.toISOString().slice(0, 10);
    for (const a of updated.assignments) {
      // Idempotent on (jobKey) — re-saving a shift twice within the same
      // minute won't re-blast SMS. The minute granularity is intentional:
      // distinct edits a few seconds apart get the same notification, so we
      // dedupe at the queue.
      const key = `shift-update-${id}-${a.workerUserId}-${Date.now() / 60000 | 0}`;
      try {
        await enqueueSms({
          tenantId,
          userId: a.workerUserId,
          template: 'worker.shift.updated',
          vars: {
            shiftDate: dateStr,
            startTime: updated.startTime,
            location: updated.locationLabel,
          },
          jobKey: key,
        });
      } catch (e) {
        // Swallow: failed enqueue must not block the save. The audit log
        // still records the edit.
        console.error('shift-update SMS enqueue failed', { id, workerId: a.workerUserId, err: e });
      }
    }
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

employerShiftsRoutes.post(
  '/:id/duplicate',
  validate('json', DuplicateShiftBody),
  async (c) => {
    const userId = c.var.userId;
    const tenantId = c.var.tenantId!;
    const id = c.req.param('id');
    const body = c.var.body;

    const source = await c.var.db.shift.findFirst({
      where: { id, employerId: userId, tenantId },
    });
    if (!source) return err(c, 404, 'not_found');

    const targetCrewId = body.crewId === undefined ? source.crewId : body.crewId;
    if (targetCrewId) {
      const crew = await c.var.db.crew.findFirst({
        where: { id: targetCrewId, employerId: userId, tenantId, deletedAt: null },
      });
      if (!crew) return err(c, 422, 'crew_not_found');
    }

    const created = await c.var.db.shift.create({
      data: {
        tenantId,
        employerId: userId,
        crewId: targetCrewId,
        jobId: source.jobId,
        shiftDate: new Date(body.shiftDate),
        startTime: source.startTime,
        endTime: source.endTime,
        locationLabel: source.locationLabel,
        locationLat: source.locationLat,
        locationLng: source.locationLng,
        shiftType: source.shiftType,
        metadata: source.metadata as object,
        notes: source.notes,
      },
      include: {
        crew: { select: { name: true } },
        assignments: { select: { id: true, status: true } },
      },
    });

    await c.var.audit.log({
      action: 'employer.shift.created',
      resourceId: created.id,
      metadata: {
        shiftId: created.id,
        sourceShiftId: id,
        shiftDate: created.shiftDate.toISOString().slice(0, 10),
      },
    });

    return ok(c, {
      shift: shapeShift(created, {
        crewName: created.crew?.name ?? null,
        assignedCount: created.assignments.length,
        confirmedCount: created.assignments.filter((a) =>
          a.status === ShiftAssignmentStatus.confirmed ||
          a.status === ShiftAssignmentStatus.completed,
        ).length,
      }),
    });
  },
);

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
