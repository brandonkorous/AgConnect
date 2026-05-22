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
  CreateShiftSeriesBody,
  PatchShiftBody,
  DuplicateShiftBody,
  AssignWorkerBody,
  PatchAssignmentBody,
} from '@agconn/schemas';
import {
  requireAuth,
  requireActiveEmployer,
  requireEmployerPermission,
  requireTenant,
  type AuthVars,
} from '../../middleware/authContext.js';
import type { AuditCtxVars } from '../../middleware/audit.js';
import { shapeShift, shapeShiftSeries } from './shape.js';
import { expandSeriesDates } from './series.js';

export const employerShiftsRoutes = new Hono<{ Variables: AuthVars & AuditCtxVars }>();
employerShiftsRoutes.use('*', requireAuth('crews'));
employerShiftsRoutes.use('*', requireActiveEmployer);
employerShiftsRoutes.use('*', requireTenant);

employerShiftsRoutes.get('/', requireEmployerPermission('crews.read'), validate('query', ShiftQuery), async (c) => {
  const employerId = c.var.employerId!;
  const tenantId = c.var.tenantId!;
  const q = c.var.body;

  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  const fromDate = q.from ? new Date(q.from) : today;
  const toDate = q.to ? new Date(q.to) : new Date(fromDate.getTime() + 60 * 24 * 60 * 60 * 1000);

  const shifts = await c.var.db.shift.findMany({
    where: {
      employerId,
      tenantId,
      shiftDate: { gte: fromDate, lte: toDate },
      crew:
        c.var.employerScope === 'self_crew'
          ? { foremanUserId: c.var.userId, ...(q.crewId ? { id: q.crewId } : {}) }
          : q.crewId
            ? { id: q.crewId }
            : undefined,
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
employerShiftsRoutes.get('/schedule.csv', requireEmployerPermission('crews.read'), async (c) => {
  const employerId = c.var.employerId!;
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
      employerId,
      tenantId,
      shiftDate: { gte: fromDate, lte: toDate },
      crew: c.var.employerScope === 'self_crew' ? { foremanUserId: c.var.userId } : undefined,
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

employerShiftsRoutes.post('/', requireEmployerPermission('crews.manage'), validate('json', CreateShiftBody), async (c) => {
  const employerId = c.var.employerId!;
  const tenantId = c.var.tenantId!;
  const body = c.var.body;

  if (body.crewId) {
    const crew = await c.var.db.crew.findFirst({
      where: { id: body.crewId, employerId, tenantId, deletedAt: null },
    });
    if (!crew) return err(c, 422, 'crew_not_found');
  }

  const created = await c.var.db.$transaction(async (tx) => {
    const baseData = {
      tenantId,
      employerId,
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
    const shift = await tx.shift.create({
      data: { ...baseData, shiftDate: new Date(body.shiftDate) },
    });

    if (body.assignWorkerUserIds && body.assignWorkerUserIds.length > 0) {
      const checked = await Promise.all(
        body.assignWorkerUserIds.map(async (wId) => {
          const ok = await isActiveHire(tx, employerId, wId);
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

// Create a shift series: one shift_series row plus one materialized shift per
// matching weekday between rangeStart and rangeEnd. The web create page only
// calls this when the range resolves to more than one date; a single date goes
// through POST / as a plain one-off shift.
employerShiftsRoutes.post(
  '/series',
  requireEmployerPermission('crews.manage'),
  validate('json', CreateShiftSeriesBody),
  async (c) => {
    const employerId = c.var.employerId!;
    const tenantId = c.var.tenantId!;
    const body = c.var.body;

    if (body.crewId) {
      const crew = await c.var.db.crew.findFirst({
        where: { id: body.crewId, employerId, tenantId, deletedAt: null },
      });
      if (!crew) return err(c, 422, 'crew_not_found');
    }

    const dates = expandSeriesDates(body.rangeStart, body.rangeEnd, body.weekdayMask);
    if (dates.length === 0) return err(c, 422, 'series_no_matching_dates');

    const series = await c.var.db.$transaction(async (tx) => {
      const series = await tx.shiftSeries.create({
        data: {
          tenantId,
          employerId,
          crewId: body.crewId ?? null,
          rangeStart: new Date(`${body.rangeStart}T00:00:00.000Z`),
          rangeEnd: new Date(`${body.rangeEnd}T00:00:00.000Z`),
          weekdayMask: body.weekdayMask,
          shiftCount: dates.length,
        },
      });

      const baseData = {
        tenantId,
        employerId,
        seriesId: series.id,
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
      const created = [] as Array<Awaited<ReturnType<typeof tx.shift.create>>>;
      for (const d of dates) {
        const shift = await tx.shift.create({
          data: { ...baseData, shiftDate: new Date(`${d}T00:00:00.000Z`) },
        });
        created.push(shift);
      }

      if (body.assignWorkerUserIds && body.assignWorkerUserIds.length > 0) {
        const checked = await Promise.all(
          body.assignWorkerUserIds.map(async (wId) => {
            const okHire = await isActiveHire(tx, employerId, wId);
            return okHire ? wId : null;
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
      return series;
    });

    await c.var.audit.log({
      action: 'employer.shift_series.created',
      resourceId: series.id,
      metadata: {
        seriesId: series.id,
        crewId: series.crewId ?? '',
        rangeStart: body.rangeStart,
        rangeEnd: body.rangeEnd,
        shiftCount: dates.length,
      },
    });

    return ok(c, { series: shapeShiftSeries(series), shiftCount: dates.length });
  },
);

employerShiftsRoutes.get('/:id', requireEmployerPermission('crews.read'), async (c) => {
  const employerId = c.var.employerId!;
  const tenantId = c.var.tenantId!;
  const id = c.req.param('id');

  const shift = await c.var.db.shift.findFirst({
    where: {
      id,
      employerId,
      tenantId,
      crew: c.var.employerScope === 'self_crew' ? { foremanUserId: c.var.userId } : undefined,
    },
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

employerShiftsRoutes.patch('/:id', requireEmployerPermission('crews.manage'), validate('json', PatchShiftBody), async (c) => {
  const employerId = c.var.employerId!;
  const tenantId = c.var.tenantId!;
  const id = c.req.param('id');
  const body = c.var.body;

  const existing = await c.var.db.shift.findFirst({
    where: { id, employerId, tenantId },
  });
  if (!existing) return err(c, 404, 'not_found');

  if (body.crewId) {
    const crew = await c.var.db.crew.findFirst({
      where: { id: body.crewId, employerId, tenantId, deletedAt: null },
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
  requireEmployerPermission('crews.manage'),
  validate('json', DuplicateShiftBody),
  async (c) => {
    const employerId = c.var.employerId!;
    const tenantId = c.var.tenantId!;
    const id = c.req.param('id');
    const body = c.var.body;

    const source = await c.var.db.shift.findFirst({
      where: { id, employerId, tenantId },
    });
    if (!source) return err(c, 404, 'not_found');

    const targetCrewId = body.crewId === undefined ? source.crewId : body.crewId;
    if (targetCrewId) {
      const crew = await c.var.db.crew.findFirst({
        where: { id: targetCrewId, employerId, tenantId, deletedAt: null },
      });
      if (!crew) return err(c, 422, 'crew_not_found');
    }

    const created = await c.var.db.shift.create({
      data: {
        tenantId,
        employerId,
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

employerShiftsRoutes.delete('/:id', requireEmployerPermission('crews.manage'), async (c) => {
  const employerId = c.var.employerId!;
  const tenantId = c.var.tenantId!;
  const id = c.req.param('id');

  const existing = await c.var.db.shift.findFirst({
    where: { id, employerId, tenantId },
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

employerShiftsRoutes.post('/:id/assign', requireEmployerPermission('crews.manage'), validate('json', AssignWorkerBody), async (c) => {
  const employerId = c.var.employerId!;
  const tenantId = c.var.tenantId!;
  const id = c.req.param('id');
  const body = c.var.body;

  const shift = await c.var.db.shift.findFirst({
    where: { id, employerId, tenantId },
  });
  if (!shift) return err(c, 404, 'not_found');

  const okHire = await isActiveHire(c.var.db as unknown as Tx, employerId, body.workerUserId);
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
  requireEmployerPermission('crews.record'),
  validate('json', PatchAssignmentBody),
  async (c) => {
    const employerId = c.var.employerId!;
    const tenantId = c.var.tenantId!;
    const id = c.req.param('id');
    const aId = c.req.param('aId');
    const body = c.var.body;

    const shift = await c.var.db.shift.findFirst({
      where: { id, employerId, tenantId },
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

async function isActiveHire(db: Tx, employerId: string, workerUserId: string): Promise<boolean> {
  const hired = await db.application.findFirst({
    where: {
      workerId: workerUserId,
      status: AppStatus.hired,
      job: { employerId, deletedAt: null },
    },
    select: { id: true },
  });
  return Boolean(hired);
}
